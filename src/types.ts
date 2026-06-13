export interface CardConfig {
  title: string;
  blessing: string;
  closing: string;
  burgundyColor: string;
  goldColor: string;
  blackColor: string;
  ivoryColor: string;
  particleCount: number;
  particleSpeed: number;
  animationSpeed: number;
  zoomScale: number;
  glowIntensity: number;
  lightRayIntensity: number;
  musicType: 'synthesized' | 'custom' | 'none';
  musicPreset?: 'serenity' | 'hasbi' | 'mawlay' | 'tala_al';
  customMusicUrl?: string;
  customMusicName?: string;
  portraitSrc: 'designer' | 'personal';
  personalPortraitUrl?: string; // base64 or object URL
}

export const DEFAULT_CONFIG: CardConfig = {
  title: "Happy Birthday Immu",
  blessing: "May Allah bless you with happiness, good health, peace, and endless barakah.",
  closing: "Wishing you a beautiful year ahead.",
  burgundyColor: "#500713", // Deep rich burgundy
  goldColor: "#D4AF37", // Elegant gold
  blackColor: "#0D0D0D", // Obsidian black
  ivoryColor: "#FAF9F6", // Soft ivory
  particleCount: 45,
  particleSpeed: 0.8,
  animationSpeed: 10, // speed multiplier
  zoomScale: 1.15, // zoom transition maximum
  glowIntensity: 1.2,
  lightRayIntensity: 1.0,
  musicType: "synthesized",
  musicPreset: "hasbi",
  portraitSrc: "designer",
};
