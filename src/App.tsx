import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Image, RefreshCw, Music } from "lucide-react";
import { CardConfig, DEFAULT_CONFIG } from "./types";
import { nasheedSynth } from "./utils/audioSynth";
import CardMirror from "./components/CardMirror";

export default function App() {
  const [config, setConfig] = useState<CardConfig>(DEFAULT_CONFIG);
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0.45); // Default comfortable volume
  const [isReceiver, setIsReceiver] = useState(false);
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [copiedInstant, setCopiedInstant] = useState(false);
  const [copiedCloud, setCopiedCloud] = useState(false);
  
  // Custom audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load custom card configuration from URL or api endpoint on mount
  useEffect(() => {
    const loadSharedCard = async () => {
      const params = new URLSearchParams(window.location.search);
      const cardId = params.get("cardId");
      
      if (cardId) {
        setIsReceiver(true);
        setIsLoadingCard(true);
        try {
          const res = await fetch(`/api/card/${cardId}`);
          if (res.ok) {
            const data = await res.json();
            setConfig(data);
          } else {
            console.error("Failed to load customized birthday card data from server");
          }
        } catch (err) {
          console.error("Error reading shared card state:", err);
        } finally {
          setIsLoadingCard(false);
        }
        return;
      }

      // Legacy fallback system (kept for backwards compatibility/fallback)
      try {
        const cardDataStr = params.get("card");
        if (cardDataStr) {
          setIsReceiver(true);
          const decoded = JSON.parse(decodeURIComponent(escape(atob(cardDataStr))));
          const hydratedConfig: CardConfig = {
            ...DEFAULT_CONFIG,
            title: decoded.t || DEFAULT_CONFIG.title,
            blessing: decoded.b || DEFAULT_CONFIG.blessing,
            closing: decoded.c || DEFAULT_CONFIG.closing,
            burgundyColor: decoded.bc || DEFAULT_CONFIG.burgundyColor,
            goldColor: decoded.gc || DEFAULT_CONFIG.goldColor,
            blackColor: decoded.bl || DEFAULT_CONFIG.blackColor,
            ivoryColor: decoded.ic || DEFAULT_CONFIG.ivoryColor,
            portraitSrc: decoded.ps || DEFAULT_CONFIG.portraitSrc,
            personalPortraitUrl: decoded.pu || DEFAULT_CONFIG.personalPortraitUrl,
            musicType: decoded.mt || DEFAULT_CONFIG.musicType,
            musicPreset: decoded.mp || DEFAULT_CONFIG.musicPreset,
          };
          setConfig(hydratedConfig);
        }
      } catch (e) {
        console.warn("Could not parse customized legacy parameters:", e);
      }
    };

    loadSharedCard();
  }, []);

  // Sync Audio Synthesizer & Custom HTML5 Audio based on Active States
  useEffect(() => {
    const handleAudioSync = async () => {
      // 1. Synthesized Web Audio
      if (isActive && config.musicType === "synthesized") {
        try {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          await nasheedSynth.start(config.musicPreset || "hasbi");
          nasheedSynth.setVolume(volume);
        } catch (err) {
          console.warn("Web audio playback was suspended or blocked: ", err);
        }
      } else {
        nasheedSynth.stop();
      }

      // 2. Custom Uploaded Audio File
      if (audioRef.current) {
        if (isActive && config.musicType === "custom" && config.customMusicUrl) {
          audioRef.current.volume = volume;
          nasheedSynth.stop(); // stop synthesized soundtrack
          try {
            audioRef.current.play();
          } catch (err) {
            console.warn("HTML5 audio playback blocked: ", err);
          }
        } else {
          audioRef.current.pause();
        }
      }
    };

    handleAudioSync();

    return () => {
      nasheedSynth.stop();
    };
  }, [isActive, config.musicType, config.customMusicUrl, config.musicPreset]);

  // Dynamic Volume Adjustments
  useEffect(() => {
    if (config.musicType === "synthesized") {
      nasheedSynth.setVolume(volume);
    }
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, config.musicType]);

  const handleToggleActive = () => {
    setIsActive(!isActive);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === "string") {
          setConfig((prev) => ({
            ...prev,
            portraitSrc: "personal",
            personalPortraitUrl: event.target!.result,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyInstantLink = async () => {
    try {
      if (config.portraitSrc === "personal" && config.personalPortraitUrl && config.personalPortraitUrl.startsWith("data:")) {
        alert("⚠️ Note: Your custom gallery photo is too large to encode directly into an instant serverless URL. Please use the 'Cloud Saved Link' instead, which saves the file securely on the server!");
        return;
      }

      // Convert configurations into a base64 string
      const serialized = btoa(unescape(encodeURIComponent(JSON.stringify({
        t: config.title,
        b: config.blessing,
        c: config.closing,
        bc: config.burgundyColor,
        gc: config.goldColor,
        bl: config.blackColor,
        ic: config.ivoryColor,
        ps: config.portraitSrc,
        pu: config.portraitSrc === "personal" ? config.personalPortraitUrl : undefined,
        mt: config.musicType,
        mp: config.musicPreset,
      }))));

      const shareUrl = `${window.location.origin}/?card=${serialized}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedInstant(true);
      setTimeout(() => setCopiedInstant(false), 3000);
      alert("✨ Success! Instant serverless share link copied directly to your clipboard!\n\nThis link contains your dynamic greetings, colors, and selected nasheed song. It works permanently and immediately without needing any server database!");
    } catch (err) {
      console.error("Failed generating instant parameters:", err);
      alert("⚠️ Could not generate the instant link. Please try using the Cloud Saved Link instead.");
    }
  };

  const handleShareCard = async () => {
    if (isSavingCard) return;
    setIsSavingCard(true);
    try {
      const res = await fetch("/api/upload-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.cardId) {
          const origin = window.location.origin;
          const shareUrl = `${origin}/?cardId=${data.cardId}`;
          await navigator.clipboard.writeText(shareUrl);
          setCopiedCloud(true);
          setTimeout(() => setCopiedCloud(false), 3000);
          alert("✨ SubhanAllah! Your customized playable digital card has been safely created on the server!\n\nThe private share link has been successfully copied to your clipboard. Send it to your loved ones on WhatsApp, SMS, or Email now!");
        } else {
          throw new Error("Could not create shareable link.");
        }
      } else {
        throw new Error("Server responded with error status.");
      }
    } catch (err) {
      console.error("Failed saving card structure:", err);
      alert("⚠️ There was a problem saving your custom card to the server. Please try again.");
    } finally {
      setIsSavingCard(false);
    }
  };

  if (isLoadingCard) {
    return (
      <div 
        className="min-h-screen text-zinc-100 flex flex-col items-center justify-center p-6 relative tracking-widest font-serif"
        style={{
          backgroundColor: DEFAULT_CONFIG.blackColor,
          backgroundImage: `radial-gradient(circle at 50% 50%, ${DEFAULT_CONFIG.burgundyColor}4a 0%, ${DEFAULT_CONFIG.blackColor} 100%)`
        }}
      >
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
          <span className="text-xs uppercase tracking-[0.25em] text-yellow-500 font-semibold font-sans">
            Loading Customized Card...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-zinc-100 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden relative select-none"
      style={{
        backgroundColor: config.blackColor,
        backgroundImage: `radial-gradient(circle at 50% 50%, ${config.burgundyColor}4a 0%, ${config.blackColor} 100%)`
      }}
      id="root-viewport-greeting-card"
    >
      
      {/* Underlying Animated Light Ray Backdrop for cinematic glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-color-dodge transition-all duration-[3s]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, ${config.goldColor} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* HTML Audio element for custom sounds */}
      {config.customMusicUrl && (
        <audio
          ref={audioRef}
          src={config.customMusicUrl}
          loop
          className="hidden"
        />
      )}

      {/* FLOATING TOP/LEFT MINIMALIST HEADER BAR */}
      <header className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex justify-center items-center z-40 pointer-events-none">
        
        {/* Subtle decorative label */}
        <div className="flex items-center gap-2 pointer-events-auto bg-black/45 backdrop-blur-md border border-amber-500/10 py-1.5 px-3 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span 
            className="text-[10px] tracking-[0.2em] font-serif uppercase"
            style={{ color: config.goldColor }}
          >
            Digital Birthday Card
          </span>
        </div>

      </header>

      {/* MAIN VIEWING CARD PORT (9:16 vertical proportion optimized to fit standard screens dynamically) */}
      <main className="w-full flex-1 flex flex-col items-center justify-center pt-14 pb-8 z-10" id="main-greeting-stage">
        
        {/* Immersive Outer Framer */}
        <div className="relative group/card bg-black p-3.5 sm:p-4 rounded-3xl border border-amber-500/15 shadow-[0_30px_90px_-10px_rgba(0,0,0,0.95)] transition-all duration-[1.2s] max-w-full max-h-[88vh]">
          
          {/* Glass Gloss highlight sheen detail */}
          <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none z-50 transition-opacity" />
          
          <CardMirror
            config={config}
            isActive={isActive}
            onToggleActive={handleToggleActive}
            volume={volume}
            onVolumeChange={setVolume}
          />

        </div>

        {/* Gallery Image Uploader Floating Controls */}
        {!isReceiver && (
          <div className="mt-5 z-20 flex flex-col items-center justify-center gap-4 w-full max-w-sm">
            {/* Elegant Islamic Song Selection Panel for Creator/Owner Only */}
            <div className="flex flex-col items-center gap-2 bg-neutral-900/85 backdrop-blur-xl border border-amber-500/25 p-3 rounded-2xl w-full shadow-[0_15px_30px_rgba(0,0,0,0.6)] animate-fade-in">
              <div className="flex items-center gap-1.5 text-[11px] tracking-[0.16em] uppercase text-yellow-400 font-serif font-black">
                <Music size={12} className="text-yellow-500" />
                <span>SELECT CARD MELODY</span>
              </div>
              <p className="text-[10px] text-zinc-400 text-center leading-normal mb-1 font-sans">
                Receiver will hear your chosen song but cannot see or change this selector.
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 w-full">
                {[
                  { id: "hasbi", name: "Hasbi Rabbi", noteType: "Tradition" },
                  { id: "mawlay", name: "Mawlay Salli", noteType: "Devotional" },
                  { id: "tala_al", name: "Tala'al Badru", noteType: "Classical" },
                  { id: "serenity", name: "Divine Serenity", noteType: "Ethereal" }
                ].map((track) => {
                  const isCurrent = (config.musicPreset || "hasbi") === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => {
                        setConfig((prev) => ({
                          ...prev,
                          musicPreset: track.id as any
                        }));
                      }}
                      className={`flex flex-col items-start px-3 py-2 rounded-xl text-[11px] font-sans font-bold transition-all border cursor-pointer active:scale-95 flex-1 min-w-[100px] text-left ${
                        isCurrent
                          ? "bg-amber-500/20 border-yellow-400/60 text-yellow-100 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                          : "bg-black/40 hover:bg-black/80 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                      type="button"
                    >
                      <span>{track.name}</span>
                      <span className="text-[8.5px] opacity-60 font-light mt-0.5">{track.noteType}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 w-full border-t border-zinc-800/80 pt-4 mt-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <label 
                  className="flex items-center gap-2 py-2 px-5 rounded-full bg-black/60 hover:bg-black/95 backdrop-blur-md border border-amber-500/30 text-yellow-300 hover:text-white transition-all cursor-pointer text-xs font-sans font-semibold tracking-wider uppercase shadow-[0_12px_24px_rgba(0,0,0,0.5)] active:scale-95"
                  title="Upload any portrait photo from your mobile/desktop gallery"
                >
                  <Image size={14} className="text-yellow-400" />
                  <span>Add Photo from Gallery</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </label>

                {config.portraitSrc === "personal" && (
                  <button
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        portraitSrc: "designer",
                        personalPortraitUrl: undefined,
                      }));
                    }}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-red-950/45 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-500/30 transition-all cursor-pointer text-xs font-sans font-semibold uppercase tracking-wider active:scale-95"
                    title="Restore to original premium portrait"
                    type="button"
                  >
                    Reset Photo
                  </button>
                )}
              </div>

              {/* Enhanced Double Share Control Deck */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* 1. Instant Serverless Share (No Server dependency) */}
                <button
                  onClick={handleCopyInstantLink}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-indigo-950/50 hover:bg-indigo-900/60 backdrop-blur-md border border-indigo-500/40 text-indigo-200 hover:text-white transition-all cursor-pointer text-[11px] font-sans font-bold tracking-wider uppercase active:scale-95 ${
                    copiedInstant ? "border-green-400 bg-green-950/30 text-green-200" : ""
                  }`}
                  title="Copy a server-independent link that works instantly with default templates"
                  type="button"
                >
                  <Sparkles size={13} className="text-indigo-400" />
                  <span>{copiedInstant ? "Copied Serverless!" : "Copy Instant Link (No Server)"}</span>
                </button>

                {/* 2. Cloud Server Save (For custom profile photo transfers) */}
                <button
                  onClick={handleShareCard}
                  disabled={isSavingCard}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-md border border-yellow-400/50 text-yellow-100 hover:text-white transition-all cursor-pointer text-[11px] font-sans font-bold tracking-wider uppercase active:scale-95 ${
                    isSavingCard ? "opacity-50 cursor-not-allowed" : ""
                  } ${copiedCloud ? "border-green-400 bg-green-950/30 text-green-200" : ""}`}
                  title="Save configuration and custom uploaded photos securely on the server"
                  type="button"
                >
                  {isSavingCard ? (
                    <RefreshCw size={13} className="text-yellow-400 animate-spin" />
                  ) : (
                    <Sparkles size={13} className="text-yellow-400" />
                  )}
                  <span>{isSavingCard ? "Saving..." : copiedCloud ? "Copied Cloud Link!" : "Copy Saved Link (With Photo)"}</span>
                </button>
              </div>
              <p className="text-[9.5px] text-zinc-500 text-center leading-relaxed max-w-xs font-sans">
                💡 <span className="text-indigo-400 font-semibold">Instant Link</span> encodes setup in URL with no server dependency. <span className="text-yellow-500 font-semibold">Saved Link</span> saves uploaded custom photos to the server database.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* IMMERSIVE PERSISTENT NOTIFICATION FOOTER (Only when not playing yet) */}
      {!isActive && (
        <footer className="absolute bottom-4 sm:bottom-6 z-30 pointer-events-none text-center max-w-xs animate-pulse">
          <p className="text-[10px] tracking-widest font-sans text-zinc-500 uppercase h-4">
            ✦ Click the golden wax seal to begin the music & movement ✦
          </p>
        </footer>
      )}

    </div>
  );
}
