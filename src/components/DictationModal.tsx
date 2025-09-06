import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import MicIcon from '../assets/Mic.svg';
import CheckIcon from '../assets/Check.svg';
import CloseIcon from '../assets/Close.svg';

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
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [wordCheckResult, setWordCheckResult] = useState<string>('');
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
      setWordCheckResult('');
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

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
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

    } catch (error) {
      console.error('Error starting recording:', error);
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
    audioChunksRef.current = [];
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
        
        <div className="text-center py-8">
          <p className="text-md text-silver-custom mb-6">
            Try making your own sentence with:
          </p>
          <div className="text-4xl text-light-custom mb-8 font-medium">
            {chineseWord}
          </div>
          
          {/* Transcription Result */}
          {transcription && (
            <div className="mb-6 p-4 bg-granite-custom/50 rounded-lg border border-granite-custom">
              <p className="text-sm text-silver-custom mb-2">Transcription:</p>
              <p 
                className="text-lg text-light-custom"
                dangerouslySetInnerHTML={{ 
                  __html: highlightWordInSentence(transcription, chineseWord) 
                }}
              />
              {wordCheckResult && (
                <p className={`text-sm mt-2 ${wordCheckResult.includes('Great!') ? 'text-[#A0C700]' : 'text-yellow-400'}`}>
                  {wordCheckResult}
                </p>
              )}
            </div>
          )}
          
          {/* Transcribing indicator */}
          {isTranscribing && (
            <div className="mb-6 p-4 bg-granite-custom/50 rounded-lg border border-granite-custom">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-light-custom border-t-transparent rounded-full animate-spin"></div>
                <p className="text-silver-custom">Transcribing...</p>
              </div>
            </div>
          )}
          
          {/* Recording Button */}
          <div className="flex justify-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-14 h-14 bg-granite-custom hover:bg-gray-custom rounded-full flex items-center justify-center transition-colors"
              >
                <img src={MicIcon} alt="Microphone" className="w-8 h-8" />
              </button>
            ) : (
              <div className="w-[350px] h-14 bg-granite-custom rounded-full flex items-center justify-between px-4">
                {/* Left side - Breathing circle */}
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-light-custom rounded-full animate-pulse" />
                </div>
                
                {/* Center - Recording text */}
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-silver-custom text-sm">Recording...</span>
                </div>
                
                {/* Right side - Action buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSaveRecording}
                    className="w-8 h-8 flex items-center justify-center text-light-custom hover:bg-white/10 rounded-full transition-colors"
                    title="Save recording"
                  >
                    <img src={CheckIcon} alt="Save" className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelRecording}
                    className="w-8 h-8 flex items-center justify-center text-light-custom hover:bg-white/10 rounded-full transition-colors"
                    title="Cancel recording"
                  >
                    <img src={CloseIcon} alt="Cancel" className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DictationModal;
