import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, RefreshCw, Star, Sparkles, AlertCircle, Share2, Music } from 'lucide-react';
import { VibeResult, DecisionHistoryEntry } from '../types';

interface VibeCheckGameProps {
  onSaveDecision: (entry: Omit<DecisionHistoryEntry, 'id' | 'timestamp'>) => void;
  onRequestVibe?: (customInput?: string) => Promise<any>;
  isAiLoading?: boolean;
}

const CONSTANT_VIBES: VibeResult[] = [
  {
    title: "You're rocking a relaxed vibe today 🌿",
    subValue: "Very laid-back, modern, and friendly. People find it incredibly easy to open up to you today.",
    metrics: [
      { label: "Casual", percentage: 88, rating: 4 },
      { label: "Trendy", percentage: 72, rating: 4 },
      { label: "Elegant", percentage: 40, rating: 2 },
      { label: "Bohemian", percentage: 80, rating: 4 }
    ],
    bubbles: [
      { label: "Laid-back", percentage: 91, colorClass: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
      { label: "Sophisticated", percentage: 82, colorClass: "bg-indigo-500/10 text-indigo-700 border-indigo-200" },
      { label: "Cute", percentage: 65, colorClass: "bg-rose-500/10 text-rose-700 border-rose-200" }
    ]
  },
  {
    title: "You're radiating pure corporate high-energy today 💼",
    subValue: "Extremely tidy, focused, and ambitious. You look ready to close five major deals before lunchtime.",
    metrics: [
      { label: "Casual", percentage: 22, rating: 1 },
      { label: "Trendy", percentage: 85, rating: 5 },
      { label: "Elegant", percentage: 95, rating: 5 },
      { label: "Bohemian", percentage: 15, rating: 1 }
    ],
    bubbles: [
      { label: "Ambitious", percentage: 95, colorClass: "bg-amber-500/10 text-amber-700 border-amber-200" },
      { label: "Determined", percentage: 88, colorClass: "bg-indigo-500/10 text-indigo-700 border-indigo-200" },
      { label: "Sophisticated", percentage: 94, colorClass: "bg-purple-500/10 text-purple-700 border-purple-200" }
    ]
  },
  {
    title: "You're channeling cozy vintage dreamland ☕",
    subValue: "Soft, artistic, thoughtful, and slightly mysterious. You resemble a character from a French indie movie.",
    metrics: [
      { label: "Casual", percentage: 75, rating: 4 },
      { label: "Trendy", percentage: 60, rating: 3 },
      { label: "Elegant", percentage: 78, rating: 4 },
      { label: "Bohemian", percentage: 92, rating: 5 }
    ],
    bubbles: [
      { label: "Artistic", percentage: 92, colorClass: "bg-purple-500/10 text-purple-700 border-purple-200" },
      { label: "Thoughtful", percentage: 87, colorClass: "bg-cyan-500/10 text-cyan-700 border-cyan-200" },
      { label: "Chill", percentage: 90, colorClass: "bg-indigo-500/10 text-indigo-700 border-indigo-200" }
    ]
  }
];

export function VibeCheckGame({ onSaveDecision, onRequestVibe, isAiLoading }: VibeCheckGameProps) {
  const [step, setStep] = useState<'camera' | 'scanning' | 'result'>('camera');
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [vibeResult, setVibeResult] = useState<VibeResult>(CONSTANT_VIBES[0]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Stop current tracks first before starting a new stream to prevent permission locks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        let stream: MediaStream;
        try {
          // Attempt using standard, mobile-friendly 'ideal' properties rather than fixed constraints.
          // This avoids the OverconstrainedError (TypeError) commonly seen on iOS and Android Chrome.
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 645 },
              height: { ideal: 485 }
            }
          });
        } catch (overconstrainedErr) {
          console.warn("Retrying with minimal constraints fallback", overconstrainedErr);
          // Standard fallback to prevent errors on strict-constraint browsers
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode }
          });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Android and iOS Chrome/Safari require explicit .play() trigger to resolve H.264 video block states
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.warn("Webcam autoplay playPromise catch: play was interrupted or requires interaction", e);
            });
          }
        }
        setStreamActive(true);
      } else {
        setCameraError("Camera capture interface not supported on this browser.");
      }
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraError("Webcam access declined or currently busy. Please verify permissions in your mobile address bar, or utilize 'Random Card'!");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    if (step === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step, facingMode]);

  const handleSnapPhoto = () => {
    // If standard streaming is active, convert to canvas image
    if (streamActive && videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Flip horizontally if front facing camera is used to match live video preview aspect
          if (facingMode === 'user') {
            ctx.translate(400, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(videoRef.current, 0, 0, 400, 400);
          setCapturedImage(canvas.toDataURL('image/png'));
        }
      } catch (e) {
         setCapturedImage('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400');
      }
    } else {
      // Warm elegant fallback portrait
      setCapturedImage('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400');
    }

    setStep('scanning');
    setProgress(0);
  };

  // Run progress scanner simulation
  useEffect(() => {
    if (step !== 'scanning') return;
    
    let geminiResult: any = null;
    let geminiError: any = null;
    let requestFinished = false;

    if (onRequestVibe) {
      onRequestVibe()
        .then((res) => {
          geminiResult = res;
          requestFinished = true;
        })
        .catch((err) => {
          geminiError = err;
          requestFinished = true;
        });
    } else {
      requestFinished = true;
    }

    let curProgress = 0;
    const interval = setInterval(() => {
      if (curProgress >= 100) {
        if (requestFinished) {
          clearInterval(interval);
          
          let pickedVibe: VibeResult;
          if (geminiResult && !geminiError) {
            const colorClasses = [
              "bg-emerald-500/10 text-emerald-700 border-emerald-200",
              "bg-indigo-500/10 text-indigo-700 border-indigo-200",
              "bg-rose-500/10 text-rose-700 border-rose-200"
            ];
            pickedVibe = {
              ...geminiResult,
              bubbles: (geminiResult.bubbles || []).map((b: any, index: number) => ({
                ...b,
                colorClass: colorClasses[index % colorClasses.length]
              }))
            };
          } else {
            const randomIndex = Math.floor(Math.random() * CONSTANT_VIBES.length);
            pickedVibe = CONSTANT_VIBES[randomIndex];
          }

          setVibeResult(pickedVibe);
          setStep('result');

          onSaveDecision({
            gameType: 'vibe',
            title: 'Vibe Scanner',
            result: pickedVibe.title,
            options: pickedVibe.bubbles.map(b => `${b.label} (${b.percentage}%)`)
          });
        }
        return;
      }
      
      const nextProgress = curProgress + 8;
      if (nextProgress >= 100) {
        if (requestFinished) {
          curProgress = 100;
        } else {
          curProgress = 99;
        }
      } else {
        curProgress = nextProgress;
      }
      setProgress(curProgress);
    }, 150);

    return () => clearInterval(interval);
  }, [step]);

  const handleTryAgain = () => {
    setCapturedImage(null);
    setStep('camera');
  };

  const handleUploadClick = () => {
    // Simulated high quality bohemian portrait upload
    setCapturedImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400');
    setStep('scanning');
    setProgress(0);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-4">
        <span className="font-sans font-semibold text-[11px] tracking-wider text-primary uppercase">Cosmic Energy Scanner</span>
        <h2 className="font-display font-bold text-2xl text-on-surface mt-0.5">Vibe Scanner</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
          Curious about your aura today? Activate our fun, simulated biometric scanner to find your cosmic style wavelength!
        </p>
      </div>

      {step === 'camera' && (
        <div className="w-full max-w-sm flex flex-col items-center p-4 bg-white border border-outline-variant/30 rounded-3xl shadow-sm">
          {/* Facial alignment camera viewport */}
          <div className="relative w-60 h-60 rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center border-2 border-primary/20 mb-4">
            
            {streamActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            ) : (
              <div className="text-center px-4">
                <p className="text-[10px] text-neutral-400 font-sans mb-1">Webcam initializing...</p>
                <div className="w-8 h-8 border-2 border-t-primary border-neutral-700 rounded-full animate-spin mx-auto"></div>
              </div>
            )}

            {/* Glowing UI Corner Frames */}
            <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#ff7eb3] rounded-tl-sm"></div>
            <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#ff7eb3] rounded-tr-sm"></div>
            <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#ff7eb3] rounded-bl-sm"></div>
            <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#ff7eb3] rounded-br-sm"></div>

            {/* Virtual target grid */}
            <div className="absolute inset-0 border border-white/5 pointer-events-none flex items-center justify-center">
              <div className="w-40 h-40 border border-dashed border-white/25 rounded-full flex items-center justify-center">
                <div className="w-20 h-20 border border-dashed border-white/20 rounded-full"></div>
              </div>
            </div>

            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider whitespace-nowrap z-10">
              Position your smiling face!
            </div>

            {streamActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
                }}
                className="absolute bottom-2.5 right-2.5 bg-black/75 hover:bg-black w-8 h-8 rounded-full flex items-center justify-center border border-white/10 shadow-md transition-all active:scale-95 z-10 cursor-pointer"
                title="Switch Camera (Front/Rear)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#ff7eb3]" />
              </button>
            )}
          </div>

          {/* Action triggers */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <button
              onClick={handleSnapPhoto}
              className="w-full bg-gradient-to-r from-primary to-tertiary text-white font-sans font-bold text-xs py-3 rounded-xl shadow-xs active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Vibe!</span>
            </button>

            <button
              onClick={handleUploadClick}
              className="w-full sm:w-auto px-4 py-3 border border-outline-variant hover:border-primary text-outline bg-transparent hover:bg-primary/5 font-sans font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-1 focus:outline-none cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Random Card</span>
            </button>
          </div>

          {cameraError && (
            <div className="mt-3 p-3 bg-indigo-50/90 border border-indigo-150/40 rounded-xl flex flex-col gap-2 text-[10px] text-indigo-900 leading-tight w-full">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600 mt-0.5" />
                <span>{cameraError}</span>
              </div>
              <button
                type="button"
                onClick={startCamera}
                className="self-center bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-[9px] px-3 py-1.5 rounded-lg transition-transform active:scale-95 uppercase tracking-wide cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Retry Camera Activation</span>
              </button>
            </div>
          )}

          <p className="text-[9px] text-outline text-center mt-3 leading-relaxed">
            "No images are ever sent anywhere. Real security meets infinite playfulness."
          </p>
        </div>
      )}

      {step === 'scanning' && (
        <div className="w-full max-w-sm flex flex-col items-center p-4 bg-white border border-outline-variant/30 rounded-3xl shadow-sm text-center">
          <div className="relative w-40 h-40 rounded-xl overflow-hidden mb-4 border-2 border-tertiary shadow-sm">
            <img
              src={capturedImage || ''}
              alt="Analyzing Vibe"
              className="w-full h-full object-cover"
            />
            {/* Laser scanning line */}
            <div className="absolute left-0 w-full h-1 bg-[#ff56a7] animate-scan-line shadow-[0_0_10px_#ff56a7] top-0"></div>
          </div>

          <h4 className="font-display font-bold text-sm text-on-surface">
            {progress === 99 ? 'Aura Alignment...' : 'Decrypting Biometrics...'}
          </h4>
          <p className="text-[11px] text-on-surface-variant font-sans mt-0.5">
            {progress === 99 ? 'Gemini AI is reading your aura signature...' : 'Staring into the neural vibe cluster of your choices.'}
          </p>

          <div className="w-full bg-neutral-100 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#4648d4] via-[#8455ef] to-[#fd56a7] h-full rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-[9px] font-mono font-bold text-primary mt-1.5 block">PROCESSING VIBE: {progress}%</span>
        </div>
      )}

      {step === 'result' && (
        <div className="w-full max-w-sm bg-white border border-outline-variant/20 rounded-3xl overflow-hidden shadow-sm flex flex-col relative">
          
          {/* Result Header visual banner */}
          <div className="relative h-44 w-full overflow-hidden">
            <img
              src={capturedImage || ''}
              alt="Scan outcome"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20"></div>

            {/* Hovering decorative bubbles */}
            {vibeResult.bubbles.map((bubble, i) => {
              const placements = [
                "top-3 right-3",
                "bottom-8 left-3",
                "bottom-12 right-6"
              ];
              return (
                <div
                  key={i}
                  className={`absolute ${placements[i % placements.length]} px-2.5 py-1 rounded-full border border-white font-sans font-black text-[10px] shadow-sm animate-float ${bubble.colorClass}`}
                >
                  {bubble.label} {bubble.percentage}%
                </div>
              );
            })}
          </div>

          {/* Vibe description */}
          <div className="p-4 bg-emerald-50/25 border-b border-outline-variant/20">
            <h3 className="font-display font-black text-sm text-emerald-950 text-center leading-tight">
              {vibeResult.title}
            </h3>
            <p className="text-[11px] text-on-surface-variant text-center font-sans mt-1 max-w-xs mx-auto leading-relaxed">
              {vibeResult.subValue}
            </p>
          </div>

          {/* Breakdown parameters */}
          <div className="p-4">
            <h4 className="font-display font-extrabold text-[10px] text-outline uppercase tracking-wider font-sans mb-2.5">
              Your Vibe Breakdown
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {vibeResult.metrics.map((metric, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex justify-between items-center text-[11px] font-semibold mb-0.5">
                    <span className="text-on-surface">{metric.label}</span>
                    <span className="text-primary font-mono text-[10px]">{metric.percentage}%</span>
                  </div>

                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3 h-3 ${idx < metric.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AdSense Placement block custom preset matching the mockup layout */}
          <div className="mx-4 mb-4 p-2 bg-teal-50/50 border border-teal-150/40 rounded-xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
                <Music className="w-3.5 h-3.5 text-pink-600 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] bg-neutral-200/50 text-neutral-600 px-1 py-0.2 uppercase font-bold rounded">Ad</span>
                <p className="text-[10px] text-teal-950 font-sans font-semibold leading-tight">Chill Beats Playlist</p>
              </div>
            </div>
            <button className="bg-white text-[9px] font-bold py-1 px-2.5 rounded-lg text-primary border border-outline-variant/20 hover:bg-emerald-50">
              Listen
            </button>
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-outline-variant/10 flex flex-col gap-2">
            <button
              onClick={() => alert("Link copied to clipboard! Share the aura check result now.")}
              className="w-full bg-primary hover:bg-tertiary text-white font-sans font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share with Friends</span>
            </button>
            <button
              onClick={handleTryAgain}
              className="w-full bg-[#f1f5f9] hover:bg-neutral-200 text-on-surface font-sans font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-98 outline-none"
            >
              <RefreshCw className="w-3 h-3 text-outline" />
              <span>Scan Vibe Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
