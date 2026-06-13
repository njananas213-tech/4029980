import React, { useRef, ChangeEvent } from "react";
import { Sparkles, Type, Sliders, Music, HelpCircle, Palette, Share2, Clipboard, Check } from "lucide-react";
import { CardConfig } from "../types";
import ImageUploader from "./ImageUploader";

interface CardControlsProps {
  config: CardConfig;
  onChange: (newConfig: CardConfig | ((prev: CardConfig) => CardConfig)) => void;
  isActive: boolean;
  onActivate: () => void;
  volume: number;
  onVolumeChange: (val: number) => void;
}

export default function CardControls({
  config,
  onChange,
  isActive,
  onActivate,
  volume,
  onVolumeChange,
}: CardControlsProps) {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Preset Luxury Themes
  const THEME_PRESETS = [
    {
      name: "Royal Velvet",
      burgundy: "#500713",
      gold: "#D4AF37",
      black: "#0D0D0D",
      ivory: "#FAF9F6",
    },
    {
      name: "Sands of Barakah",
      burgundy: "#2E1B0E", // rich deep brown-burgundy
      gold: "#C5A059", // warm metallic sun
      black: "#110D0A",
      ivory: "#FBF8F3",
    },
    {
      name: "Imperial Emerald",
      burgundy: "#0B2B1B", // deep emerald green
      gold: "#E5C158",
      black: "#050B08",
      ivory: "#F4F7F5",
    },
    {
      name: "Nocturnal Onyx",
      burgundy: "#1C1C1E", // charcoal obsidian
      gold: "#DFC28D", // champagne gold
      black: "#080808",
      ivory: "#F1EFEB",
    }
  ];

  const handleApplyTheme = (preset: typeof THEME_PRESETS[0]) => {
    onChange((prev) => ({
      ...prev,
      burgundyColor: preset.burgundy,
      goldColor: preset.gold,
      blackColor: preset.black,
      ivoryColor: preset.ivory,
    }));
  };

  const handleTextChange = (field: "title" | "blessing" | "closing", val: string) => {
    onChange((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSliderChange = (field: keyof CardConfig, val: number) => {
    onChange((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  // Custom audio file importer
  const handleAudioUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      onChange((prev) => ({
        ...prev,
        musicType: "custom",
        customMusicUrl: objectUrl,
        customMusicName: file.name,
      }));
    }
  };

  // Base64 Sharing link generator
  const handleCopyLink = () => {
    try {
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

      let origin = window.location.origin;
      if (origin.includes("ais-dev-")) {
        origin = origin.replace("ais-dev-", "ais-pre-");
      }
      const shareUrl = `${origin}${window.location.pathname}?card=${serialized}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      });
    } catch (e) {
      console.error("Could not serialize sharing link: ", e);
    }
  };

  return (
    <div className="space-y-6" id="controls-panel">
      
      {/* SECTION 1: Portrait Photo Selection */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Sparkles className="text-yellow-400" size={18} />
          <h3 className="font-serif font-bold text-yellow-100 text-sm tracking-wide">
            1. PORTRAIT PHOTOGRAPHY
          </h3>
        </div>

        <ImageUploader
          currentUrl={config.personalPortraitUrl}
          portraitSrc={config.portraitSrc}
          onImageSelected={(url) => onChange((prev) => ({ ...prev, personalPortraitUrl: url }))}
          onSourceChanged={(src) => onChange((prev) => ({ ...prev, portraitSrc: src }))}
        />
      </div>

      {/* SECTION 2: Text Customization */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Type className="text-yellow-400" size={18} />
          <h3 className="font-serif font-bold text-yellow-100 text-sm tracking-wide">
            2. CARD GREETINGS TEXT
          </h3>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-sans">
              Header Title
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => handleTextChange("title", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-yellow-100 focus:outline-none focus:border-amber-500/50 transition-colors"
              placeholder="e.g. Happy Birthday"
              id="input-card-title"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-sans">
              May Allah Blessing & Prayer
            </label>
            <textarea
              rows={3}
              value={config.blessing}
              onChange={(e) => handleTextChange("blessing", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-colors resize-none leading-relaxed"
              placeholder="May Allah bless you..."
              id="input-card-blessing"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-sans">
              Cursive Closing Signature
            </label>
            <input
              type="text"
              value={config.closing}
              onChange={(e) => handleTextChange("closing", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-amber-300 italic focus:outline-none focus:border-amber-500/50 transition-colors"
              placeholder="e.g., Wishing you a beautiful year ahead."
              id="input-card-closing"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Royal Color Themes */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Palette className="text-yellow-400" size={18} />
          <h3 className="font-serif font-bold text-yellow-100 text-sm tracking-wide">
            3. LUXURY COLOR PALETTES
          </h3>
        </div>

        {/* Selected Presets buttons */}
        <div className="grid grid-cols-2 gap-2" id="theme-presets-grid">
          {THEME_PRESETS.map((preset) => {
            const isCurrentlySelected =
              config.burgundyColor === preset.burgundy && config.goldColor === preset.gold;
            return (
              <button
                key={preset.name}
                onClick={() => handleApplyTheme(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between font-sans cursor-pointer ${
                  isCurrentlySelected
                    ? "bg-amber-500/10 border-amber-500/50 text-white"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
                type="button"
                id={`btn-preset-theme-${preset.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="text-xs font-medium mb-1.5">{preset.name}</div>
                <div className="flex gap-1">
                  <span
                    className="w-4 h-4 rounded-full border border-black"
                    style={{ backgroundColor: preset.burgundy }}
                    title="Primary"
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black"
                    style={{ backgroundColor: preset.gold }}
                    title="Imperial Accent"
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black"
                    style={{ backgroundColor: preset.black }}
                    title="Background"
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black"
                    style={{ backgroundColor: preset.ivory }}
                    title="Text Ivory"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed manual color pickers */}
        <div className="pt-2 grid grid-cols-2 gap-4 border-t border-zinc-800/60">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase font-bold tracking-wide mb-1">
              Primary Velvet
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.burgundyColor}
                onChange={(e) => onChange((prev) => ({ ...prev, burgundyColor: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                id="color-burgundy"
              />
              <span className="text-xs font-mono text-zinc-300">{config.burgundyColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase font-bold tracking-wide mb-1">
              Imperial Gold
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.goldColor}
                onChange={(e) => onChange((prev) => ({ ...prev, goldColor: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                id="color-gold"
              />
              <span className="text-xs font-mono text-zinc-300">{config.goldColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Soundtrack & Instrumental Nasheed */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Music className="text-yellow-400" size={18} />
          <h3 className="font-serif font-bold text-yellow-100 text-sm tracking-wide">
            4. BACKGROUND MUSIC
          </h3>
        </div>

        <div className="space-y-3">
          {/* Sound Source Selectors */}
          <div className="flex rounded-lg bg-black/40 p-1 border border-zinc-800" id="soundtrack-type-tabs">
            <button
              onClick={() => onChange((prev) => ({ ...prev, musicType: "synthesized" }))}
              className={`flex-1 py-1.5 px-2 text-xs rounded transition-all font-sans cursor-pointer ${
                config.musicType === "synthesized"
                  ? "bg-amber-500/20 text-yellow-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              type="button"
              id="sound-type-synth"
            >
              Nasheed Synth
            </button>
            <button
              onClick={() => onChange((prev) => ({ ...prev, musicType: "custom" }))}
              className={`flex-1 py-1.5 px-2 text-xs rounded transition-all font-sans cursor-pointer ${
                config.musicType === "custom"
                  ? "bg-amber-500/20 text-yellow-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              type="button"
              id="sound-type-upload"
            >
              Custom Audio
            </button>
          </div>

          {config.musicType === "synthesized" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-sans">
                  Select Islamic Song / Nasheed
                </label>
                <div className="grid grid-cols-2 gap-2" id="nasheed-presets-grid">
                  {[
                    { id: "hasbi", name: "Hasbi Rabbi", desc: "Traditional Recital" },
                    { id: "mawlay", name: "Mawlay Salli", desc: "Emotional Devotional" },
                    { id: "tala_al", name: "Tala'al Badru", desc: "Classic Welcoming" },
                    { id: "serenity", name: "Divine Serenity", desc: "Cinematic Ambient" },
                  ].map((preset) => {
                    const isSelected = (config.musicPreset || "hasbi") === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => onChange((prev) => ({ ...prev, musicPreset: preset.id as any }))}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col font-sans cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-500/60 text-yellow-101"
                            : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                        type="button"
                        id={`btn-preset-nasheed-${preset.id}`}
                      >
                        <span className="text-xs font-bold text-yellow-100">{preset.name}</span>
                        <span className="text-[10px] opacity-75 mt-0.5 text-zinc-400">{preset.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-[11px] text-zinc-400 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800 leading-relaxed font-sans">
                <span className="text-yellow-300 font-semibold uppercase block text-[10px] tracking-wider mb-0.5">
                  ✦ Real-time Synthetic Nasheed Generator
                </span>
                Synthesizes elegant traditional Islamic melodies on top of rich ambient pad drones in G Minor. Resilient, 0-byte offline Web Audio engine.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="file"
                ref={audioInputRef}
                onChange={handleAudioUpload}
                accept="audio/*"
                className="hidden"
                id="audio-uploader-input"
              />
              <button
                onClick={() => audioInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-amber-500/40 text-xs rounded-xl font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
                type="button"
                id="btn-trigger-custom-audio"
              >
                <Music size={14} />
                <span>{config.customMusicName ? "Replace Audio" : "Import Custom Greeting Sound/Nasheed"}</span>
              </button>

              {config.customMusicName && (
                <div className="text-[10px] text-teal-400 italic bg-teal-950/20 px-2 py-1.5 rounded border border-teal-800/10 max-w-full truncate">
                  Loaded: {config.customMusicName}
                </div>
              )}
            </div>
          )}

          {/* Master Volume Sliders */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-xs text-zinc-400 font-medium mb-1 font-sans">
              <span>Greetings Soundtrack Volume</span>
              <span className="text-yellow-400">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              id="sound-volume-slider"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: Cinematic Animations Tweaks */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Sliders className="text-yellow-400" size={18} />
          <h3 className="font-serif font-bold text-yellow-100 text-sm tracking-wide">
            5. CINEMATIC INTENSITY
          </h3>
        </div>

        <div className="space-y-4 font-sans">
          {/* Particles density */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Golden Star-Dust Particles</span>
              <span className="font-mono text-yellow-400/80">{config.particleCount} sparkles</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              value={config.particleCount}
              onChange={(e) => handleSliderChange("particleCount", parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              id="slider-particles-count"
            />
          </div>

          {/* Camera Zoom Strength */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Portrait Cinematic Camera Zoom</span>
              <span className="font-mono text-yellow-400/80">x{config.zoomScale.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="1.05"
              max="1.35"
              step="0.01"
              value={config.zoomScale}
              onChange={(e) => handleSliderChange("zoomScale", parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              id="slider-zoom-scale"
            />
          </div>

          {/* Animation Duration / Speed */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Dramatic Entrance Speed</span>
              <span className="font-mono text-yellow-400/80">{config.animationSpeed}s sweep</span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="1"
              value={config.animationSpeed}
              onChange={(e) => handleSliderChange("animationSpeed", parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              id="slider-animation-speed"
            />
          </div>
        </div>
      </div>

      {/* SECTION 6: Generate & Share Link */}
      <div className="p-5 rounded-2xl border border-zinc-500/20 bg-gradient-to-br from-amber-500/10 directly to-zinc-950/60 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Share2 className="text-yellow-400" size={18} />
          <h3 className="font-serif font-bold text-yellow-100 text-sm tracking-wide">
            6. EXPORT & SEND GREETINGS
          </h3>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          Easily send this exact digital greeting card! Generates a customized URL that stores your custom blessing messages, layout colors, and designer/custom formats securely, so when your recipient opens the link, they experience the card play instantly!
        </p>

        <button
          onClick={handleCopyLink}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            copiedLink
              ? "bg-emerald-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
              : "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
          }`}
          type="button"
          id="btn-generate-share-link"
        >
          {copiedLink ? (
            <>
              <Check size={14} />
              <span>Copied Customized Link!</span>
            </>
          ) : (
            <>
              <Clipboard size={14} />
              <span>Copy Greeting Card Share Link</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
