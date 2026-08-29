import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X, Volume2, Sparkles } from 'lucide-react';
import { VoiceCheckinController } from '../lib/audioRecorder';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptComplete: (transcript: string, durationSeconds: number) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onTranscriptComplete
}) => {
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const controllerRef = useRef<VoiceCheckinController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setSeconds(0);
      setVolume(0);
      const controller = new VoiceCheckinController(
        (text) => setTranscript(text),
        (vol) => setVolume(vol),
        (sec) => setSeconds(sec)
      );
      controllerRef.current = controller;
      controller.start().then((started) => {
        setIsRecording(started);
      });
    } else {
      if (controllerRef.current) {
        controllerRef.current.stop();
        controllerRef.current = null;
      }
      setIsRecording(false);
    }

    return () => {
      if (controllerRef.current) {
        controllerRef.current.stop();
        controllerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (controllerRef.current) {
      const result = controllerRef.current.stop();
      const finalTranscript = result.transcript || transcript || 'Completed voice reflection.';
      onTranscriptComplete(finalTranscript, result.duration || seconds);
    } else {
      onTranscriptComplete(transcript || 'Voice reflection recorded.', seconds);
    }
    onClose();
  };

  const handleCancel = () => {
    if (controllerRef.current) {
      controllerRef.current.stop();
    }
    onClose();
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 p-6 relative">
        <button
          onClick={handleCancel}
          className="absolute top-5 right-5 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Frictionless 60s Voice Check-in</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900">
            Speak Freely
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Gemini listens, transcribes in real-time, and extracts structured insights without you having to type.
          </p>
        </div>

        {/* Dynamic Waveform Visualizer & Microphone Circle */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative">
            {/* Pulsing visual circles */}
            <div 
              className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping"
              style={{
                transform: `scale(${1 + volume / 80})`,
                opacity: isRecording ? 0.6 : 0
              }}
            />
            <div 
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-200 transition-transform duration-75 relative z-10"
              style={{
                transform: `scale(${1 + volume / 200})`
              }}
            >
              <Mic className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          {/* Real-time seconds timer */}
          <div className="mt-4 font-mono text-lg font-semibold text-stone-800">
            {formatTime(seconds)} <span className="text-xs font-normal text-stone-400">/ 1:00</span>
          </div>

          {/* Volume wave bars */}
          <div className="flex items-center space-x-1.5 mt-3 h-8">
            {[0.4, 0.8, 1.2, 0.6, 1.0, 1.4, 0.7, 1.1, 0.5].map((factor, idx) => {
              const barHeight = Math.max(6, Math.min(32, (volume * factor * 0.4)));
              return (
                <div
                  key={idx}
                  className="w-1.5 bg-amber-500 rounded-full transition-all duration-75"
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
          </div>
        </div>

        {/* Live Transcript Box */}
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 min-h-[100px] max-h-[160px] overflow-y-auto mb-6 text-sm text-stone-800 leading-relaxed italic">
          {transcript ? (
            <span>"{transcript}"</span>
          ) : (
            <span className="text-stone-400 font-sans not-italic text-xs flex items-center justify-center h-full pt-4">
              Listening to microphone... Speak about your day, obstacles, or feelings.
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFinish}
            className="flex-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold flex items-center justify-center space-x-2 shadow-sm transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Complete Voice Check-in</span>
          </button>
        </div>
      </div>
    </div>
  );
};
