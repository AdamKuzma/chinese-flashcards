import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import MicWaveform from './MicWaveform';
import MicLightIcon from '../assets/MicLight.svg';
import CheckIcon from '../assets/Check.svg';
import CloseIcon from '../assets/Close.svg';
import SpinnerIcon from '../assets/Spinner.svg';
import { useFlashcardStore } from '../store';

interface DictationModalProps {
  isOpen: boolean;
  onClose: () => void;
  chineseWord: string;
}

export const DictationModal: React.FC<DictationModalProps> = ({
  isOpen,
  onClose,
  chineseWord,
}) => {
  const { setModalOpen } = useFlashcardStore();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [wordCheckResult, setWordCheckResult] = useState<string>('');
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [typedText, setTypedText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recordingPromiseRef = useRef<Promise<Blob> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update modal state in store
  useEffect(() => {
    console.log('DictationModal: Setting modal state to:', isOpen);
    setModalOpen(isOpen);
  }, [isOpen, setModalOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Stop any ongoing recording
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Reset refs
      mediaRecorderRef.current = null;
      
      // Reset state
      setIsRecording(false);
      setTranscription('');
      setIsTranscribing(false);
      setIsProcessingText(false);
      setWordCheckResult('');
      setIsStartingRecording(false);
      setTypedText(''); // Reset text field
      audioChunksRef.current = [];
    }
  }, [isOpen, isRecording]);

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    try {
      setIsTranscribing(true);
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', 'zh'); // Chinese language
      formData.append('response_format', 'text');

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      console.log('API Key exists:', !!apiKey);
      console.log('API Key length:', apiKey ? apiKey.length : 0);
      console.log('API Key starts with sk-:', apiKey ? apiKey.startsWith('sk-') : false);
      console.log('Full API Key (first 10 chars):', apiKey ? apiKey.substring(0, 10) : 'undefined');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Transcription failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const transcriptionText = await response.text();
      return transcriptionText.trim();
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Create a promise that resolves when recording stops
      recordingPromiseRef.current = new Promise<Blob>((resolve) => {
        mediaRecorderRef.current!.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current!.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          stream.getTracks().forEach(track => track.stop());
          console.log('Recording stopped, blob created:', audioBlob.size, 'bytes');
          resolve(audioBlob);
        };
      });

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsStartingRecording(false);

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsStartingRecording(false);
    }
  };



  const handleSaveRecording = async () => {
    // Stop recording first
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    try {
      // Wait for the recording promise to resolve
      if (recordingPromiseRef.current) {
        const blob = await recordingPromiseRef.current;
        console.log('Got audio blob:', blob.size, 'bytes');
        
        // Transcribe the audio
        const transcriptionText = await transcribeAudio(blob);
        setTranscription(transcriptionText);
        console.log('Transcription:', transcriptionText);
        
        // Check if the transcription contains the target word
        if (transcriptionText.includes(chineseWord)) {
          setWordCheckResult('Great! That\'s a natural sentence.');
        } else {
          setWordCheckResult(`You didn't use ${chineseWord} - want to try again?`);
        }
      }
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      setTranscription('Transcription failed, please try again');
    }
    
    // Reset refs
    mediaRecorderRef.current = null;
    recordingPromiseRef.current = null;
    
    // Reset state
    setIsRecording(false);
    audioChunksRef.current = [];
  };

  const handleCancelRecording = () => {
    // Stop recording first
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Reset refs
    mediaRecorderRef.current = null;
    recordingPromiseRef.current = null;
    
    // Reset state
    setIsRecording(false);
    setTranscription('');
    setIsTranscribing(false);
    setWordCheckResult('');
    setIsStartingRecording(false);
    setTypedText('');
    audioChunksRef.current = [];
  };

  const handleSubmitText = async () => {
    if (!typedText.trim()) return;
    
    console.log('Setting isProcessingText to true');
    setIsProcessingText(true);
    setTranscription(typedText.trim()); // Show text immediately without highlighting
    
    // Simulate processing time and check if the text contains the target word
    setTimeout(() => {
      if (typedText.includes(chineseWord)) {
        setWordCheckResult('Great! That\'s a natural sentence.');
      } else {
        setWordCheckResult(`You didn't use ${chineseWord} - want to try again?`);
      }
      console.log('Setting isProcessingText to false');
      setIsProcessingText(false);
    }, 2000); // 2 seconds processing time
  };

  const highlightWordInSentence = (sentence: string, word: string) => {
    if (!sentence || !word) return sentence;
    
    const regex = new RegExp(`(${word})`, 'g');
    return sentence.replace(regex, `<span style="color: #A0C700;">$1</span>`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName="max-w-lg"
      hideHeader={true}
    >
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-0 -right-2 w-8 h-8 flex items-center justify-center text-silver-custom hover:text-light-custom hover:bg-white/10 rounded-lg transition-colors"
          title="Close"
        >
          ✕
        </button>
        
        <div className="text-center py-8 flex flex-col justify-center">
          <p className="text-md text-silver-custom mb-6">
            Try making your own sentence with:
          </p>
          <div className="text-4xl text-light-custom mb-8 font-medium">
            {chineseWord}
          </div>
          
          
          
          {/* Recording Button */}
          <div className="flex justify-center">
            {!isRecording && !transcription && !isTranscribing && !isStartingRecording ? (
              <div className="w-full max-w-md">
                <div className="flex items-center gap-0 bg-granite-custom rounded-full px-1 h-12">
                  <input
                    type="text"
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitText();
                      }
                    }}
                    placeholder="Type or record..."
                    className="flex-1 h-10 px-4 bg-transparent text-light-custom placeholder-silver-custom focus:outline-none"
                  />
                  <button
                    onClick={startRecording}
                    disabled={isProcessingText}
                    className="w-10 h-10 flex items-center justify-center text-light-custom hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Record audio"
                  >
                    <img src={MicLightIcon} alt="Microphone" className="w-5.5 h-5.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md">
                {/* Waveform/Transcription with buttons to the right */}
                <div className="flex items-center gap-0 bg-granite-custom rounded-full px-1 h-12">
                  <div className="flex-1">
                    {transcription ? (
                      <div className="h-12 flex items-center px-4">
                        <p 
                          className="text-md text-light-custom text-left"
                          dangerouslySetInnerHTML={{ 
                            __html: (isTranscribing || isProcessingText) ? transcription : highlightWordInSentence(transcription, chineseWord)
                          }}
                        />
                      </div>
                    ) : (
                      <MicWaveform 
                        height={48}
                        width={330}
                        smoothing={0.1}
                        maxGain={1}
                        barWidth={1.5}
                        bg="#333333"
                        barColor="#ddd"
                        inactiveBarColor="#000000"
                        speedPxPerSec={30}
                        isAnimating={!isTranscribing}
                      />
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-0">
                    {!transcription && (
                      <button
                        onClick={handleCancelRecording}
                        className="w-10 h-10 flex items-center justify-center text-light-custom hover:bg-white/10 rounded-full transition-colors"
                        title="Cancel recording"
                      >
                        <img src={CloseIcon} alt="Cancel" className="w-6 h-6" />
                      </button>
                    )}
                    <button
                      onClick={transcription ? () => {
                        setTranscription('');
                        setWordCheckResult('');
                        setTypedText('');
                        setIsStartingRecording(true);
                        startRecording();
                      } : handleSaveRecording}
                      disabled={isTranscribing}
                      className="w-10 h-10 flex items-center justify-center text-light-custom hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isTranscribing ? "Transcribing..." : transcription ? "Record again" : "Save recording"}
                    >
                      {isTranscribing ? (
                        <img src={SpinnerIcon} alt="Transcribing" className="w-6 h-6 animate-spin" />
                      ) : transcription ? (
                        <img src={MicLightIcon} alt="Record again" className="w-5.5 h-5.5" />
                      ) : (
                        <img src={CheckIcon} alt="Save" className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Word Check Result - below container */}
          <div className="mt-4 text-center h-5">
            {transcription && wordCheckResult && (
              <p className={`text-xs ${wordCheckResult.includes('Great!') ? 'text-[#A0C700]' : 'text-yellow-400'}`}>
                {wordCheckResult}
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DictationModal;
