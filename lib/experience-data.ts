// Seed Audio AI — model and use-case data
// This file replaces the former Terra conservation data entirely.

export interface SeedModel {
  id: string
  name: string
  shortName: string
  category: "tts" | "asr" | "music" | "live"
  tagline: string
  description: string
  capabilities: string[]
  color: "cyan" | "violet" | "amber" | "emerald"
}

export interface UseCase {
  id: string
  title: string
  audience: string
  description: string
  tags: string[]
  color: "cyan" | "violet" | "amber" | "emerald"
}

export const seedModels: SeedModel[] = [
  {
    id: "seedtts",
    name: "SeedTTS",
    shortName: "TTS",
    category: "tts",
    tagline: "Text-to-speech & voice replication",
    description:
      "SeedTTS is a large-scale text-to-speech model from ByteDance Seed research. It produces highly natural, expressive speech from text, and supports voice replication from short reference audio samples.",
    capabilities: [
      "Natural voice synthesis",
      "Voice replication from reference audio",
      "Emotional expressiveness control",
      "Long-form narration",
      "Multiple speaker styles",
    ],
    color: "cyan",
  },
  {
    id: "seedasr",
    name: "SeedASR",
    shortName: "ASR",
    category: "asr",
    tagline: "High-accuracy speech recognition",
    description:
      "SeedASR is ByteDance Seed's automatic speech recognition system, designed for robust transcription across diverse languages, accents, acoustic environments, and domain-specific vocabularies.",
    capabilities: [
      "Multilingual transcription",
      "Accent and dialect robustness",
      "Noisy environment handling",
      "Domain-specific vocabulary adaptation",
      "Context-aware speech recognition",
    ],
    color: "violet",
  },
  {
    id: "seed-music",
    name: "Seed-Music",
    shortName: "Music",
    category: "music",
    tagline: "Controlled music generation & editing",
    description:
      "Seed-Music is listed by ByteDance Seed as a suite of music generation systems capable of producing high-quality music with fine-grained style control.",
    capabilities: [
      "Controllable music generation",
      "Style and genre conditioning",
      "Fine-grained style control",
      "Creative music workflows",
      "Background score generation",
    ],
    color: "amber",
  },
  {
    id: "live-speech",
    name: "Live Interpretation",
    shortName: "Live",
    category: "live",
    tagline: "Real-time speech understanding",
    description:
      "ByteDance Seed research includes live speech interpretation capabilities that enable low-latency spoken language understanding for interactive voice applications and real-time translation workflows.",
    capabilities: [
      "Low-latency transcription",
      "Real-time translation",
      "Intent and context modeling",
      "Interactive voice interfaces",
      "Streaming audio pipelines",
    ],
    color: "emerald",
  },
]

export const useCases: UseCase[] = [
  {
    id: "creators",
    title: "Content Creators",
    audience: "Podcasters, YouTubers, Narrators",
    description:
      "Generate studio-quality voiceovers and narrations at scale. Replicate your own voice for consistent branding, or choose from natural-sounding styles for any content format.",
    tags: ["Voiceover", "Narration", "Voice Replication"],
    color: "cyan",
  },
  {
    id: "developers",
    title: "Developers & Product Teams",
    audience: "Engineers, API integrators",
    description:
      "Integrate SeedTTS and SeedASR into your product via enterprise API. Enable voice interfaces, transcription pipelines, and audio-first user experiences without managing ML infrastructure.",
    tags: ["API Integration", "SeedTTS", "SeedASR"],
    color: "violet",
  },
  {
    id: "localization",
    title: "Localization Teams",
    audience: "Global enterprises, translation agencies",
    description:
      "Produce multilingual voice output at scale with regional accent support. Localize apps, e-learning, and media content into dozens of languages while maintaining natural intonation.",
    tags: ["Multilingual", "Dubbing", "Localization"],
    color: "amber",
  },
  {
    id: "educators",
    title: "Educators & E-learning",
    audience: "Course creators, EdTech platforms",
    description:
      "Create engaging audio lessons, accessibility-friendly course content, and spoken feedback without recording studios. Generate consistent instructor voices across large course libraries.",
    tags: ["E-learning", "Accessibility", "Audio Lessons"],
    color: "emerald",
  },
]

// Legacy export kept for WorldMap component compatibility — now empty
export interface Experience {
  id: string
  title: string
  company: string
  location: { city: string; country: string; lat: number; lng: number; isRemote: boolean }
  startDate: string
  endDate: string
  color: "pink" | "yellow" | "green" | "blue"
}

export const experiences: Experience[] = []
