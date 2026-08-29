/**
 * Voice Recording & Speech Recognition helper for Frictionless Check-in
 */

// Extend window for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export class VoiceCheckinController {
  private recognition: ISpeechRecognition | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  
  public isRecording = false;
  public transcript = '';
  public duration = 0;
  private timerInterval: NodeJS.Timeout | null = null;

  constructor(
    private onTranscriptUpdate: (text: string) => void,
    private onVolumeUpdate?: (volume: number) => void,
    private onTimeUpdate?: (seconds: number) => void
  ) {}

  public async start(): Promise<boolean> {
    try {
      this.transcript = '';
      this.duration = 0;
      this.isRecording = true;

      // 1. Setup speech recognition if supported in browser
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        this.recognition = new SpeechRecognitionConstructor();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          this.transcript = current;
          this.onTranscriptUpdate(current);
        };

        this.recognition.onerror = (e) => {
          console.warn('Speech recognition notice:', e.error);
        };

        try {
          this.recognition.start();
        } catch (err) {
          console.warn('Recognition start caught:', err);
        }
      }

      // 2. Setup Audio stream for visualizer
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
          const source = this.audioContext.createMediaStreamSource(this.audioStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          source.connect(this.analyser);

          const bufferLength = this.analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateVolume = () => {
            if (!this.isRecording || !this.analyser) return;
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            this.onVolumeUpdate?.(normalized);
            this.animationFrameId = requestAnimationFrame(updateVolume);
          };

          updateVolume();
        }
      }

      // 3. Start seconds timer
      this.timerInterval = setInterval(() => {
        this.duration += 1;
        this.onTimeUpdate?.(this.duration);
      }, 1000);

      return true;
    } catch (error) {
      console.error('Failed to start voice check-in:', error);
      this.stop();
      return false;
    }
  }

  public stop(): { transcript: string; duration: number } {
    this.isRecording = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        // ignore
      }
      this.recognition = null;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    return {
      transcript: this.transcript,
      duration: this.duration
    };
  }
}
