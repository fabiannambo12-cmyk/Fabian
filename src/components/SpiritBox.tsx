import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  Power, 
  Volume2, 
  VolumeX, 
  Activity, 
  History, 
  Ghost, 
  Zap,
  Mic2,
  Settings2,
  Search,
  Trash2,
  Play,
  Clock,
  Download,
  Circle,
  Square,
  Sparkles,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  HelpCircle,
  Send,
  Lock,
  Crown,
  Film,
  X,
  ShieldAlert,
  Camera,
  Video,
  VideoOff,
  Eye
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/src/lib/utils';

// --- Types ---
interface Message {
  id: string;
  text: string;
  timestamp: number;
  frequency: string;
  intensity: number;
  isTemporary?: boolean;
  isDistorted?: boolean;
}

interface EVPRecording {
  id: string;
  timestamp: number;
  audioUrl: string;
  duration: number;
  frequency: string;
  hasAnomaly: boolean;
  paranormalText?: string;
  intensity: number;
}

// --- Audio Hook ---
const useSpiritAudio = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const noiseNode = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const filterNode = useRef<BiquadFilterNode | null>(null);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [staticEnabled, setStaticEnabled] = useState(true);

  const initAudio = useCallback(() => {
    if (audioCtx.current) return;
    
    const Context = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx.current = new Context();
    
    // Simple white noise generator using ScriptProcessor (legacy but reliable for simple noise)
    const bufferSize = 4096;
    const noise = audioCtx.current.createScriptProcessor(bufferSize, 1, 1);
    noise.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // High static noise component 
        output[i] = Math.random() * 2 - 1;
      }
    };
    
    const filter = audioCtx.current.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1.2;

    const gain = audioCtx.current.createGain();
    gain.gain.value = volume;

    const analyser = audioCtx.current.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    analyserNode.current = analyser;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(analyser);
    analyser.connect(audioCtx.current.destination);

    noiseNode.current = noise;
    filterNode.current = filter;
    gainNode.current = gain;
  }, [volume]);

  const toggle = useCallback(() => {
    if (!audioCtx.current) {
      initAudio();
    }
    
    if (audioCtx.current?.state === 'suspended') {
      audioCtx.current.resume();
    }

    setIsStarted(prev => !prev);
  }, [initAudio]);

  const playVoiceAnomaly = useCallback((text?: string) => {
    if (!audioCtx.current || !isStarted) return;
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    // syallables based on words length inside text
    const syllables = text ? Math.min(5, Math.max(2, text.split(" ").length + 2)) : 3;

    for (let i = 0; i < syllables; i++) {
      const startTime = now + i * 0.22;
      const duration = 0.15 + Math.random() * 0.12;

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const bandpassFormant = ctx.createBiquadFilter();

      // Shaky spectral modulation carrier (spooky whisper or unearthly chime tone)
      osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
      
      const freqStart = 110 + Math.random() * 240;
      const freqEnd = freqStart * (0.4 + Math.random() * 0.9);
      osc.frequency.setValueAtTime(freqStart, startTime);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);

      // Eerie tremolo or vibrato to mimic electronic vocal distress
      const vibratoOsc = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibratoOsc.frequency.value = 12 + Math.random() * 14; // rapid ghost shivering tremble
      vibratoGain.gain.value = 35; // freq depth

      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      // Vocal mouth-cavity resonance filters
      bandpassFormant.type = 'bandpass';
      const speechFormants = [380, 500, 720, 1200, 2100];
      const targetResonance = speechFormants[Math.floor(Math.random() * speechFormants.length)];
      
      bandpassFormant.frequency.setValueAtTime(targetResonance || 800, startTime);
      bandpassFormant.frequency.exponentialRampToValueAtTime((targetResonance || 800) * 0.6, startTime + duration);
      bandpassFormant.Q.setValueAtTime(14, startTime); // Narrow peak for eerie ringing / vocal vowel whistle

      // Gain Envelope
      oscGain.gain.setValueAtTime(0, startTime);
      oscGain.gain.linearRampToValueAtTime(0.45, startTime + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      // Graph wiring
      osc.connect(bandpassFormant);
      bandpassFormant.connect(oscGain);

      // Route directly into our shared Analyser Node so visualizer can pick up frequencies perfectly!
      if (analyserNode.current) {
        oscGain.connect(analyserNode.current);
      } else {
        oscGain.connect(ctx.destination);
      }

      vibratoOsc.start(startTime);
      vibratoOsc.stop(startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }
  }, [isStarted]);

  useEffect(() => {
    if (gainNode.current) {
      const targetGain = (isStarted && staticEnabled) ? volume : 0;
      gainNode.current.gain.setTargetAtTime(targetGain, audioCtx.current!.currentTime, 0.1);
    }
  }, [isStarted, volume, staticEnabled]);

  // Simulate frequency sweep
  useEffect(() => {
    if (!isStarted || !filterNode.current) return;

    const interval = setInterval(() => {
      const freq = 500 + Math.random() * 3000;
      const q = 0.5 + Math.random() * 5;
      filterNode.current?.frequency.setTargetAtTime(freq, audioCtx.current!.currentTime, 0.05);
      filterNode.current?.Q.setTargetAtTime(q, audioCtx.current!.currentTime, 0.05);
    }, 150);

    return () => clearInterval(interval);
  }, [isStarted]);

  return { 
    isStarted, 
    toggle, 
    volume, 
    setVolume, 
    staticEnabled, 
    setStaticEnabled, 
    analyserRef: analyserNode, 
    playVoiceAnomaly,
    audioCtxRef: audioCtx
  };
};

// --- Real-time Web Audio API Wave & Spectrum Visualizer ---
const RealTimeVisualizer = ({ 
  analyserRef, 
  isStarted, 
  isFlickering,
  staticEnabled
}: { 
  analyserRef: React.RefObject<AnalyserNode | null>; 
  isStarted: boolean; 
  isFlickering: boolean; 
  staticEnabled: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Static placeholder render when idle or scanner is off
    if (!isStarted || !analyserRef.current) {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 8; i < canvas.width; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 8; j < canvas.height; j += 12) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      // Draw horizontal static line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      return;
    }

    const analyser = analyserRef.current;
    const fftSize = analyser.frequencyBinCount;
    const dataArrayTime = new Uint8Array(fftSize);
    const dataArrayFreq = new Uint8Array(fftSize);

    const render = () => {
      animId = requestAnimationFrame(render);
      
      const w = canvas.width;
      const h = canvas.height;

      // Clean screen with glowing persistence tail
      ctx.fillStyle = 'rgba(5, 5, 5, 0.28)';
      ctx.fillRect(0, 0, w, h);

      // Draw faint scope grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 0.5;
      for (let i = 8; i < w; i += 16) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }
      for (let j = 8; j < h; j += 12) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke();
      }

      // Read time-domain wave data and detect noise amplitude
      analyser.getByteTimeDomainData(dataArrayTime);
      let maxDeflection = 0;
      for (let i = 0; i < fftSize; i++) {
        const deflection = Math.abs(dataArrayTime[i] - 128);
        if (deflection > maxDeflection) {
          maxDeflection = deflection;
        }
      }

      // If static is off and no vocal EVP signal is detected, we draw a synthetic smooth undulating scanning wave
      const isQuietScans = !staticEnabled && maxDeflection < 6;

      // 1. Render background frequency spectrogram bars (spectral reflections)
      analyser.getByteFrequencyData(dataArrayFreq);
      const barCount = 20;
      const barWidth = w / barCount;
      for (let i = 0; i < barCount; i++) {
        let val = dataArrayFreq[Math.floor((i / barCount) * (fftSize * 0.6))];
        
        // If quiet scans (silenced static), render tiny breathing ambient bars
        if (isQuietScans) {
          const oscIndex = (i / barCount) * Math.PI * 3 + (Date.now() * 0.003);
          val = Math.max(0, Math.round((Math.sin(oscIndex) * 0.5 + 0.5) * 20));
        }

        const percent = val / 255;
        const barHeight = percent * h * 0.75;
        
        ctx.fillStyle = isFlickering 
          ? `rgba(255, 255, 255, ${0.15 + percent * 0.2})` 
          : msgDistorted() 
            ? `rgba(168, 85, 247, ${0.12 + percent * 0.2})`
            : `rgba(239, 68, 68, ${0.06 + percent * 0.12})`;
          
        ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
      }

      // Helper helper to see if a ghostly flickering is currently on
      function msgDistorted() {
        return isFlickering;
      }

      // 2. Render foreground live waveform oscilloscope line
      ctx.lineWidth = isFlickering ? 2.5 : 1.3;
      ctx.strokeStyle = isFlickering 
        ? '#ffffff' 
        : !staticEnabled 
          ? 'rgba(168, 85, 247, 0.85)' // Purple aura for quiet / entity scan mode
          : 'rgba(239, 10, 10, 0.9)';   // Pure EVP hot red for static mode
      
      // glowing aura
      ctx.shadowBlur = isFlickering ? 12 : 3;
      ctx.shadowColor = isFlickering 
        ? '#ffffff' 
        : !staticEnabled 
          ? 'rgba(168, 85, 247, 0.9)' 
          : 'rgba(239, 10, 10, 0.9)';

      ctx.beginPath();
      const segmentWidth = w / fftSize;
      let curX = 0;
      const synthOffset = Date.now() * 0.008;

      for (let i = 0; i < fftSize; i++) {
        let curY = h / 2;

        if (isQuietScans) {
          // Render highly polished, slow-rolling scanning sine wave syncing beautifully with muted statics
          const frequencySweepMultiplier = 2.0 + Math.sin(Date.now() * 0.001) * 0.5;
          const radialDistortion = Math.sin((i / fftSize) * Math.PI * frequencySweepMultiplier - synthOffset);
          curY = (h / 2) + radialDistortion * (h * 0.15);
        } else {
          const v = dataArrayTime[i] / 128.0; 
          curY = (v * h) / 2;
        }

        if (i === 0) {
          ctx.moveTo(curX, curY);
        } else {
          ctx.lineTo(curX, curY);
        }
        curX += segmentWidth;
      }

      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // reset shadows
      ctx.shadowBlur = 0;
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isStarted, analyserRef, isFlickering, staticEnabled]);

  return (
    <canvas 
      ref={canvasRef} 
      width={128} 
      height={48} 
      className="absolute inset-0 w-full h-full block bg-[#050505] opacity-90"
    />
  );
};

// --- Supernatural Background/Ambient Wave Animation ---
const SpectralScreenWaves = ({ 
  isStarted, 
  frequency, 
  isFlickering 
}: { 
  isStarted: boolean; 
  frequency: string; 
  isFlickering: boolean; 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Auto-resize canvas to fill display frame securely
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 382;
      canvas.height = canvas.parentElement?.clientHeight || 220;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;

      // Clear but keep transparent so normal CRT background/grid works
      ctx.clearRect(0, 0, w, h);

      if (!isStarted) {
        // Drawing trace flat lines with subtle static ripples
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < w; x += 3) {
          const noiseY = h / 2 + (Math.random() - 0.5) * 1.5;
          if (x === 0) ctx.moveTo(x, noiseY);
          else ctx.lineTo(x, noiseY);
        }
        ctx.stroke();
        return;
      }

      // Scanner Active! Fluid spectral frequency oscillations representing magnetic lines
      const floatFreq = parseFloat(frequency) || 98.0;
      
      // Speed and phase shift respond directly to sintonization frequency and scanning center
      const baseSpeed = 0.03 + (floatFreq % 4) * 0.012;
      offset += baseSpeed;

      // Three layers of shifting sinusoidal waveforms
      const layers = [
        { amplitude: isFlickering ? 35 : 12, spacing: 0.012, color: 'rgba(239, 68, 68, 0.16)', multiplier: 1.0 },
        { amplitude: isFlickering ? 25 : 8, spacing: 0.024, color: 'rgba(239, 68, 68, 0.08)', multiplier: -1.3 },
        { amplitude: isFlickering ? 18 : 5, spacing: 0.036, color: 'rgba(255, 255, 255, 0.04)', multiplier: 1.8 }
      ];

      layers.forEach((layer) => {
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = isFlickering ? 2.0 : 1.0;
        ctx.beginPath();

        if (isFlickering) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
        }

        for (let x = 0; x < w; x += 2) {
          const angle = offset * layer.multiplier + (x * layer.spacing);
          let y = h / 2 + Math.sin(angle) * layer.amplitude;

          // Introduce distortion static bursts if flickering (paranormal manifestation!)
          if (isFlickering) {
            y += (Math.random() - 0.5) * 8;
          } else {
            y += (Math.random() - 0.5) * 1.2;
          }

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      ctx.shadowBlur = 0;
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isStarted, frequency, isFlickering]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0"
    />
  );
};

// --- Signal Strength / EVP Reception Meter ---
const SignalStrengthIndicator = ({ 
  isStarted, 
  isFlickering 
}: { 
  isStarted: boolean; 
  isFlickering: boolean; 
}) => {
  const [signal, setSignal] = useState(0);

  useEffect(() => {
    if (!isStarted) {
      setSignal(0);
      return;
    }

    const interval = setInterval(() => {
      // Normal sweeping signal strength oscillates between 15% and 80%
      // Entity presence flares signal to maximum (75% to 100%)
      let baseMin = 15;
      let baseMax = 80;
      
      if (isFlickering) {
        baseMin = 75;
        baseMax = 100;
      }

      const randomValue = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
      setSignal(randomValue);
    }, 180);

    return () => clearInterval(interval);
  }, [isStarted, isFlickering]);

  // Map value to 10 segmented LED bars
  const totalBars = 10;
  const activeBarsCount = Math.round((signal / 100) * totalBars);

  return (
    <div className="flex items-center gap-1.5 mt-1 select-none font-mono">
      <span className="text-[7.5px] uppercase tracking-wider text-red-500/60 font-bold whitespace-nowrap">
        Señal EVP:
      </span>
      
      {/* 10 Segment horizontal cell grid */}
      <div className="flex gap-[1.5px] items-center">
        {Array.from({ length: totalBars }).map((_, i) => {
          const isActive = isStarted && i < activeBarsCount;
          let colorClass = "bg-zinc-800 border-zinc-900";
          
          if (isActive) {
            if (i < 4) {
              colorClass = "bg-[#f43f5e] shadow-[0_0_4px_rgba(244,63,94,0.6)]";
            } else if (i < 8) {
              colorClass = "bg-[#ef4444] shadow-[0_0_5px_rgba(239,68,68,0.8)]";
            } else {
              colorClass = "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse";
            }
          }
          
          return (
            <div 
              key={i} 
              className={cn(
                "w-1 h-2 rounded-[0.5px] transition-all duration-150 border-[0.5px] border-black/40", 
                colorClass
              )} 
            />
          );
        })}
      </div>

      <span className={cn(
        "text-[8.5px] font-bold tracking-tighter min-w-[24px] text-right transition-colors duration-150",
        isStarted ? (isFlickering ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "text-red-400") : "text-zinc-600"
      )}>
        {isStarted ? `${signal}%` : "---"}
      </span>
    </div>
  );
};

// --- Main Component ---
export default function SpiritBox() {
  const [frequency, setFrequency] = useState("104.5");
  const [entityDetection, setEntityDetection] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('spectral_records_v1');
      return saved ? JSON.parse(saved).slice(0, 10) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const filteredMessages = messages.filter(msg => {
    const q = searchQuery.toLowerCase();
    return msg.text.toLowerCase().includes(q) || msg.frequency.toLowerCase().includes(q);
  });
  const [isScanning, setIsScanning] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);

  const exportSessionLog = () => {
    if (messages.length === 0) return;
    
    const header = `==================================================\n` +
                   `  COMPENDIO DE INVESTIGACIÓN ESPECTRAL - EVP LOG  \n` +
                   `  Generado el: ${new Date().toLocaleString()}\n` +
                   `  Laboratorios de Investigación Paranormal © 2026 \n` +
                   `==================================================\n\n`;
                   
    const body = messages.map((msg, index) => {
      const time = new Date(msg.timestamp).toLocaleString();
      let signalClass = "Eco Débil";
      if (msg.intensity > 70) signalClass = "EVP Clase A";
      else if (msg.intensity > 40) signalClass = "Voz Resonante";
      
      return `[Registro Espectral #${messages.length - index}]\n` +
             `» Fecha/Hora: ${time}\n` +
             `» Frecuencia: ${msg.frequency}\n` +
             `» Mensaje Cryptico: "${msg.text}"\n` +
             `» Clase de Señal: ${signalClass} (Intensidad: ${msg.intensity}%)\n` +
             `--------------------------------------------------`;
    }).join("\n\n");
    
    const fullText = header + body;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registro_espectral_evp_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const { 
    isStarted, 
    toggle, 
    volume, 
    setVolume, 
    staticEnabled, 
    setStaticEnabled, 
    analyserRef, 
    playVoiceAnomaly,
    audioCtxRef
  } = useSpiritAudio();
  
  const [isFlickering, setIsFlickering] = useState(false);

  // --- MONETIZATION & PREMIUM SUITE (OPCIÓN A: CELDA DE ÉTER PREMIUM) ---
  const [batteryLevel, setBatteryLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('spectral_energy_level_v5');
      return saved ? parseFloat(saved) : 100;
    } catch {
      return 100;
    }
  });

  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      return localStorage.getItem('spectral_premium_v5') === 'true';
    } catch {
      return false;
    }
  });

  const [showMonetizationModal, setShowMonetizationModal] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [customQuestion, setCustomQuestion] = useState("");
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [buyingState, setBuyingState] = useState<'none' | 'loading' | 'card_entry' | 'success'>('none');
  const [paymentCard, setPaymentCard] = useState({ number: '', expiry: '', cvv: '', name: '' });

  useEffect(() => {
    localStorage.setItem('spectral_energy_level_v5', batteryLevel.toString());
  }, [batteryLevel]);

  useEffect(() => {
    localStorage.setItem('spectral_premium_v5', isPremium.toString());
  }, [isPremium]);

  // Battery drain loop while the box is actively sintonizando
  useEffect(() => {
    if (!isStarted || isPremium) return;

    const interval = setInterval(() => {
      setBatteryLevel(prev => {
        const next = Math.max(0, prev - 0.45); // drains in ~220 seconds of continuous usage
        if (next <= 0) {
          if (isStarted) {
            toggle();
          }
          setShowMonetizationModal(true);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, isPremium, toggle]);

  // --- EVP Recording States & Web Audio Simulation Circuit ---
  const [evpRecordings, setEvpRecordings] = useState<EVPRecording[]>(() => {
    try {
      const saved = localStorage.getItem('spectral_evp_recordings_v4');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('spectral_evp_recordings_v4', JSON.stringify(evpRecordings));
  }, [evpRecordings]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Playback nodes tracking
  const [currentlyPlayingEVPId, setCurrentlyPlayingEVPId] = useState<string | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const activeOverlayOscsRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      // Clean up active sound sources
      activeSourcesRef.current.forEach(src => {
        try { src.stop(); } catch(e) {}
      });
      activeOverlayOscsRef.current.forEach(osc => {
        try { osc.stop(); } catch(e) {}
      });
    };
  }, []);

  const startEVPRecording = async () => {
    if (!isPremium && batteryLevel < 20) {
      setShowMonetizationModal(true);
      return;
    }
    stopPlayingEVP();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);

        stream.getTracks().forEach(track => track.stop());

        const durationSec = Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000));

        // Random paranormal anomaly generator (60% chance during sweeps)
        const hasAnomaly = Math.random() < 0.60;
        const ANOMALY_TEXTS = [
          "M̸U̶E̶R̸O̶S̶",
          "N̸O̸ ̵H̶A̶Y̸ ̵T̶I̴E̵M̶P̸O̷",
          "¿̶Q̸U̶I̴É̶N̸ ̶E̷R̵E̶S̶?̶",
          "A̶Y̴Ú̴D̵A̵M̵E̸",
          "S̸A̷L̸ ̴A̸H̶O̷R̸A̷",
          "E̷S̴C̸U̵C̷H̸A̷M̶E̷",
          "☠̶ ̷P̶E̷L̴I̸G̴R̵O̶ ☠̶",
          "S̷I̵E̸N̷T̷E̵ ̸E̵L̸ ̴F̷R̸Í̶O̷",
          "†̶ ̴Y̶O̴ ̸T̶E̴ ̵C̵U̸I̶D̶O̴ †̶",
          "E̶L̵L̷O̷S̵ ̴V̷I̷E̸N̶E̷N̸"
        ];
        const paranormalText = hasAnomaly 
          ? ANOMALY_TEXTS[Math.floor(Math.random() * ANOMALY_TEXTS.length)] 
          : undefined;

        const newRec: EVPRecording = {
          id: 'evp_' + Math.random().toString(36).substring(2, 11),
          timestamp: Date.now(),
          audioUrl,
          duration: durationSec,
          frequency: isStarted ? frequency + " MHz" : "Apagado",
          hasAnomaly,
          paranormalText,
          intensity: hasAnomaly ? Math.floor(40 + Math.random() * 59) : 0
        };

        setEvpRecordings(prev => [newRec, ...prev]);
        setIsRecording(false);
        if (!isPremium) {
          setBatteryLevel(prev => Math.max(0, prev - 20));
        }
      };

      recordedChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      setRecordingTime(0);
      setIsRecording(true);
      
      mediaRecorder.start();

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 9) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              try { mediaRecorderRef.current.stop(); } catch(e) {}
            }
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            return 10;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("No se pudo acceder al micrófono para el registro EVP:", err);
      // Fallback for visual experience if blocked
      const confirmMock = window.confirm("Para capturar psicofonías reales es necesario habilitar el micrófono. ¿Quieres simular una grabación de prueba con estática electromagnética?");
      if (confirmMock) {
        setIsRecording(true);
        setRecordingTime(0);
        recordingStartTimeRef.current = Date.now();
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            if (prev >= 6) {
              clearInterval(recordingTimerRef.current!);
              setIsRecording(false);
              const hasAnomaly = Math.random() < 0.70;
              const ANOMALY_TEXTS = ["E̴S̶T̴O̷Y̴ ̷A̷Q̶U̸Í̵", "S̸A̸L̸ ̷D̷E̵ ̸L̸A̸ ̴S̸A̸L̶A̶", "☠̵ ̷L̶I̶B̸E̴R̵T̴A̷D̶ ☠̵", "†̸ ̴F̶R̶Í̴O̴ †̸"];
              const paranormalText = hasAnomaly ? ANOMALY_TEXTS[Math.floor(Math.random() * ANOMALY_TEXTS.length)] : undefined;
              const newRec: EVPRecording = {
                id: 'evp_' + Math.random().toString(36).substring(2, 11),
                timestamp: Date.now(),
                audioUrl: "", // mock
                duration: 6,
                frequency: isStarted ? frequency + " MHz" : "Canal Ruido",
                hasAnomaly,
                paranormalText,
                intensity: hasAnomaly ? Math.floor(40 + Math.random() * 59) : 0
              };
              setEvpRecordings(p => [newRec, ...p]);
              if (!isPremium) {
                setBatteryLevel(prevBattery => Math.max(0, prevBattery - 20));
              }
              return 6;
            }
            return prev + 1;
          });
        }, 1000);
      }
    }
  };

  const stopEVPRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping media recorder:", e);
      }
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const playEVPWithEffects = async (rec: EVPRecording) => {
    stopPlayingEVP();

    if (!rec.audioUrl) {
      // Mock playback simulation
      setCurrentlyPlayingEVPId(rec.id);
      if (audioCtxRef.current) {
        playVoiceAnomaly(rec.paranormalText || "Estática purificada");
      }
      setTimeout(() => {
        setCurrentlyPlayingEVPId(null);
      }, rec.duration * 1000);
      return;
    }

    if (!audioCtxRef.current) {
      const Context = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Context();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    setCurrentlyPlayingEVPId(rec.id);

    try {
      const response = await fetch(rec.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;

      const evpFilter = ctx.createBiquadFilter();
      evpFilter.type = "bandpass";
      evpFilter.frequency.value = 1000;
      evpFilter.Q.value = 3.5;

      const evpDelay = ctx.createDelay();
      evpDelay.delayTime.value = 0.32;
      
      const evpDelayFeedback = ctx.createGain();
      evpDelayFeedback.gain.value = 0.42;

      evpDelay.connect(evpDelayFeedback);
      evpDelayFeedback.connect(evpDelay);

      const distortion = ctx.createWaveShaper();
      const makeDistortionCurve = (amount = 40) => {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0 ; i < n_samples; ++i ) {
          const x = (i * 2) / n_samples - 1;
          curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
      };
      distortion.curve = makeDistortionCurve(50);
      distortion.oversample = '4x';

      const playVolume = ctx.createGain();
      playVolume.gain.value = 1.2;

      sourceNode.connect(distortion);
      distortion.connect(evpFilter);
      evpFilter.connect(playVolume);
      
      evpFilter.connect(evpDelay);
      evpDelay.connect(playVolume);

      if (analyserRef.current) {
        playVolume.connect(analyserRef.current);
      } else {
        playVolume.connect(ctx.destination);
      }

      if (rec.hasAnomaly) {
        setIsFlickering(true);
        const flickerInterval = setInterval(() => {
          setIsFlickering(prev => !prev);
        }, 150);

        setTimeout(() => {
          clearInterval(flickerInterval);
          setIsFlickering(false);
        }, audioBuffer.duration * 1000);

        const anomalyOsc1 = ctx.createOscillator();
        anomalyOsc1.type = "sine";
        anomalyOsc1.frequency.setValueAtTime(80, ctx.currentTime);
        anomalyOsc1.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + audioBuffer.duration);

        const tremoloOsc = ctx.createOscillator();
        tremoloOsc.frequency.value = 13;
        const tremoloGain = ctx.createGain();
        tremoloGain.gain.value = 45;

        tremoloOsc.connect(tremoloGain);
        tremoloGain.connect(anomalyOsc1.frequency);

        const spectralWhistle = ctx.createOscillator();
        spectralWhistle.type = "triangle";
        spectralWhistle.frequency.setValueAtTime(880, ctx.currentTime);
        spectralWhistle.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + audioBuffer.duration);

        const whistleGain = ctx.createGain();
        whistleGain.gain.setValueAtTime(0, ctx.currentTime);
        whistleGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
        whistleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + audioBuffer.duration);

        spectralWhistle.connect(whistleGain);

        const anomalyGain = ctx.createGain();
        anomalyGain.gain.setValueAtTime(0, ctx.currentTime);
        anomalyGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.4);
        anomalyGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + audioBuffer.duration);

        anomalyOsc1.connect(anomalyGain);
        
        if (analyserRef.current) {
          anomalyGain.connect(analyserRef.current);
          whistleGain.connect(analyserRef.current);
        } else {
          anomalyGain.connect(ctx.destination);
          whistleGain.connect(ctx.destination);
        }

        tremoloOsc.start();
        anomalyOsc1.start();
        spectralWhistle.start();

        activeOverlayOscsRef.current.push(anomalyOsc1, tremoloOsc, spectralWhistle);
      }

      sourceNode.onended = () => {
        setCurrentlyPlayingEVPId(null);
      };

      sourceNode.start();
      activeSourcesRef.current.push(sourceNode);

    } catch (err) {
      console.error("Fallo al reproducir psicofonía EVP:", err);
      setCurrentlyPlayingEVPId(null);
    }
  };

  const stopPlayingEVP = () => {
    activeSourcesRef.current.forEach(src => {
      try { src.stop(); } catch(e) {}
    });
    activeSourcesRef.current = [];

    activeOverlayOscsRef.current.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    activeOverlayOscsRef.current = [];

    setCurrentlyPlayingEVPId(null);
  };

  // --- SPECTRAL SISSION VIDEO RECORDER GEAR ---
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraRecording, setIsCameraRecording] = useState(false);
  const [cameraFilter, setCameraFilter] = useState<'nightvision' | 'thermal' | 'spectral' | 'glitch'>('nightvision');
  const [videoDuration, setVideoDuration] = useState(0);
  const [recordedVideos, setRecordedVideos] = useState<Array<{
    id: string;
    url: string;
    name: string;
    timestamp: number;
    duration: number;
    filter: string;
  }>>([]);
  const [showDetectedEntity, setShowDetectedEntity] = useState(false);
  const [detectedEntityName, setDetectedEntityName] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoTimerRef = useRef<any>(null);
  const recordingDurationRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
      }
    };
  }, []);

  const playGhostBeep = () => {
    if (audioCtxRef.current) {
      try {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(980, now);
        osc.frequency.exponentialRampToValueAtTime(1450, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch(e) {}
    }
  };

  const startCamera = async () => {
    if (!isPremium && batteryLevel < 20) {
      setShowMonetizationModal(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "environment"
        },
        audio: false // keep audio off or processed via visualizers to avoid stream collisions
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Video fail", e));
      }
      setIsCameraActive(true);
      if (!isPremium) {
        setBatteryLevel(prev => Math.max(0, prev - 5));
      }
      playGhostBeep();
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Error de acceso a la cámara. Por favor asegúrate de que el navegador tenga permiso para usar la cámara.");
    }
  };

  const stopCamera = () => {
    if (isCameraRecording) {
      stopVideoRecording();
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startVideoRecording = () => {
    if (!cameraStreamRef.current) return;
    if (!isPremium && batteryLevel < 15) {
      setShowMonetizationModal(true);
      return;
    }

    videoChunksRef.current = [];
    recordingDurationRef.current = 0;
    setVideoDuration(0);

    try {
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      const recorder = new MediaRecorder(cameraStreamRef.current, options);
      videoRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: selectedMime || 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        const duration = recordingDurationRef.current;
        
        const newVideo = {
          id: 'vid_' + Math.random().toString(36).substring(2, 11),
          url: videoUrl,
          name: `Captura Espectral ${cameraFilter.toUpperCase()}`,
          timestamp: Date.now(),
          duration: duration,
          filter: cameraFilter
        };

        setRecordedVideos(prev => [newVideo, ...prev]);

        if (!isPremium) {
          setBatteryLevel(prev => Math.max(0, prev - 15));
        }
      };

      recorder.start(1000);
      setIsCameraRecording(true);

      videoTimerRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setVideoDuration(recordingDurationRef.current);

        // Periodically trigger a visual ghost detection alert over the screen feed
        if (recordingDurationRef.current % 8 === 0) {
          const names = [
            "REGISTRO TÉRMICO FRÍO (-3.4°C)",
            "FLUCTUACIÓN EMF ANORMAL",
            "PREGENCIA FANTASMAL CLASE II",
            "ORBE DE PLASMA CONDENSADO",
            "ECO VISUAL DETECTADO"
          ];
          setDetectedEntityName(names[Math.floor(Math.random() * names.length)]);
          setShowDetectedEntity(true);
          playGhostBeep();
          setTimeout(() => setShowDetectedEntity(false), 3000);
        }

        if (!isPremium && recordingDurationRef.current >= 30) {
          stopVideoRecording();
          alert("Límite de tiempo gratuito de grabación de sesión alcanzado (30s). ¡Sube a SPECTER-PRO para grabaciones de video de la sesión ilimitadas!");
        }
      }, 1000);

    } catch (err) {
      console.error("Recording installation error:", err);
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      try {
        videoRecorderRef.current.stop();
      } catch (e) {}
    }
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    setIsCameraRecording(false);
  };
  
  // Dynamic manual scan range tuning center
  const [scanCenter, setScanCenter] = useState(98.0);
  const scanWidth = 3.0; // Dynamic span window ± 3 MHz
  const [isTuning, setIsTuning] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);

  const getKnobAngle = () => {
    const ratio = (scanCenter - 87.5) / (108.0 - 87.5);
    return -135 + ratio * 270; // Map mapping 0-1 to -135 to +135 degrees
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsTuning(true);
    updateTuning(e.clientX, e.clientY);
  };

  const updateTuning = useCallback((clientX: number, clientY: number) => {
    if (!knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI);
    
    let relativeAngle = angleDeg + 90;
    if (relativeAngle < -180) relativeAngle += 360;
    if (relativeAngle > 180) relativeAngle -= 360;

    let clampedAngle = Math.max(-135, Math.min(135, relativeAngle));
    
    const ratio = (clampedAngle + 135) / 270;
    const newFreq = 87.5 + ratio * (108.0 - 87.5);
    
    setScanCenter(parseFloat(newFreq.toFixed(1)));
  }, []);

  useEffect(() => {
    if (!isTuning) return;

    const handlePointerMove = (e: PointerEvent) => {
      updateTuning(e.clientX, e.clientY);
    };

    const handlePointerUp = () => {
      setIsTuning(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isTuning, updateTuning]);
  
  const ai = useRef(new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

  // Frequency randomizer limited to dynamically tuned scan range bounds
  useEffect(() => {
    if (!isStarted) return;
    
    const interval = setInterval(() => {
      const minF = Math.max(87.5, scanCenter - scanWidth);
      const maxF = Math.min(108.0, scanCenter + scanWidth);
      const f = (Math.random() * (maxF - minF) + minF).toFixed(1);
      setFrequency(f);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isStarted, scanCenter]);

  const [apiKeyError, setApiKeyError] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      const persisted = messages.filter(m => !m.isTemporary);
      localStorage.setItem('spectral_records_v1', JSON.stringify(persisted));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, [messages]);

  // Periodic distorted message generator for Entity Detection mode
  useEffect(() => {
    if (!isStarted || !entityDetection) return;

    let active = true;
    let timerId: NodeJS.Timeout | null = null;

    const triggerEntityAnomaly = () => {
      // Occasional intervals between 8 and 18 seconds
      const delay = 8000 + Math.random() * 10000;
      timerId = setTimeout(() => {
        if (!active || !isStarted || !entityDetection) return;

        const DISTORTED_WORDS = [
          "S̷A̷L̵ ̸D̴E̶ ̸A̷Q̸U̸Í̷",
          "T̵E̸ ̶O̴B̸S̸E̷R̷V̶O̷",
          "N̸O̶ ̶H̵A̵Y̴ ̸E̵S̷C̴A̶P̸E̶",
          "A̶Y̷U̵D̶A̷M̷E̷",
          "E̸S̵T̷O̵Y̵ ̶D̶E̴T̸R̶Á̸S̷",
          "L̵I̷B̴É̶R̷A̴M̷E̸",
          "N̵O̶ ̶E̴S̸T̸Á̸S̵ ̶S̸O̸L̴O̵",
          "P̵E̷L̷I̷G̶R̷O̴",
          "S̴I̴E̴N̴T̵E̸ ̸E̷L̷ ̷F̷R̶Í̶O̷",
          "☠̴ ̵M̷U̵E̷R̸T̸O̷ ̶☠̴",
          "†̷ ̸V̴E̵T̸E̶ ̶D̶E̶ ̴A̷Q̶U̶Í̸"
        ];
        const text = DISTORTED_WORDS[Math.floor(Math.random() * DISTORTED_WORDS.length)];
        const tempId = Math.random().toString(36).substr(2, 9);
        const minF = Math.max(87.5, scanCenter - scanWidth);
        const maxF = Math.min(108.0, scanCenter + scanWidth);
        const randFreq = (Math.random() * (maxF - minF) + minF).toFixed(1);

        const newMessage: Message = {
          id: tempId,
          text,
          timestamp: Date.now(),
          frequency: randFreq + " MHz",
          intensity: Math.floor(75 + Math.random() * 25), // high intensity due to paranormal nature
          isTemporary: true,
          isDistorted: true,
        };

        // Add to our list
        setMessages(prev => [newMessage, ...prev].slice(0, 10));

        // Let the frequency dial instantly flicker or snap to the anomalous point
        setFrequency(randFreq);
        
        // Ghostly synthesized sound for this specific word
        playVoiceAnomaly(text);

        // Flash/flicker the CRT screen
        setIsFlickering(true);
        setTimeout(() => setIsFlickering(false), 600);

        // Set a timer to automatically remove the message, triggering the Framer Motion exit animation
        setTimeout(() => {
          setMessages(prev => prev.filter(m => m.id !== tempId));
        }, 5000); // Fleeting: disappears in 5 seconds!

        // Schedule next
        triggerEntityAnomaly();
      }, delay);
    };

    triggerEntityAnomaly();

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isStarted, entityDetection, scanCenter, playVoiceAnomaly]);

  // Turn off Entity Detection if the device is turned off
  useEffect(() => {
    if (!isStarted) {
      setEntityDetection(false);
    }
  }, [isStarted]);

  const fetchSpiritMessage = async () => {
    if (!isPremium && batteryLevel < 10) {
      if (isStarted) toggle();
      setShowMonetizationModal(true);
      return;
    }
    try {
      const response = await ai.current.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Eres un espíritu comunicándote a través de una caja de espíritus de radio (Spirit Box). Proporciona un único mensaje, muy corto (1-3 palabras), críptico y ligeramente espeluznante en español. Ejemplos: 'Ayuda', 'Te veo', 'Frío', 'Corre', 'Detrás de ti', 'Perdido', 'Vete'. No uses signos de puntuación a menos que de verdad sea necesario. Solo las palabras.",
        config: {
          temperature: 1,
          topP: 0.95,
        }
      });

      const text = response.text?.trim() || "???";
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        timestamp: Date.now(),
        frequency: frequency + " MHz",
        intensity: Math.floor(Math.random() * 100)
      };

      setMessages(prev => [newMessage, ...prev].slice(0, 10));
      setLastMessageTime(Date.now());
      setApiKeyError(false);
      
      if (!isPremium) {
        setBatteryLevel(prev => Math.max(0, prev - 10));
      }

      // Synthesize unearthly ghost sound sweep in the Web Audio graph
      playVoiceAnomaly(text);
      
      // Trigger flicker
      setIsFlickering(true);
      setTimeout(() => setIsFlickering(false), 500);
    } catch (error) {
      console.error("Spirit communication failed:", error);
      setApiKeyError(true);
    }
  };

  const askSpirit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAnsweringQuestion) return;

    if (!isStarted) {
      alert("¡Enciende la Spirit Box para abrir el canal de sintonización!");
      return;
    }

    if (!isPremium && batteryLevel < 15) {
      setShowMonetizationModal(true);
      return;
    }

    setIsAnsweringQuestion(true);
    setIsFlickering(true);
    const questionText = customQuestion;
    setCustomQuestion("");

    try {
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.6);
        oscGain.gain.setValueAtTime(0.08, ctx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }

      const response = await ai.current.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Eres un espíritu comunicándote a través de una caja de espíritus de radio (Spirit Box). Proporciona un único mensaje muy corto (1-3 palabras), en español, críptico, ligeramente aterrador o misterioso en respuesta a la siguiente pregunta: "${questionText}". Ejemplos de respuestas: "Aquí", "Vete ya", "Frío", "Fuego", "Tú serás el siguiente", "Miedo", "Te observo", "Detrás de ti". No utilices puntuación si no es estrictamente necesario. Solo responde con 1 a 3 palabras. No respondas con texto plano explicativo, métete totalmente en el personaje fantasmal.`,
        config: {
          temperature: 1.1,
          topP: 0.95,
        }
      });

      const text = response.text?.trim() || "ALÉJATE";

      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        timestamp: Date.now(),
        frequency: frequency + " MHz",
        intensity: Math.floor(45 + Math.random() * 55),
        isDistorted: true
      };

      setMessages(prev => [newMessage, ...prev].slice(0, 10));
      setLastMessageTime(Date.now());
      setApiKeyError(false);

      if (!isPremium) {
        setBatteryLevel(prev => Math.max(0, prev - 15));
      }

      playVoiceAnomaly(text);
      setIsFlickering(false);
      setIsAnsweringQuestion(false);

    } catch (error) {
      console.error("Spirit question failed:", error);
      setIsAnsweringQuestion(false);
      setIsFlickering(false);
      const text = Math.random() > 0.5 ? "S̸A̸L̶ ̸A̸H̶O̴R̸A̶" : "N̷O̵ ̷H̵A̸B̶L̸O̷";
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        timestamp: Date.now(),
        frequency: frequency + " MHz",
        intensity: Math.floor(20 + Math.random() * 40),
        isDistorted: true
      };
      setMessages(prev => [newMessage, ...prev].slice(0, 10));
      playVoiceAnomaly(text);
    }
  };

  const watchAd = () => {
    setIsWatchingAd(true);
    setAdCountdown(10);
    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsWatchingAd(false);
          setBatteryLevel(prevBattery => Math.min(100, prevBattery + 35));
          if (audioCtxRef.current) {
            try {
              const ctx = audioCtxRef.current;
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.3);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.4);
            } catch(e) {}
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const buyPremium = (e: React.FormEvent) => {
    e.preventDefault();
    setBuyingState('loading');
    setTimeout(() => {
      setBuyingState('success');
      setIsPremium(true);
      if (audioCtxRef.current) {
        try {
          const ctx = audioCtxRef.current;
          const now = ctx.currentTime;
          [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            gain.gain.setValueAtTime(0.08, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.5);
          });
        } catch(e) {}
      }
      setTimeout(() => {
        setShowMonetizationModal(false);
        setBuyingState('none');
      }, 2000);
    }, 2000);
  };

  // Randomly trigger messages when started with safe timer cleanup
  useEffect(() => {
    if (!isStarted) {
      setApiKeyError(false);
      return;
    }

    let active = true;
    let timerId: NodeJS.Timeout | null = null;

    const triggerMessage = () => {
      const delay = 5000 + Math.random() * 15000; // Random interval between messages
      timerId = setTimeout(async () => {
        if (active && isStarted) {
          await fetchSpiritMessage();
          triggerMessage();
        }
      }, delay);
    };

    triggerMessage();

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isStarted]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono p-4 md:p-8 flex flex-col items-center justify-center selection:bg-red-900 selection:text-white">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Desktop side-by-side or mobile stacked layout flex-wrap wrapper */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start justify-center max-w-full lg:max-w-5xl w-full relative z-10">
        {/* Main Device Container */}
        <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          filter: isFlickering ? "brightness(1.5) contrast(1.2)" : "brightness(1) contrast(1)",
          x: isFlickering ? [0, -2, 2, -2, 0] : 0
        }}
        className="relative w-full max-w-md bg-[#151619] border border-[#2a2b2e] rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col gap-8"
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between border-b border-[#2a2b2e] pb-4">
          <div className="flex items-center gap-2">
            <Radio className={cn("w-5 h-5 transition-colors", isPremium ? "text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)] animate-flicker-slow" : "text-red-500")} />
            <span className={cn("text-xs font-bold tracking-widest uppercase transition-colors", isPremium ? "text-amber-400/80" : "opacity-60")}>
              {isPremium ? "SPECTER-PRO ꚙ" : "Specter-Scan v1.0"}
            </span>
          </div>

          {/* Monetized Battery Indicator under Option A */}
          <button 
            type="button"
            onClick={() => setShowMonetizationModal(true)}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1 rounded border transition-all hover:brightness-125 cursor-pointer origin-center",
              isPremium
                ? "bg-amber-950/40 border-amber-500/40 text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)] animate-pulse"
                : batteryLevel < 25
                  ? "bg-red-950/30 border-red-500/40 text-red-400 font-bold animate-pulse"
                  : "bg-zinc-900 border-zinc-700/60 text-zinc-300 font-semibold"
            )}
            title="Suministro de Energía del Éter - Haz clic para Recargar"
          >
            <Zap className={cn("w-3.5 h-3.5 transition-colors", isPremium ? "text-amber-400" : batteryLevel < 25 ? "text-red-400 animate-bounce" : "text-emerald-400")} />
            <span className="text-[10px] font-mono tracking-wider">
              {isPremium ? "CORE ETERNO" : `${Math.floor(batteryLevel)}% ÉTER`}
            </span>
          </button>
        </div>

        {/* Display Area */}
        <div className="relative bg-black/90 rounded-xl p-5 border border-white/10 flex flex-col justify-between overflow-hidden min-h-[220px] select-none shadow-inner shadow-black group">
          {/* CRT scanline effect */}
          <div className={cn(
            "absolute inset-0 pointer-events-none bg-radial-gradient z-10 opacity-30",
            isStarted && "animate-crt-scan"
          )} style={{
            backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
            backgroundSize: "100% 4px"
          }} />
          
          {/* Ambient Paranormal/EVP Waveforms Background */}
          <SpectralScreenWaves 
            isStarted={isStarted} 
            frequency={frequency} 
            isFlickering={isFlickering} 
          />
          
          {/* Sweeping Laser Beam line */}
          {isStarted && (
            <div className="absolute left-0 right-0 h-[1.5px] bg-red-500/30 z-10 blur-[0.5px] animate-laser-sweep" />
          )}

          {/* Top Panel: Freq Selector Timeline Scale */}
          <div className="relative w-full h-8 border-b border-white/10 flex flex-col justify-end pb-1 overflow-hidden">
            <div className="flex justify-between text-[8px] uppercase tracking-wider text-white/40 px-1">
              <span>87.5M</span>
              <span>92.0M</span>
              <span>98.0M</span>
              <span>104.0M</span>
              <span>108.0M</span>
            </div>
            {/* Ruler ticks */}
            <div className="w-full flex justify-between h-2 opacity-30 px-2 mt-0.5">
              {Array.from({ length: 25 }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-[1px] bg-white",
                    i % 6 === 0 ? "h-2" : "h-1"
                  )} 
                />
              ))}
            </div>
            {/* Tuned Scan Sweep Highlighted Segment band */}
            {isStarted && (
              <div 
                className="absolute bottom-0 h-1.5 bg-red-500/20 opacity-70 border-x border-red-500/40 pointer-events-none transition-all duration-300"
                style={{
                  left: `${Math.min(95, Math.max(2, ((Math.max(87.5, scanCenter - scanWidth) - 87.5) / (108.0 - 87.5)) * 100))}%`,
                  width: `${Math.max(4, (((Math.min(108.0, scanCenter + scanWidth) - Math.max(87.5, scanCenter - scanWidth)) / (108.0 - 87.5)) * 100))}%`
                }}
              />
            )}
            {/* Sliding Sweeper Pointer Needle */}
            {isStarted && (
              <div 
                className="absolute bottom-0 h-4.5 w-[2px] bg-red-500 shadow-[0_0_8px_rgb(239,68,68)] z-10 transition-all duration-100 ease-out"
                style={{
                  left: `${Math.min(98, Math.max(2, ((parseFloat(frequency) - 87.5) / (108.0 - 87.5)) * 100))}%`
                }}
              />
            )}
          </div>

          {/* Middle Body: Main Numeric Display & Oscilloscope Overlay */}
          <div className="flex items-center justify-between py-2 relative z-10 my-1">
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-red-500/70">Frecuencia Sintonizada</span>
              <motion.div 
                key={frequency}
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 1 }}
                className="text-4xl md:text-5xl font-bold tracking-tighter text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              >
                {isStarted ? frequency : "00.0"}
                <span className="text-xs ml-1 opacity-50">MHz</span>
              </motion.div>
              {/* Dynamic live fluctuations of Signal Strength representing EVP activity */}
              <SignalStrengthIndicator isStarted={isStarted} isFlickering={isFlickering} />
            </div>

            {/* Sizable Dynamic Wave Oscilloscope Monitor */}
            <div className="w-28 h-12 relative overflow-hidden bg-black/60 rounded border border-white/5 shadow-inner">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/10 border-dashed z-20 pointer-events-none" />
              <RealTimeVisualizer 
                analyserRef={analyserRef} 
                isStarted={isStarted} 
                isFlickering={isFlickering} 
                staticEnabled={staticEnabled}
              />
            </div>
          </div>

          {/* Bottom Panel: Stereo Analogue VU LED Bars & Indicator Status Lights */}
          <div className="flex items-center justify-between border-t border-white/10 pt-2 gap-4">
            {/* LED Status Signal Check Dots */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-0.5">
                <div className={cn(
                  "w-2 h-2 rounded-full border border-black transition-all duration-300",
                  isStarted ? "bg-emerald-500 shadow-[0_0_6px_#10b981] animate-flicker-slow" : "bg-zinc-800"
                )} />
                <span className="text-[7px] uppercase tracking-tighter opacity-50">Sens</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className={cn(
                  "w-2 h-2 rounded-full border border-black transition-all duration-300",
                  isStarted ? "bg-amber-500 shadow-[0_0_6px_#f59e0b] animate-flicker-fast" : "bg-zinc-800",
                  isFlickering && "bg-white shadow-[0_0_12px_#fff] scale-110"
                )} />
                <span className="text-[7px] uppercase tracking-tighter opacity-50">Anom</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className={cn(
                  "w-2 h-2 rounded-full border border-black transition-all duration-300",
                  isStarted && messages.length > 0 ? "bg-red-500 shadow-[0_0_8px_#ef4444] animate-flicker-medium" : "bg-zinc-800"
                )} />
                <span className="text-[7px] uppercase tracking-tighter opacity-50">Evp</span>
              </div>
            </div>

            {/* Simulated 10-Channel Dynamic VU Meter Grid */}
            <div className="flex items-end gap-[2px] h-6 overflow-hidden">
              {Array.from({ length: 12 }).map((_, idx) => {
                const randomDelay = (idx * 0.08).toFixed(2);
                const randomSpeed = (0.3 + Math.random() * 0.4).toFixed(2);
                return (
                  <div
                    key={idx}
                    className="w-1.5 rounded-t-[1px] flex flex-col-reverse gap-[1px]"
                    style={{ height: '100%' }}
                  >
                    {Array.from({ length: 4 }).map((_, barIdx) => {
                      // Determine bar color by level height
                      let barColor = "bg-red-950/40";
                      if (isStarted) {
                        if (barIdx === 0) barColor = "bg-red-500/30";
                        if (barIdx === 1) barColor = "bg-red-500/50";
                        if (barIdx === 2) barColor = "bg-red-500/80";
                        if (barIdx === 3) barColor = "bg-white";
                      }
                      return (
                        <div
                          key={barIdx}
                          className={cn(
                            "w-full h-[4px] rounded-[0.5px] transition-all duration-200",
                            barColor
                          )}
                          style={isStarted ? {
                            animation: `led-rise ${randomSpeed}s ease-in-out ${randomDelay}s infinite alternate`
                          } : undefined}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Manual Dial Tuning Control Section */}
        <div className="flex flex-col gap-3 bg-black/40 p-4 rounded-xl border border-white/5 relative">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-white/50">
            <span className="flex items-center gap-1.5 text-red-500/90 font-mono">
              <Settings2 className="w-3.5 h-3.5" /> Rango de Barrido
            </span>
            <span className="font-mono text-[9px] bg-red-950/50 text-red-400 px-1.5 py-0.5 rounded border border-red-900/30">
              Barrido: {Math.max(87.5, scanCenter - scanWidth).toFixed(1)} - {Math.min(108.0, scanCenter + scanWidth).toFixed(1)} MHz
            </span>
          </div>

          <div className="flex items-center gap-5 py-1">
            {/* Draggable Rotary Knob Dial */}
            <div className="flex flex-col items-center justify-center relative select-none">
              {/* Outer Ticks around the dial */}
              <div className="absolute inset-0 scale-[1.35] pointer-events-none select-none opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {Array.from({ length: 11 }).map((_, i) => {
                    const tickAngle = -135 + i * 27; // -135 to 135 deg Potentiometer styled
                    const rad = (tickAngle - 90) * (Math.PI / 180);
                    const x1 = 50 + 40 * Math.cos(rad);
                    const y1 = 50 + 40 * Math.sin(rad);
                    const x2 = 50 + 46 * Math.cos(rad);
                    const y2 = 50 + 46 * Math.sin(rad);
                    return (
                      <line 
                        key={i} 
                        x1={x1} 
                        y1={y1} 
                        x2={x2} 
                        y2={y2} 
                        stroke="white" 
                        strokeWidth="1.5" 
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Knob interactive body element */}
              <div
                ref={knobRef}
                onPointerDown={handlePointerDown}
                style={{ transform: `rotate(${getKnobAngle()}deg)` }}
                className={cn(
                  "w-16 h-16 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 border-2 border-zinc-600 shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing relative transition-shadow touch-none select-none",
                  isTuning ? "shadow-[0_0_15px_rgba(239,68,68,0.25)] border-red-500/40" : "hover:border-zinc-500"
                )}
              >
                {/* Finger recess / pointer notch line indicator on the knob */}
                <div className="absolute top-1.5 w-1 h-3.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
                
                {/* Brushed metallic core cap */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 border border-zinc-800 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-950/80" />
                </div>
              </div>

              <span className="text-[8px] uppercase tracking-wider text-white/30 mt-3 font-semibold">DIAL MANUAL</span>
            </div>

            {/* Tuning metrics readout */}
            <div className="flex-1 flex flex-col justify-center gap-1 pl-1">
              <div className="text-[10px] text-white/40 uppercase font-bold">Frecuencia Central</div>
              <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1 font-mono">
                {scanCenter.toFixed(1)} <span className="text-xs text-red-500 font-semibold uppercase">MHz</span>
              </div>
              <p className="text-[9px] text-white/40 leading-relaxed font-sans">
                Gira el dial rotatorio para cambiar el foco del escáner activo. La banda roja en la línea de tiempo resalta tu ventana de barrido.
              </p>
            </div>
          </div>
        </div>


        {/* Controls */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={toggle}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-300 group",
              isStarted 
                ? "bg-red-950/20 border-red-500/50 text-red-500" 
                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
            )}
          >
            <Power className={cn("w-6 h-6 transition-transform group-active:scale-90", isStarted && "animate-pulse")} />
            <span className="text-[10px] uppercase font-bold tracking-widest">Encendido</span>
          </button>

          <button
            onClick={() => {
              if (isStarted) {
                setStaticEnabled(prev => !prev);
              }
            }}
            disabled={!isStarted}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-300 group disabled:opacity-30 disabled:cursor-not-allowed",
              isStarted && staticEnabled
                ? "bg-red-950/20 border-red-500/50 text-red-500" 
                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
            )}
            title={isStarted ? "Activar/Desactivar ruido de estática" : "Enciende la Spirit Box para habilitar la estática"}
          >
            {isStarted && staticEnabled ? (
              <Activity className="w-6 h-6 animate-pulse text-red-500" />
            ) : (
              <VolumeX className="w-6 h-6 text-white/40" />
            )}
            <span className="text-[10px] uppercase font-bold tracking-widest">Estática</span>
          </button>

          <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 w-full">
              {volume === 0 ? <VolumeX className="w-4 h-4 opacity-40" /> : <Volume2 className="w-4 h-4 opacity-40" />}
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Ganancia</span>
          </div>
        </div>

        {/* Entity Detection Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-black/35 rounded-xl border border-white/5">
          <div className="flex items-center gap-2.5">
            <Ghost className={cn("w-5 h-5 transition-all duration-300", entityDetection && isStarted ? "text-purple-500 animate-bounce" : "text-white/40")} />
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/80">Detección de Entidades</span>
              <span className="text-[9px] text-white/40 font-sans">Anomalías transitorias y distorsionadas</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (isStarted) {
                setEntityDetection(prev => !prev);
              }
            }}
            disabled={!isStarted}
            className={cn(
              "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed",
              entityDetection && isStarted ? "bg-purple-600/80 shadow-[0_0_8px_rgba(147,51,234,0.5)] border-purple-400/20" : "bg-neutral-800"
            )}
            title={isStarted ? "Activar modo búsqueda de apariciones distorsionadas" : "Enciende la Spirit Box para activar este modo"}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                entityDetection && isStarted ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Necromantic Interrogator Input Form */}
        <div className="flex flex-col gap-2 p-4 bg-black/45 rounded-xl border border-white/5 text-left">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest font-mono">
            <span className={cn("flex items-center gap-1.5 transition-colors", isPremium ? "text-amber-400" : "text-red-500")}>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Interrogador de Ultratumba
            </span>
            <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", isPremium ? "bg-amber-950/40 border-amber-800/40 text-amber-400" : "bg-zinc-950 border-zinc-800 text-zinc-400")}>
              {isPremium ? "CANAL ILIMITADO" : "CONSUMO: 15% ÉTER"}
            </span>
          </div>
          
          <form onSubmit={askSpirit} className="flex gap-1.5 mt-1">
            <input 
              type="text"
              placeholder={isStarted ? "¿Hay algún espíritu aquí conmigo?" : "Enciende la Spirit Box para interrogar..."}
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              disabled={!isStarted || isAnsweringQuestion}
              className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-all font-mono disabled:opacity-30 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!isStarted || isAnsweringQuestion || !customQuestion.trim()}
              className={cn(
                "px-3 rounded-lg border flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed h-8 cursor-pointer",
                isPremium
                  ? "bg-amber-950/30 border-amber-500/40 text-amber-400 hover:bg-amber-900/45 hover:border-amber-400"
                  : "bg-red-950/30 border-red-500/40 text-red-400 hover:bg-red-900/45 hover:border-red-400"
              )}
            >
              {isAnsweringQuestion ? (
                <span className="animate-spin text-xs">⚰</span>
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </form>
          {isAnsweringQuestion && (
            <p className="text-[9px] text-[#bfdbfe]/80 uppercase tracking-widest font-bold animate-pulse text-center mt-1 font-mono">
              Sintonizando eco de ultratumba...
            </p>
          )}
        </div>

        {/* Recent Message (EVP) */}
        <div className="min-h-[80px] flex flex-col items-center justify-center border-t border-white/5 pt-4">
          <AnimatePresence mode="wait">
            {messages.length > 0 && isStarted && (
              <motion.div
                key={messages[0].id}
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                className="text-center"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-red-500/60 mb-1">EVP Detectado</div>
                <div className="text-2xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] italic">
                  "{messages[0].text}"
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!isStarted && (
            <div className="text-[10px] uppercase tracking-widest opacity-20 italic">Esperando Señal...</div>
          )}
        </div>
      </motion.div>

      {/* Right Column: Paranormal Toolkit Suite */}
      <div className="flex flex-col gap-6 w-full max-w-md">
        
        {/* Spectral Camera & Session Video Recorder Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full bg-[#111214] border border-[#2a2b2e] rounded-xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden text-left"
        >
          {isCameraRecording && (
            <div className="absolute inset-x-0 top-0 h-1 bg-red-500 animate-pulse relative z-20" />
          )}

          <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
            <div className="flex items-center gap-2">
              <Camera className={cn("w-4 h-4 text-emerald-400", isCameraRecording && "text-red-500 animate-pulse")} />
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-white/80 select-none">
                Cámara Espectral de Sesión
              </span>
            </div>
            {isCameraActive && (
              <div className="flex items-center gap-1.5 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] uppercase tracking-wider text-emerald-400/80 font-mono">
                  FEED ACTIVO
                </span>
              </div>
            )}
          </div>

          {/* Camera Viewer Screen */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-white/5 shadow-inner">
            {isCameraActive ? (
              <div className="w-full h-full relative">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={cn(
                    "w-full h-full object-cover transition-all duration-300",
                    cameraFilter === "nightvision" && "grayscale brightness-[1.6] contrast-[1.4] sepia saturate-[2] hue-rotate-[90deg]",
                    cameraFilter === "thermal" && "brightness-[1.2] contrast-[1.8] saturate-[3.5] hue-rotate-[220deg]",
                    cameraFilter === "spectral" && "grayscale brightness-[1.1] contrast-[1.3] sepia saturate-[2.5] hue-rotate-[270deg]",
                    cameraFilter === "glitch" && "brightness-[1.3] contrast-[1.6] saturate-[1.2] invert-[0.15] animate-flicker-slow"
                  )}
                />
                
                {/* CRT Screen Scan lines overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-20 z-10 bg-linear-gradient"
                     style={{
                       backgroundImage: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%)",
                       backgroundSize: "100% 4px"
                     }} 
                />

                {/* Nightvision Grid overlay */}
                <div className="absolute inset-0 pointer-events-none border border-white/10 z-10 flex items-center justify-center select-none">
                  <div className="w-1/3 h-1/3 border border-dashed border-white/10 rounded-full" />
                  <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-white/10" />
                  <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-white/10" />
                </div>

                {/* Rec flashing circle overlay */}
                {isCameraRecording && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/70 border border-red-500/30 text-[9px] text-red-400 font-bold tracking-widest uppercase font-mono animate-pulse select-none">
                    <Circle className="w-2   h-2 fill-red-500 text-red-500" /> REC {videoDuration}s
                  </div>
                )}

                {/* Filter Label HUD overlay */}
                <span className="absolute bottom-3 left-3 z-20 text-[9px] uppercase tracking-widest font-bold font-mono text-white/50 bg-black/60 px-2 py-0.5 rounded border border-white/5 select-none">
                  MODO: {cameraFilter}
                </span>

                {/* Battery level or EMF sensor readouts inside HUD */}
                <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1 font-mono text-[8px] text-white/60 bg-black/50 p-1.5 rounded border border-white/5 select-none">
                  <div>RANGO: UHF SCAN {frequency} MHz</div>
                  <div>EMF: {(Math.random() * 5 + 1.2).toFixed(2)} mG</div>
                  <div>TEMP: {(18.2 + Math.random() * 1.5).toFixed(1)}°C</div>
                </div>

                {/* Simulated ghost outline or message detected */}
                <AnimatePresence>
                  {showDetectedEntity && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-[1px] border-2 border-red-500/45 p-4 text-center font-mono select-none"
                    >
                      <ShieldAlert className="w-8 h-8 text-red-400 animate-bounce mb-1" />
                      <span className="text-[10px] font-black tracking-widest text-red-400 uppercase animate-pulse">
                        ALERTA DE ANOMALÍA
                      </span>
                      <p className="text-xs font-bold text-white tracking-wider mt-0.5 uppercase">
                        {detectedEntityName}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none">
                <VideoOff className="w-10 h-10 text-white/10 mb-2 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold font-mono">
                  SISTEMA DE CAPTURA APAGADO
                </span>
                <p className="text-[9px] text-white/20 mt-1 max-w-[200px] font-sans leading-relaxed">
                  Conecta la cámara de visión nocturna para comenzar la sintonización visual del espacio espectral.
                </p>
                <button
                  onClick={startCamera}
                  className="mt-3 px-3.5 py-1.5 bg-emerald-950/35 hover:bg-emerald-950/50 text-emerald-400 hover:text-emerald-350 border border-emerald-900/40 hover:border-emerald-500/40 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                >
                  CONECTAR LENTE
                </button>
              </div>
            )}
          </div>

          {/* Camera controls block */}
          {isCameraActive && (
            <div className="flex flex-col gap-3">
              {/* Filter selections */}
              <div className="grid grid-cols-4 gap-1.5 select-none">
                {(['nightvision', 'thermal', 'spectral', 'glitch'] as const).map((filt) => (
                  <button
                    key={filt}
                    onClick={() => {
                      setCameraFilter(filt);
                      playGhostBeep();
                    }}
                    className={cn(
                      "py-1 text-[8px] tracking-wider uppercase font-bold rounded border transition-all cursor-pointer font-mono",
                      cameraFilter === filt
                        ? "bg-emerald-950/35 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                        : "bg-black/40 border-white/5 text-white/40 hover:text-white/60 hover:border-white/10"
                    )}
                  >
                    {filt === 'nightvision' && "Vision N"}
                    {filt === 'thermal' && "Térmico"}
                    {filt === 'spectral' && "Espectral"}
                    {filt === 'glitch' && "Ruido"}
                  </button>
                ))}
              </div>

              {/* Record / Stop Panel */}
              <div className="flex gap-2">
                {!isCameraRecording ? (
                  <button
                    onClick={startVideoRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-500/40 hover:shadow-[0_0_10px_rgba(239,68,68,0.1)] rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    title="Registrar video de la sesión espírita actual"
                  >
                    <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" /> Grabar Sesión
                  </button>
                ) : (
                  <button
                    onClick={stopVideoRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-900/40 hover:bg-red-900/60 text-white border border-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse cursor-pointer shadow-lg shadow-red-950/40"
                    title="Detener registros videográficos y archivar"
                  >
                    <Square className="w-3 h-3 fill-white text-white" /> Detener Captura Video
                  </button>
                )}

                <button
                  onClick={stopCamera}
                  className="px-3 bg-zinc-900 border border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                  title="Desconectar el visor de espectros"
                >
                  Apagar
                </button>
              </div>
            </div>
          )}

          {/* Recorded Videos List Catalog */}
          {recordedVideos.length > 0 && (
            <div className="border-t border-white/5 pt-3">
              <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 block mb-2 font-mono select-none">
                Registros Videográficos ({recordedVideos.length})
              </span>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1.5 custom-scrollbar">
                {recordedVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-2 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-red-950/30 border border-red-500/20 flex items-center justify-center text-red-400 font-mono text-[9px]">
                        REC
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white/90 font-mono">
                          {vid.name}
                        </span>
                        <span className="text-[8px] text-white/35 font-sans">
                          {new Date(vid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {vid.duration} segundos
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={vid.url}
                        download={`sesion_espectral_${vid.id}_${Date.now()}.webm`}
                        className="p-1 px-2 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 text-[10px] uppercase font-bold rounded flex items-center gap-1 tracking-wider transition-all"
                        title="Descargar archivo de video de la sesión"
                      >
                        <Download className="w-3 h-3" /> Bajar
                      </a>
                      <button
                        onClick={() => {
                          const confirmDelete = window.confirm("¿Deseas purgar este archivo de video?");
                          if (confirmDelete) {
                            URL.revokeObjectURL(vid.url);
                            setRecordedVideos(prev => prev.filter(v => v.id !== vid.id));
                          }
                        }}
                        className="p-1 text-red-400/65 hover:text-red-400 bg-red-950/10 hover:bg-red-950/20 border border-red-900/30 rounded cursor-pointer"
                        title="Purgar video"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* EVP Audio Recorder & Simulator Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-[#111214] border border-[#2a2b2e] rounded-xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden text-left"
        >
          {/* Background overlay pulse when recording */}
          {isRecording && (
            <div className="absolute inset-0 bg-red-950/10 pointer-events-none border border-red-500/20 rounded-xl animate-pulse" />
          )}

          <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
            <div className="flex items-center gap-2">
              <Mic2 className={cn("w-4 h-4 text-red-500", isRecording && "animate-pulse")} />
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-white/80">
                Grabadora de EVP <span className="text-[10px] text-red-400">({evpRecordings.length})</span>
              </span>
            </div>
            {isRecording && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/40 border border-red-900/30 text-[10px] text-red-400 font-bold tracking-widest uppercase animate-pulse">
                <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" /> REC {recordingTime}s
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            {/* Action buttons */}
            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  onClick={startEVPRecording}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-950/25 hover:bg-red-950/45 text-red-400 hover:text-red-300 font-bold rounded-lg border border-red-900/40 hover:border-red-500/40 transition-all duration-300 text-xs uppercase tracking-widest shadow-lg"
                  title="Grabar audio ambiental para buscar fragmentos EVP decodificados"
                >
                  <Circle className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse animate-flicker-medium" /> Iniciar Registro EVP
                </button>
              ) : (
                <button
                  onClick={stopEVPRecording}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-900/40 hover:bg-red-900/60 text-white font-bold rounded-lg border border-red-500/60 animate-pulse transition-all duration-300 text-xs uppercase tracking-widest shadow-lg shadow-red-950/50"
                  title="Detener grabación y reconstruir el archivo acústico"
                >
                  <Square className="w-3.5 h-3.5 fill-white text-white" /> Detener & Decodificar
                </button>
              )}
            </div>
            
            <div className="text-[10px] text-white/40 leading-relaxed font-sans pb-3 border-b border-white/5">
              Habilita la captura ambiental de radio-recepción acústica. La grabadora analiza los picos sintonizados y las ondas de sonido del espacio físico.
            </div>

            {/* EVP Logs list */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar relative">
              <AnimatePresence initial={false}>
                {evpRecordings.length === 0 ? (
                  <div className="text-center py-6 text-[10px] uppercase tracking-widest opacity-25 italic">No se han registrado psicofonías</div>
                ) : (
                  evpRecordings.map((rec) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "group p-3 rounded-lg border text-left transition-all duration-300 flex flex-col gap-2 relative z-10",
                        rec.hasAnomaly 
                          ? "bg-purple-950/10 border-purple-900/30 hover:border-purple-500/40" 
                          : "bg-black/25 border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className={cn(
                            "text-[10px] font-bold tracking-tight",
                            rec.hasAnomaly ? "text-purple-400 font-mono" : "text-white/80"
                          )}>
                            {rec.hasAnomaly ? "⚡ PSICOFONÍA ACOPLADA" : "Captura de Estática"}
                          </span>
                          <div className="flex items-center gap-2 text-[9px] text-white/40 font-mono">
                            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-red-500" /> {new Date(rec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                            <span>•</span>
                            <span>{rec.duration}s</span>
                            <span>•</span>
                            <span className="text-red-400/80">{rec.frequency}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => currentlyPlayingEVPId === rec.id ? stopPlayingEVP() : playEVPWithEffects(rec)}
                            className={cn(
                              "p-1.5 rounded transition-all",
                              currentlyPlayingEVPId === rec.id
                                ? "bg-purple-600/20 border border-purple-500/50 text-purple-400 hover:bg-purple-600/30"
                                : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                            title={currentlyPlayingEVPId === rec.id ? "Detener reproducción" : "Reproducir análisis espectral"}
                          >
                            {currentlyPlayingEVPId === rec.id ? (
                              <div className="flex gap-[1.5px] items-center justify-center w-3 h-3">
                                <span className="w-[2px] h-3 bg-purple-400 animate-pulse [animation-duration:0.6s]" />
                                <span className="w-[2px] h-1.5 bg-purple-400 animate-pulse [animation-duration:0.4s]" />
                                <span className="w-[2px] h-2.5 bg-purple-400 animate-pulse [animation-duration:0.8s]" />
                              </div>
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              const newRecs = evpRecordings.filter(r => r.id !== rec.id);
                              if (rec.audioUrl) URL.revokeObjectURL(rec.audioUrl);
                              setEvpRecordings(newRecs);
                            }}
                            className="p-1.5 rounded bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 hover:text-red-200 transition-all opacity-40 group-hover:opacity-100"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {rec.hasAnomaly ? (
                        <div className="flex flex-col gap-1.5 p-2 rounded bg-purple-950/25 border border-purple-900/40 relative overflow-hidden">
                          <div className="absolute inset-0 bg-radial-gradient z-0 opacity-[0.03] pointer-events-none" />
                          <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-purple-400/90 font-bold">
                            <span>Señal Decodificada ({rec.intensity}% Señal)</span>
                            <span className="text-purple-300 font-mono">EN ENTIDAD</span>
                          </div>
                          <div className="text-sm font-bold tracking-widest text-[#bfdbfe] italic relative z-10 pl-1 border-l border-purple-500/50">
                            "{rec.paranormalText}"
                          </div>
                        </div>
                      ) : (
                        <div className="text-[9px] text-white/30 italic">No se detectaron acoples de voz. Solo ruidos residuales.</div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Session History Panel */}
        <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 w-full max-w-md bg-[#111214] border border-[#2a2b2e] rounded-xl p-5 shadow-2xl flex flex-col gap-4"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-white/80">
              Historial de Sesión <span className="text-[10px] text-red-400">({messages.length}/10)</span>
            </span>
          </div>
          {messages.length > 0 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={exportSessionLog}
                className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30 hover:bg-emerald-950/40"
                title="Exportar Registro de Anomalías"
              >
                <Download className="w-3.5 h-3.5" /> Exportar
              </button>
              <button 
                onClick={() => {
                  const confirmClear = window.confirm("¿Deseas purgar todas las anomalías EVP registradas?");
                  if (confirmClear) setMessages([]);
                }}
                className="text-[10px] uppercase font-bold tracking-widest text-[#ef4444] hover:text-[#ff6b6b] transition-colors flex items-center gap-1 bg-red-950/20 px-2 py-1 rounded border border-red-900/30 hover:bg-red-950/40"
                title="Purgar Registros Espectrales"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpiar
              </button>
            </div>
          )}
        </div>

        {/* Search Bar inside Session History Panel */}
        {messages.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30" />
            <input 
              type="text" 
              placeholder="Buscar anomalías pasadas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all font-mono"
            />
          </div>
        )}

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar relative">
          <AnimatePresence initial={false}>
            {filteredMessages.map((msg) => {
              // Determine signal classification
              let signalClass = "Eco Débil";
              let colorClass = "text-yellow-500/80 bg-yellow-500/10 border-yellow-500/20";
              
              if (msg.isDistorted) {
                signalClass = "Espectro Fugaz";
                colorClass = "text-purple-400 bg-purple-950/40 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)] animate-pulse font-bold";
              } else if (msg.intensity > 70) {
                signalClass = "EVP Clase A";
                colorClass = "text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]";
              } else if (msg.intensity > 40) {
                signalClass = "Voz Resonante";
                colorClass = "text-blue-400 bg-blue-500/10 border-blue-500/20";
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -25, filter: "blur(6px)", transition: { duration: 0.45 } }}
                  layout
                  key={msg.id}
                  onClick={() => {
                    playVoiceAnomaly(msg.text);
                    setIsFlickering(true);
                    setTimeout(() => setIsFlickering(false), 300);
                  }}
                  className={cn(
                    "group flex flex-col gap-2 p-3.5 rounded-lg bg-black/40 border cursor-pointer transition-all duration-300 relative overflow-hidden",
                    msg.isDistorted 
                      ? "border-purple-900/30 hover:border-purple-500/50 hover:bg-purple-950/10" 
                      : "border-white/5 hover:border-red-500/30 hover:bg-[#1a1b1f]/60"
                  )}
                >
                  {/* Visual playback indicator background effect on hover */}
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-red-500 text-[10px] uppercase font-bold tracking-widest font-mono">
                    <Play className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> Replay EVP
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className={cn(
                      "text-lg font-bold tracking-widest transition-colors italic",
                      msg.isDistorted 
                        ? "text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] group-hover:text-purple-200" 
                        : "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:text-red-400"
                    )}>
                      "{msg.text}"
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/50 border-t border-white/5 pt-2 font-mono">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded border",
                        msg.isDistorted 
                          ? "text-purple-400 bg-purple-950/50 border-purple-900/50"
                          : "text-red-400/80 bg-red-950/30 border-red-900/20"
                      )}>
                        {msg.frequency}
                      </span>
                      <span className={cn("px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wider font-semibold", colorClass)}>
                        {signalClass} ({msg.intensity}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-60">
                      <Clock className="w-3 h-3 text-white/40" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="text-center py-10 border border-dashed border-white/5 rounded-lg opacity-30 text-xs italic flex flex-col items-center justify-center gap-2">
              <Ghost className="w-8 h-8 text-white/20 animate-bounce" />
              <span>Esperando anomalías de estática...</span>
              <span className="text-[10px] text-white/40 not-italic">Activa Specter-Scan para comenzar a registrar frecuencias EVP</span>
            </div>
          )}

          {messages.length > 0 && filteredMessages.length === 0 && (
            <div className="text-center py-8 opacity-40 text-xs italic">
              No hay registros espectrales que coincidan con tu búsqueda.
            </div>
          )}
        </div>
      </motion.div>

        </div> {/* End Paranormal Toolkit Column */}
      </div> {/* End Main Device Container Wrapper */}

      {/* 📺 AD PLAYER MONETIZATION SIMULATOR */}
      {isWatchingAd && (
        <div className="fixed inset-0 z-50 bg-[#070707] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden font-mono">
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40 z-10 animate-crt-scan"
               style={{
                 backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)",
                 backgroundSize: "100% 6px"
               }} />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center max-w-sm gap-6 relative z-20"
          >
            <div className="w-16 h-16 rounded-full bg-red-950/30 border border-red-500/40 flex items-center justify-center text-red-500 animate-pulse relative">
              <Film className="w-8 h-8" />
              <div className="absolute inset-0 rounded-full border border-red-500/10 animate-ping" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-red-500/80 animate-flicker-medium block font-mono">
                SINTONIZANDO PUBLICIDAD ESPECTRAL
              </span>
              <h2 className="text-xl font-bold tracking-widest text-[#bfdbfe]">
                CONECTANDO FRECUENCIAS...
              </h2>
              <p className="text-xs text-white/40 leading-relaxed font-sans px-4">
                Por favor, mantén abierto el receptor. Un acoplamiento de señal comercial está recargando el condensador de éter.
              </p>
            </div>

            <div className="w-28 h-28 rounded-full border-4 border-dashed border-red-500/40 flex items-center justify-center relative">
              <span className="text-3xl font-black font-mono text-white animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {adCountdown}
              </span>
              <span className="text-[8px] absolute bottom-3 uppercase text-red-400 font-bold tracking-wider font-mono">
                Segundos
              </span>
            </div>

            <div className="space-y-1">
              <div className="w-48 h-1.5 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 10, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-red-600 via-purple-600 to-emerald-500" 
                />
              </div>
              <p className="text-[9px] uppercase tracking-wider text-white/30 font-semibold font-mono">
                Caudal: +3.5% por segundo
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* 🪙 MONETIZATION RECHARGE & PREMIUM HUB */}
      {showMonetizationModal && !isWatchingAd && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-[#141517] border border-[#2a2b2e] rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden text-left font-mono my-8"
          >
            <div className={cn(
              "absolute top-0 left-0 right-0 h-1.5",
              isPremium ? "bg-gradient-to-r from-amber-500 to-yellow-300" : "bg-gradient-to-r from-red-500 to-purple-600"
            )} />

            <button
              onClick={() => {
                if (buyingState !== 'loading') setShowMonetizationModal(false);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 mb-6 text-center border-b border-white/5 pb-4">
              <div className="flex justify-center mb-2">
                <div className={cn(
                  "p-3 rounded-full border",
                  isPremium
                    ? "bg-amber-950/20 border-amber-500/50 text-amber-400"
                    : "bg-red-950/20 border-red-500/50 text-red-400 animate-pulse"
                )}>
                  <Zap className="w-6 h-6" />
                </div>
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest text-[#e0e0e0]">
                {isPremium ? "EQUIPO TOTALMENTE OPTIMIZADO" : "SUMINISTRO DE ÉTER INSUFICIENTE"}
              </h2>
              <p className="text-xs text-white/40 leading-relaxed font-sans max-w-sm mx-auto">
                {isPremium 
                  ? "Tu receptor cuenta con la Celda de Energía Infinita habilitada. Disfruta de la sintonización sin límites."
                  : "Las comunicaciones del más allá consumen carga electromagnética de tu condensador. ¡Elige un método para recargar!"}
              </p>
            </div>

            {!isPremium && (
              <div className="mb-6 p-4 rounded-xl bg-black/60 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-white/35 uppercase tracking-wider block font-bold font-mono">
                    DEPÓSITO ELECTROMAGNÉTICO ACTUAL:
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-xl font-bold font-mono tracking-widest",
                      batteryLevel < 25 ? "text-red-400 animate-pulse" : "text-emerald-400"
                    )}>
                      {Math.floor(batteryLevel)}% ÉTER
                    </span>
                    <span className="text-[10px] text-white/40">
                      ({batteryLevel < 20 ? "Energía Crítica" : "Suficiente"})
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 w-full md:max-w-[200px] h-3 bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-r transition-all duration-500",
                      batteryLevel < 25 ? "bg-red-500 animate-pulse" : "bg-emerald-500"
                    )}
                    style={{ width: `${batteryLevel}%` }} 
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="flex flex-col justify-between p-5 rounded-xl border border-white/5 bg-black/45 relative overflow-hidden group">
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-400">
                      <Film className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Opción Libre</span>
                  </div>

                  <h3 className="text-sm font-semibold tracking-wide text-white">Sintonizar Publicidad</h3>
                  <p className="text-[11px] leading-relaxed text-white/50 font-sans">
                    Ver un acoplamiento comercial de resonancia magnética para recargar un <span className="text-emerald-400 font-bold font-mono">+35% de éter</span> en tu depósito de forma gratuita. (10 segundos de calibración).
                  </p>
                </div>

                <div className="mt-5 relative z-10">
                  <button
                    onClick={watchAd}
                    disabled={isPremium || batteryLevel >= 100}
                    className={cn(
                      "w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all duration-300 cursor-pointer",
                      batteryLevel >= 100
                        ? "bg-zinc-950 border-zinc-805 text-zinc-600 cursor-not-allowed"
                        : "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/45 hover:border-emerald-300"
                    )}
                  >
                    {batteryLevel >= 100 ? "DEPÓSITO LLENO" : "VER ANUNCIO REC (+35%)"}
                  </button>
                  <p className="text-[8px] text-zinc-500 text-center mt-1.5 uppercase tracking-wider font-mono">
                    *Consumo gratuito de red
                  </p>
                </div>
              </div>

              <div className={cn(
                "flex flex-col justify-between p-5 rounded-xl border relative overflow-hidden group transition-all duration-300",
                isPremium 
                  ? "border-amber-500 bg-amber-950/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "border-amber-500/20 hover:border-amber-500/50 bg-[#1b1713]/85"
              )}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-amber-950/25 border border-amber-500/40 text-amber-400">
                      <Crown className="w-4 h-4 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      Premium <Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold tracking-wide text-white flex items-baseline gap-1.5">
                    Celda Dorada Eterna 
                    <span className="text-xs text-amber-400 font-bold">$4.99 USD</span>
                  </h3>
                  
                  <ul className="space-y-1.5 text-[10px] leading-relaxed text-white/65 font-sans">
                    <li className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-400 shrink-0" /> Éter Infinito (No más límites)</li>
                    <li className="flex items-center gap-1.5"><Mic2 className="w-3 h-3 text-amber-400 shrink-0" /> Registros EVP ilimitados</li>
                    <li className="flex items-center gap-1.5"><ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" /> Cero sintonizaciones de anuncios</li>
                    <li className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-amber-400 shrink-0" /> Color Pro Gold en medidores</li>
                  </ul>
                </div>

                <div className="mt-5 relative z-10">
                  {isPremium ? (
                    <div className="w-full py-2 bg-amber-950/40 border border-amber-500/40 text-amber-400 text-center rounded-lg text-xs font-bold tracking-widest uppercase shadow-md flex items-center justify-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 fill-amber-400" /> PRO ADQUIRIDO
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {buyingState === 'none' && (
                        <button
                          onClick={() => setBuyingState('card')}
                          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black text-xs uppercase tracking-widest hover:brightness-110 shadow-lg cursor-pointer transform hover:scale-[1.02] transition-transform"
                        >
                          OBTENER PRO ILIMITADO
                        </button>
                      )}
                      
                      {buyingState === 'card' && (
                        <p className="text-[10px] uppercase font-bold text-amber-400 animate-pulse text-end text-center flex items-center justify-center gap-1">
                          RELLENA LOS DATOS DE PAGO
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {buyingState !== 'none' && !isPremium && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-5 border border-white/5 bg-black/40 rounded-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pasarela de Pago Segura Simulada
                  </span>
                  <span className="text-[9px] text-[#bfdbfe]/60 underline font-mono">Modo de Prueba</span>
                </div>

                {buyingState === 'card' && (
                  <form onSubmit={buyPremium} className="space-y-3 font-sans">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-white/40 block font-mono">Nombre en la tarjeta</label>
                      <input 
                        required
                        type="text" 
                        placeholder="John Doe"
                        value={paymentCard.cardholder}
                        onChange={(e) => setPaymentCard(prev => ({ ...prev, cardholder: e.target.value }))}
                        className="w-full bg-[#1b1c20] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/60 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-white/40 block font-mono">Número Tarjeta</label>
                        <input 
                          required
                          type="text" 
                          maxLength={19}
                          placeholder="4000 1234 5678 9010"
                          value={paymentCard.number}
                          onChange={(e) => setPaymentCard(prev => ({ ...prev, number: e.target.value }))}
                          className="w-full bg-[#1b1c20] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/60 font-mono"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-white/40 block font-mono">Venc.</label>
                          <input 
                            required
                            type="text" 
                            maxLength={5}
                            placeholder="MM/AA"
                            value={paymentCard.expiry}
                            onChange={(e) => setPaymentCard(prev => ({ ...prev, expiry: e.target.value }))}
                            className="w-full bg-[#1b1c20] border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/60 text-center font-mono"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-white/40 block font-mono">CVV</label>
                          <input 
                            required
                            type="password" 
                            maxLength={3}
                            placeholder="***"
                            value={paymentCard.cvc}
                            onChange={(e) => setPaymentCard(prev => ({ ...prev, cvc: e.target.value }))}
                            className="w-full bg-[#1b1c20] border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/60 text-center font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setBuyingState('none')}
                        className="w-1/3 py-2 border border-zinc-800 hover:bg-white/5 text-zinc-400 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer font-mono"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-lg text-xs uppercase tracking-widest hover:brightness-110 shadow-lg cursor-pointer transform active:scale-95 transition-transform font-mono"
                      >
                        PAGAR $4.99 USD
                      </button>
                    </div>
                  </form>
                )}

                {buyingState === 'loading' && (
                  <div className="py-6 flex flex-col items-center justify-center gap-3">
                    <span className="text-2xl animate-spin text-amber-400">⚡</span>
                    <p className="text-xs text-amber-400 font-mono font-bold tracking-widest uppercase animate-pulse">
                      Sincronizando firma de pago segura...
                    </p>
                    <p className="text-[9px] text-[#bfdbfe]/40 font-mono">Cargando condensador espectral</p>
                  </div>
                )}

                {buyingState === 'success' && (
                  <div className="py-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-950/20 border border-amber-500 flex items-center justify-center text-amber-400 mx-auto animate-bounce">
                      <Crown className="w-6 h-6 fill-amber-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest font-mono">¡CORE ACTIVO PERPETUAMENTE!</h4>
                      <p className="text-[9px] text-white/50 max-w-xs mx-auto font-sans leading-relaxed">
                        Firma criptográfica asociada. Suministro ilimitado infundido exitosamente. ¡Bienvenido a Specter-Pro!
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* Footer Info & Compliance Disclaimer */}
      <div className="mt-12 max-w-xl mx-auto flex flex-col items-center gap-5 text-center px-4 relative z-10 select-none">
        <div className="flex items-center gap-6 opacity-45 text-[10px] uppercase tracking-[0.3em] font-mono">
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-500" /> EMF: {isStarted ? (Math.random() * 5).toFixed(2) : "0.00"} mG</span>
          <span className="flex items-center gap-1.5"><Ghost className="w-3.5 h-3.5 text-purple-400" /> Temp: {isStarted ? (20 - Math.random() * 5).toFixed(1) : "21.0"}°C</span>
        </div>
        
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md max-w-md">
          <p className="text-[9px] uppercase tracking-[0.1em] font-bold text-white/50 mb-1">
            Declaración de Cumplimiento e IA
          </p>
          <p className="text-[9px] leading-relaxed text-white/35 font-sans">
            Esta aplicación es un simulador interactivo sintonizador con propósitos de entretenimiento. Todas las psicofonías, anomalías de espectro y respuestas verbales en tiempo real son sintetizadas y simuladas mediante Inteligencia Artificial (Google Gemini SDK) y filtros Web Audio. No registra fenómenos paranormales, médicos o científicos reales.
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 opacity-25 text-[8px] uppercase tracking-[0.25em] font-mono">
          <p>© 2026 Laboratorios de Investigación Paranormal</p>
          <p className="text-[7px]">Simulador EVP de Radio-Recepción Espectral • Powered by Gemini</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Frequency Pointer/Needle Sweep */
        @keyframes pointer-sweep {
          0% { left: 4%; }
          100% { left: 96%; }
        }

        /* CRT Scanline Scrolling Animation */
        @keyframes crt-scan {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        .animate-crt-scan {
          animation: crt-scan 12s linear infinite;
        }

        /* Vertical Laser Line sweep indicator */
        @keyframes laser-sweep {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-laser-sweep {
          animation: laser-sweep 2.5s ease-in-out infinite;
        }

        /* Oscilloscope Waveform scrolling & moving */
        .animate-oscilloscope-back {
          stroke-dasharray: 8, 4;
          animation: osc-scroll-back 4s linear infinite;
        }
        .animate-oscilloscope-front {
          stroke-dasharray: 40, 10;
          animation: osc-scroll-front 1.5s linear infinite;
        }

        @keyframes osc-scroll-back {
          100% { stroke-dashoffset: 60; }
        }
        @keyframes osc-scroll-front {
          100% { stroke-dashoffset: -120; }
        }

        /* LED Equalizer rise/fall bouncy effect */
        @keyframes led-rise {
          0% { opacity: 0.2; transform: scaleY(0.4); }
          50% { opacity: 0.6; }
          100% { opacity: 1; transform: scaleY(1.1); }
        }

        /* Analogue Receiver flickers */
        @keyframes flicker-slow {
          0%, 100% { opacity: 0.95; }
          25% { opacity: 0.6; }
          28% { opacity: 0.3; }
          32% { opacity: 0.85; }
          74% { opacity: 0.95; }
          76% { opacity: 0.45; }
          80% { opacity: 0.95; }
        }
        .animate-flicker-slow {
          animation: flicker-slow 2s infinite;
        }

        @keyframes flicker-med {
          0%, 100% { opacity: 0.95; }
          18% { opacity: 0.2; }
          22% { opacity: 0.85; }
          50% { opacity: 0.95; }
          55% { opacity: 0.35; }
          58% { opacity: 0.95; }
        }
        .animate-flicker-medium {
          animation: flicker-med 1.2s infinite;
        }

        @keyframes flicker-fast {
          0%, 100% { opacity: 1; }
          10% { opacity: 0.15; }
          12% { opacity: 0.95; }
          30% { opacity: 1; }
          33% { opacity: 0.3; }
          36% { opacity: 0.95; }
          65% { opacity: 1; }
          68% { opacity: 0.2; }
          71% { opacity: 1; }
        }
        .animate-flicker-fast {
          animation: flicker-fast 0.75s infinite;
        }
      `}} />
    </div>
  );
}
