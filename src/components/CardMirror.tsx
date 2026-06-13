import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, Sparkles, Heart, RefreshCw } from "lucide-react";
import { CardConfig } from "../types";

// Import the generated luxury portrait directly
// @ts-expect-error - Vite resolves the static image asset reference at bundle time
import defaultPortrait from "../assets/images/exact_user_portrait_1781320664783.jpg";

interface CardMirrorProps {
  config: CardConfig;
  isActive: boolean; // if the card is "opened" and playing
  onToggleActive: () => void;
  volume: number;
  onVolumeChange: (val: number) => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  fadeSpeed: number;
  color: string;
  drift: number;
}

export default function CardMirror({
  config,
  isActive,
  onToggleActive,
  volume,
  onVolumeChange,
}: CardMirrorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useVolume, setUseVolume] = useState(volume > 0);

  // Toggle silent/unmute state
  const handleVolumeToggle = () => {
    const nextVolume = useVolume ? 0 : 0.6;
    setUseVolume(!useVolume);
    onVolumeChange(nextVolume);
  };

  // Canvas particle effect logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rAFId: number;
    let particles: Particle[] = [];

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 360;
      canvas.height = canvas.parentElement?.clientHeight || 640;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initial particles batch
    const createParticle = (initBottom = false): Particle => {
      const x = Math.random() * canvas.width;
      const y = initBottom ? canvas.height + 10 : Math.random() * canvas.height;
      
      // Different shades of luxurious warm gold
      const goldTones = [
        "rgba(212, 175, 55, ",  // Metallic Gold
        "rgba(255, 239, 186, ", // Pale Ivory Gold
        "rgba(202, 163, 67, ",  // Warm Marigold
        "rgba(254, 223, 142, ", // Sun Gold
        "rgba(170, 124, 17, "   // Rich Bronze Gold
      ];
      const colorBase = goldTones[Math.floor(Math.random() * goldTones.length)];

      return {
        x,
        y,
        size: Math.random() * 2.8 + 0.4,
        speed: (Math.random() * 0.5 + 0.2) * config.particleSpeed,
        opacity: Math.random() * 0.7 + 0.1,
        fadeSpeed: Math.random() * 0.006 + 0.002,
        color: colorBase,
        drift: (Math.random() - 0.5) * 0.3,
      };
    };

    // Instantiate original pool
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(createParticle(false));
    }

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        // Soft drift upward motion
        p.y -= p.speed;
        p.x += p.drift;

        // Sparkle alpha flicker
        p.opacity += (Math.random() - 0.5) * 0.08;
        if (p.opacity > 0.95) p.opacity = 0.95;
        if (p.opacity < 0.05) p.opacity = 0.05;

        // Draw particle with gorgeous circular blur shadow radial gradients if large, else simple arcs
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Optional lens glow for larger crystals
        if (p.size > 2.2) {
          ctx.beginPath();
          const blurGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
          blurGrad.addColorStop(0, `${p.color}${p.opacity * 0.3})`);
          blurGrad.addColorStop(1, "rgba(212, 175, 55, 0)");
          ctx.fillStyle = blurGrad;
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Recycle particles that draft off the top
        if (p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[idx] = createParticle(true);
        }
      });

      rAFId = requestAnimationFrame(animate);
    };

    if (isActive) {
      animate();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(rAFId);
    };
  }, [isActive, config.particleCount, config.particleSpeed]);

  // Choose correct image source
  const activeImage =
    config.portraitSrc === "personal" && config.personalPortraitUrl
      ? config.personalPortraitUrl
      : defaultPortrait;

  return (
    <div
      className="relative w-[340px] xs:w-[360px] sm:w-[380px] md:w-[390px] max-w-[calc(100vw-2rem)] aspect-[9/16] rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-amber-500/20 bg-neutral-950 select-none flex flex-col justify-between"
      style={{
        boxShadow: `0 24px 70px rgba(0,0,0,0.85), 0 0 40px ${config.burgundyColor}33`,
      }}
      id="digital-card-container"
    >
      {/* 9:16 Inner Layout Framework */}
      <div className="absolute inset-0 flex flex-col justify-between p-7 z-10">
        
        {/* TOP: Card Header decoration */}
        <div className="flex justify-between items-center z-20">
          {/* Authentic Islamic Geometric Star Vector Detail */}
          <svg className="w-8 h-8 text-amber-500/30 filter drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 2L15 9H22L16 14L18 21L12 17L6 21L8 14L2 9H9L12 2Z" />
            <path d="M12 4L14 9.5H20L15 13L17 19L12 15.5L7 19L9 13L4 9.5H10L12 4Z" opacity="0.5" />
          </svg>
          
          {/* Quick Sound/Mute HUD Toggle inside the card */}
          {isActive && (
            <button
              onClick={handleVolumeToggle}
              className="p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-amber-500/30 text-yellow-300 hover:text-white hover:bg-black/70 transition-all cursor-pointer"
              title={useVolume ? "Mute nasheed" : "Unmute nasheed"}
              type="button"
              id="hud-sound-toggle"
            >
              {useVolume ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
          )}
          
          <svg className="w-8 h-8 text-amber-500/30 filter drop-shadow rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 2L15 9H22L16 14L18 21L12 17L6 21L8 14L2 9H9L12 2Z" />
          </svg>
        </div>

        {/* BOTTOM CONTENT AREA (Texts and visual cards overlay) */}
        <div className="space-y-4 z-20">
          <AnimatePresence>
            {isActive && (
              <div className="space-y-4 text-center">
                {/* 1. Header: "Happy Birthday Immu" with Premium Metallic Gold Text Style */}
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-1.5"
                >
                  <p 
                    className="text-[10px] tracking-[0.25em] uppercase font-sans text-amber-500/80 font-medium"
                    style={{ color: config.goldColor }}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                  <h1
                    className="text-3xl font-bold tracking-wider uppercase font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                    style={{
                      fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
                      color: config.goldColor,
                      backgroundImage: `linear-gradient(to bottom, #FFFDF0 0%, ${config.goldColor} 50%, #A37410 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {config.title}
                  </h1>
                </motion.div>

                {/* Islamic Mandala Separator Accent */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.3, rotate: -45 }}
                  animate={{ opacity: 0.6, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.85, duration: 1.2, ease: "easeOut" }}
                  className="flex items-center justify-center gap-2 py-0.5"
                >
                  <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-amber-500/60" />
                  <span className="text-[8px] text-amber-500 font-serif">✦</span>
                  <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-amber-500/60" />
                </motion.div>

                {/* 2. Body Text: Blessing with high readability ivory tones and beautiful spacing */}
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15, duration: 1.5, ease: "easeOut" }}
                  className="text-sm font-sans leading-relaxed tracking-wide drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)] px-1"
                  style={{
                    color: config.ivoryColor,
                    fontFamily: "'Playfair Display', 'Inter', serif",
                  }}
                >
                  {config.blessing}
                </motion.p>

                {/* 3. Closing Text: Elegant flowing cursive typography */}
                <motion.p
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.7, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                  className="text-lg italic font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  style={{
                    color: config.goldColor,
                    fontFamily: "'Alex Brush', 'Great Vibes', cursive, serif",
                  }}
                >
                  {config.closing}
                </motion.p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cinematic Main Portrait Frame with slow zoom (Ken Burns Effect) */}
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full">
          {/* Black Vignette Overlay for dark premium mood */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60 z-[2] mix-blend-multiply" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_20%,rgba(0,0,0,0.95)_100%)] z-[2]" />
          
          {/* Dynamic Light Sweep / Lens Rays Overlay */}
          {isActive && (
            <div 
              className="absolute inset-0 z-[1] mix-blend-color-dodge opacity-35"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 20%, ${config.goldColor}66 0%, rgba(0,0,0,0) 65%)`,
                animation: `pulse-light ${config.animationSpeed * 1.5}s infinite ease-in-out`
              }}
            />
          )}

          {/* Golden Ambient Vignette behind photo */}
          <div 
            className="absolute inset-0 z-0 transition-all duration-1000"
            style={{
              backgroundColor: config.blackColor,
              backgroundImage: `radial-gradient(circle, ${config.burgundyColor}44 0%, ${config.blackColor} 100%)`
            }}
          />

          {/* Under-Image Islamic Arabesque Geometric Backdrop (Subtle) */}
          <div className="absolute inset-0 z-[1] opacity-15 flex items-center justify-center p-8 pointer-events-none">
            <svg className="w-full h-auto text-amber-500/40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.25">
              <circle cx="50" cy="50" r="45" />
              <polygon points="50,5 95,50 50,95 5,50" />
              <polygon points="18,18 82,18 82,82 18,82" />
              <circle cx="50" cy="50" r="30" />
              <path d="M50,0 L50,100 M0,50 L100,50" />
              <path d="M15,15 L85,85 M15,85 L85,15" opacity="0.5" />
            </svg>
          </div>

          {/* Actual Portrait Image */}
          <img
            src={activeImage}
            alt="Birthday Portrait of Honor"
            className="w-full h-full object-cover origin-center z-[1] transition-transform select-none"
            style={{
              transform: isActive 
                ? `scale(${config.zoomScale}) translate(${(config.zoomScale - 1) * -4}px, ${(config.zoomScale - 1) * 6}px)` 
                : "scale(1.0) translate(0px, 0px)",
              transition: `transform ${config.animationSpeed * 5}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
            }}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Floating Canvas particles for golden dust shimmer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[3] pointer-events-none mix-blend-screen"
      />

      {/* Elegant Golden Border with Intricate Metallic Corner Accents */}
      <motion.div 
        initial={{ opacity: 0.3, scale: 0.94 }}
        animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.97 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-2.5 z-40 pointer-events-none"
        style={{
          border: `1.5px solid ${config.goldColor}40`,
          boxShadow: isActive ? `inset 0 0 15px ${config.goldColor}15` : "none"
        }}
      >
        <div 
          className="absolute inset-1 pointer-events-none opacity-80"
          style={{ border: `0.5px solid ${config.goldColor}25` }}
        />

        {/* INTRICATE CORNERS */}
        {/* Top Left */}
        <svg className="absolute -top-1 -left-1 w-6 h-6 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0,0 L12,0 L12,1.5 L1.5,1.5 L1.5,12 L0,12 Z" />
          <rect x="3" y="3" width="1.5" height="1.5" />
          <path d="M5,5 L9,5 L9,6 L6,6 L6,9 L5,9 Z" opacity="0.6"/>
        </svg>
        {/* Top Right */}
        <svg className="absolute -top-1 -right-1 w-6 h-6 text-yellow-500 transform rotate-90" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0,0 L12,0 L12,1.5 L1.5,1.5 L1.5,12 L0,12 Z" />
          <rect x="3" y="3" width="1.5" height="1.5" />
          <path d="M5,5 L9,5 L9,6 L6,6 L6,9 L5,9 Z" opacity="0.6"/>
        </svg>
        {/* Bottom Left */}
        <svg className="absolute -bottom-1 -left-1 w-6 h-6 text-yellow-500 transform -rotate-90" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0,0 L12,0 L12,1.5 L1.5,1.5 L1.5,12 L0,12 Z" />
          <rect x="3" y="3" width="1.5" height="1.5" />
          <path d="M5,5 L9,5 L9,6 L6,6 L6,9 L5,9 Z" opacity="0.6"/>
        </svg>
        {/* Bottom Right */}
        <svg className="absolute -bottom-1 -right-1 w-6 h-6 text-yellow-500 transform rotate-180" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0,0 L12,0 L12,1.5 L1.5,1.5 L1.5,12 L0,12 Z" />
          <rect x="3" y="3" width="1.5" height="1.5" />
          <path d="M5,5 L9,5 L9,6 L6,6 L6,9 L5,9 Z" opacity="0.6"/>
        </svg>
      </motion.div>

      {/* Double Side-Glow lines representing sweeping lighting */}
      <div 
        className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-amber-400 to-transparent z-40 opacity-30" 
        style={{ animation: `pulse-glow ${config.animationSpeed / 2}s infinite` }}
      />
      <div 
        className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-amber-400 to-transparent z-40 opacity-30" 
        style={{ animation: `pulse-glow ${config.animationSpeed / 2}s infinite` }}
      />

      {/* CURTAIN RAISER TRIGGER: Invitation cover before card opens */}
      <AnimatePresence>
        {!isActive && (
          <motion.div
            className="absolute inset-0 z-50 overflow-hidden pointer-events-auto"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: [1, 1, 0],
              transition: { times: [0, 0.82, 1], duration: 1.3, ease: "easeInOut" } 
            }}
          >
            {/* Top Half Velvet/Gold luxury flap */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-1/2 origin-top"
              style={{
                backgroundColor: config.blackColor,
                backgroundImage: `radial-gradient(circle at 50% 100%, ${config.burgundyColor}cc 0%, ${config.blackColor} 100%)`,
                borderBottom: `1.5px solid ${config.goldColor}c0`
              }}
              initial={{ y: 0 }}
              exit={{ 
                y: "-100%",
                skewY: -1,
                opacity: 0,
                transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] }
              }}
            />

            {/* Bottom Half Velvet/Gold luxury flap */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1/2 origin-bottom"
              style={{
                backgroundColor: config.blackColor,
                backgroundImage: `radial-gradient(circle at 50% 0%, ${config.burgundyColor}cc 0%, ${config.blackColor} 100%)`,
                borderTop: `1.5px solid ${config.goldColor}c0`
              }}
              initial={{ y: 0 }}
              exit={{ 
                y: "100%",
                skewY: 1,
                opacity: 0,
                transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] }
              }}
            />

            {/* Content overlay that scales and fades out beautifully */}
            <motion.div
              className="absolute inset-0 z-10 flex flex-col justify-between p-8 text-center pointer-events-auto"
              initial={{ opacity: 1, scale: 1 }}
              exit={{ 
                opacity: 0,
                scale: 0.88,
                transition: { duration: 0.55, ease: "easeOut" }
              }}
            >
              {/* Top decorative Arabic design */}
              <div className="pt-8 opacity-75 flex flex-col items-center">
                <svg className="w-16 h-12 text-yellow-500/40" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M10,40 Q50,-10 90,40" />
                  <path d="M20,40 Q50,10 80,40" />
                  <circle cx="50" cy="20" r="3" fill="currentColor" />
                </svg>
                <p className="text-[9px] tracking-[0.3em] font-sans text-amber-400 mt-2">SPECIAL ISLAMIC LUXE GREETINGS</p>
              </div>

              {/* Middle: Golden Royal Wax Seal / Ornament Invitation Shield */}
              <div className="flex flex-col items-center justify-center py-6">
                <motion.button
                  onClick={onToggleActive}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="relative w-28 h-28 rounded-full flex items-center justify-center cursor-pointer border border-yellow-500/50 shadow-[0_10px_35px_rgba(212,175,55,0.25)] focus:outline-none"
                  style={{
                    background: `linear-gradient(135deg, ${config.goldColor}eb 0%, #AA7C11 100%)`
                  }}
                  title="Open Birthday Envelope"
                  type="button"
                  id="btn-wax-seal"
                >
                  {/* Embedded dynamic pulses representing heartbeat */}
                  <span className="absolute inset-[-6px] rounded-full border border-yellow-500/25 animate-ping" />
                  <span className="absolute inset-[-14px] rounded-full border border-yellow-400/10" />

                  <div className="flex flex-col items-center justify-center text-[#2A050A]">
                    <Sparkles size={28} className="animate-spin-slow mb-1 filter drop-shadow" />
                    <span className="font-serif font-black text-xs tracking-wider uppercase">Open</span>
                    <span className="font-sans font-medium text-[9px] tracking-widest uppercase">Card</span>
                  </div>
                </motion.button>
                
                <p className="text-amber-100/60 text-xs mt-6 max-w-xs font-serif italic text-balance">
                  "May Allah shower you with endless mercy and light."
                </p>
              </div>

              {/* Bottom Credit Ornament card cover detail */}
              <div className="pb-4 flex flex-col items-center">
                <div className="w-16 h-[1px] bg-yellow-500/30 mb-2" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.15em]">Presented with Love</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sparkle Icon during Active Cinematic Playback */}
      {isActive && (
        <div className="absolute top-7 left-7 z-40 flex items-center gap-1.5 bg-black/55 backdrop-blur-md px-2 py-1 rounded-full border border-amber-500/20 text-[9px] text-yellow-300 font-mono scale-90">
          <Sparkles size={10} className="animate-pulse" />
          <span>CINEMATIQUE PLAYING</span>
        </div>
      )}

      {/* Interactive Restart/Replay Button when Card is Active */}
      {isActive && (
        <button
          onClick={onToggleActive}
          className="absolute bottom-7 right-7 z-40 p-1.5 rounded-full bg-black/55 backdrop-blur-md border border-amber-500/20 text-yellow-300 hover:text-white hover:bg-black/80 transition-all cursor-pointer scale-90 flex items-center justify-center"
          title="Re-open envelope"
          type="button"
          id="btn-replay-card"
        >
          <RefreshCw size={11} />
        </button>
      )}
    </div>
  );
}
