import { NextResponse } from "next/server"
import {
  getKieCallbackUrl,
  getKieConfig,
  isKieAudioModel,
  normalizeAudioRequest,
  type KieAudioRequest,
} from "@/lib/kie-audio"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX_TASKS = 6

type RateLimitStore = Map<string, number[]>

const globalForRateLimit = globalThis as typeof globalThis & {
  __seedAudioKieRateLimit?: RateLimitStore
}

function getRateLimitStore() {
  if (!globalForRateLimit.__seedAudioKieRateLimit) {
    globalForRateLimit.__seedAudioKieRateLimit = new Map()
  }
  return globalForRateLimit.__seedAudioKieRateLimit
}

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown"
  return request.headers.get("x-real-ip") || "unknown"
}

function assertWithinRateLimit(request: Request) {
  const clientKey = getClientKey(request)
  const now = Date.now()
  const store = getRateLimitStore()
  const recent = (store.get(clientKey) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX_TASKS) {
    return false
  }

  recent.push(now)
  store.set(clientKey, recent)
  return true
}

export async function POST(request: Request) {
  if (!assertWithinRateLimit(request)) {
    return NextResponse.json(
      {
        error: "Rate limit reached. Please wait before starting another production audio task.",
      },
      { status: 429 },
    )
  }

  const payload = (await request.json().catch(() => null)) as Partial<KieAudioRequest> | null
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
  }

  const input = normalizeAudioRequest(payload)
  if (!isKieAudioModel(input.model)) {
    return NextResponse.json({ error: "Unsupported KIE audio model." }, { status: 400 })
  }

  if (input.text.length < 4 || input.text.length > 500) {
    return NextResponse.json({ error: "Text must be between 4 and 500 characters." }, { status: 400 })
  }

  const { apiKey, baseUrl } = getKieConfig()
  if (!apiKey) {
    return NextResponse.json({ error: "KIE API key is not configured on the server." }, { status: 500 })
  }

  const kiePayload = {
    model: input.model,
    callBackUrl: getKieCallbackUrl(),
    input: {
      text: input.text,
      voice: input.voice,
      stability: input.stability,
      similarity_boost: input.similarityBoost,
      style: input.style,
      speed: input.speed,
      timestamps: false,
      previous_text: "",
      next_text: "",
      language_code: input.languageCode,
    },
  }

  const response = await fetch(`${baseUrl}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(kiePayload),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || data?.code !== 200) {
    return NextResponse.json(
      {
        error: data?.msg || "KIE audio task creation failed.",
        code: data?.code || response.status,
      },
      { status: response.ok ? 502 : response.status },
    )
  }

  return NextResponse.json({
    taskId: data.data?.taskId,
    recordId: data.data?.recordId,
    model: input.model,
  })
}
