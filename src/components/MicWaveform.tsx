import { useEffect, useRef, useState } from "react";

/**
 * MicWaveform
 * - Live mic input → loudness bars
 * - Bars scroll left continuously
 * - No libraries required
 */
export default function MicWaveform({
  width,
  height = 88,
  bg = "#1e1e1e",
  barColor = "#d8d8d8",
  barWidth = 3,           // visual bar thickness (CSS px)
  gap = 2,                // gap between bars
  speedPxPerSec = 60,     // scroll speed
  smoothing = 0.6,        // EMA smoothing for loudness (0..1)
  maxGain = 1.8,          // boost perceived height (tweak to taste)
  inactiveBarColor = "#666666", // color for inactive/initial bars
  isAnimating = true,     // whether the waveform should animate
}: {
  width?: number;
  height?: number;
  bg?: string;
  barColor?: string;
  barWidth?: number;
  gap?: number;
  speedPxPerSec?: number;
  smoothing?: number;
  maxGain?: number;
  inactiveBarColor?: string;
  isAnimating?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Rolling buffer of bar heights in [0..1]
  const barsRef = useRef<Float32Array | null>(null);
  // Track which bars are initial (not from live audio)
  const initialBarsRef = useRef<boolean[] | null>(null);

  // Sub-pixel scroll offset (in canvas pixels)
  const offsetRef = useRef(0);

  // For EMA smoothing across frames
  const smoothedLevelRef = useRef(0);

  // Device pixel ratio for crispness
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  const [, setReady] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [currentWidth, setCurrentWidth] = useState(width || 0);

  const totalBarPitch = barWidth + gap; // one bar + one gap
  const effectiveWidth = currentWidth || width; // use currentWidth if available, otherwise use width prop
  const barsCount = effectiveWidth ? Math.ceil(effectiveWidth / totalBarPitch) + 2 : 0; // +2 to cover scroll overlap

  // Initialize bars buffer
  useEffect(() => {
    barsRef.current = new Float32Array(barsCount).fill(0); // Start with 0 for same thickness
    initialBarsRef.current = new Array(barsCount).fill(true); // Mark all as initial bars
  }, [barsCount]);

  // Set initial canvas size immediately to prevent flash
  useEffect(() => {
    if (canvasRef.current && width) {
      const canvas = canvasRef.current;
      const cw = Math.floor(width * dpr);
      const ch = Math.floor(height * dpr);
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
  }, [width, height, dpr]);

  // Handle dynamic width changes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        if (newWidth > 0) {
          setCurrentWidth(newWidth);
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      updateWidth();
    });

    // Set up ResizeObserver for dynamic width changes
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  // Start audio + render loop
  useEffect(() => {
    let stopped = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024; // small for low latency level reads
        analyser.smoothingTimeConstant = 0.0; // we do our own smoothing
        analyserRef.current = analyser;

        source.connect(analyser);

        setReady(true);
        renderLoop();
      } catch (e: unknown) {
        setError((e as Error)?.message || "Microphone permission denied");
      }
    };

    start();

    const renderLoop = () => {
      if (stopped) return;
      rafRef.current = requestAnimationFrame(renderLoop);
      if (isAnimating) {
        draw();
      }
    };

    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current!);
      try { sourceRef.current?.disconnect(); } catch { /* ignore */ }
      try { analyserRef.current?.disconnect(); } catch { /* ignore */ }
      audioCtxRef.current?.close().catch(() => {});
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating]);

  function readLevel(): number {
    const analyser = analyserRef.current;
    if (!analyser) return 0;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    // RMS loudness
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length); // 0..~0.5 typical speech
    // Map RMS → perceptual (soft companding)
    let level = Math.tanh(rms * 6) * maxGain; // squish & boost
    if (level > 1) level = 1;

    // Exponential moving average for stability
    smoothedLevelRef.current =
      smoothing * smoothedLevelRef.current + (1 - smoothing) * level;

    return smoothedLevelRef.current;
  }

  function pushBar(v: number) {
    const bars = barsRef.current!;
    const initialBars = initialBarsRef.current!;
    // shift left by 1: cheaper to copy than re-alloc
    bars.copyWithin(0, 1);
    initialBars.copyWithin(0, 1);
    bars[bars.length - 1] = v;
    initialBars[initialBars.length - 1] = false; // New bar is from live audio
  }

  function draw() {
    const canvas = canvasRef.current;
    const bars = barsRef.current;
    const initialBars = initialBarsRef.current;
    if (!canvas || !bars || !initialBars || !effectiveWidth) return;

    // Setup backing store for HiDPI
    const cw = Math.floor(effectiveWidth * dpr);
    const ch = Math.floor(height * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.width = `${effectiveWidth}px`;
      canvas.style.height = `${height}px`;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Advance scroll offset
    const dt = 1 / 60; // assume ~60fps; good enough for smoothness
    offsetRef.current += (speedPxPerSec * dpr) * dt;

    // When offset passes one bar pitch, commit a new bar and wrap offset
    const pitchPx = totalBarPitch * dpr;
    while (offsetRef.current >= pitchPx) {
      offsetRef.current -= pitchPx;
      pushBar(readLevel());
    }

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);

    // Draw bars from right → left with current sub-pixel offset
    const centerY = ch / 2;
    const barW = barWidth * dpr;
    const gapW = gap * dpr;

    // Rightmost bar's right edge pinned to canvas right
    // We offset the whole sequence left by offsetRef for smooth scroll.
    let xRight = cw - offsetRef.current;

    for (let i = bars.length - 1; i >= 0; i--) {
      const hNorm = bars[i];                 // 0..1
      const barH = Math.max(2 * dpr, hNorm * ch * 0.9); // min 2px; 90% of height
      const x = xRight - barW;
      const y = centerY - barH / 2;

      // Use different colors based on whether this is an initial bar or live audio
      ctx.fillStyle = initialBars[i] ? inactiveBarColor : barColor;

      // Rounded rect bars (crisper than strokes at HiDPI)
      roundRect(ctx, x, y, barW, barH, Math.min(barW, 6 * dpr));
      xRight -= (barW + gapW);
      if (xRight < -barW) break; // done if off screen
    }
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
    ctx.fill();
  }

  return (
    <div ref={containerRef} style={{ display: "grid", gap: 8, width: "100%" }}>
      <canvas ref={canvasRef} style={{ borderRadius: "24px 0px 0px 24px" }} />
      {/* <div style={{ color: "#9aa0a6", fontSize: 12 }}>
        {error
          ? `Mic error: ${error}`
          : ready
            ? "Listening… speak to see levels"
            : "Requesting microphone…"}
      </div> */}
    </div>
  );
}