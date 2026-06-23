export const KIE_AUDIO_MODELS = [
  "elevenlabs/text-to-speech-turbo-2-5",
  "elevenlabs/text-to-speech-multilingual-v2",
] as const

export type KieAudioModel = (typeof KIE_AUDIO_MODELS)[number]

export type KieAudioRequest = {
  model: KieAudioModel
  text: string
  voice: string
  languageCode?: string
  speed?: number
  stability?: number
  similarityBoost?: number
  style?: number
}

export function isKieAudioModel(model: string): model is KieAudioModel {
  return KIE_AUDIO_MODELS.includes(model as KieAudioModel)
}

export function getKieConfig() {
  const apiKey = process.env.KIE_API_KEY || process.env.KIE_AI_API_KEY || process.env.KIEAI_API_KEY
  const baseUrl = (process.env.KIE_API_BASE_URL || process.env.KIE_AI_BASE_URL || "https://api.kie.ai").replace(
    /\/$/,
    "",
  )

  return {
    apiKey,
    baseUrl,
  }
}

export function getKieCallbackUrl() {
  if (process.env.KIE_CALLBACK_URL) return process.env.KIE_CALLBACK_URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seedaudioai.ai"
  return `${siteUrl.replace(/\/$/, "")}/api/kie/audio/callback`
}

export function normalizeAudioRequest(input: Partial<KieAudioRequest>) {
  const model = input.model || "elevenlabs/text-to-speech-turbo-2-5"
  const text = typeof input.text === "string" ? input.text.trim() : ""
  const voice = typeof input.voice === "string" && input.voice.trim() ? input.voice.trim() : "Rachel"

  return {
    model,
    text,
    voice,
    languageCode: typeof input.languageCode === "string" ? input.languageCode.trim() : "",
    speed: clampNumber(input.speed, 0.7, 1.2, 1),
    stability: clampNumber(input.stability, 0, 1, 0.5),
    similarityBoost: clampNumber(input.similarityBoost, 0, 1, 0.75),
    style: clampNumber(input.style, 0, 1, 0),
  }
}

export function parseKieResultJson(resultJson: unknown) {
  if (!resultJson) return null
  if (typeof resultJson === "object") return resultJson
  if (typeof resultJson !== "string") return null

  try {
    return JSON.parse(resultJson)
  } catch {
    return resultJson
  }
}

export function collectAudioUrls(value: unknown): string[] {
  const urls = new Set<string>()
  const visit = (item: unknown) => {
    if (!item) return
    if (typeof item === "string") {
      if (/^https?:\/\//i.test(item) && /\.(mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/i.test(item)) {
        urls.add(item)
      }
      return
    }
    if (Array.isArray(item)) {
      item.forEach(visit)
      return
    }
    if (typeof item === "object") {
      Object.values(item).forEach(visit)
    }
  }

  visit(value)
  return Array.from(urls)
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numberValue)) return fallback
  return Math.min(max, Math.max(min, numberValue))
}
