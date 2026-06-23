"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Mic,
  Music,
  Shield,
  ChevronDown,
  Menu,
  X,
  Play,
  Wand2,
  FileText,
  Radio,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react"
import { AnimatedText } from "@/components/animated-text"
import { seedModels, useCases } from "@/lib/experience-data"

const dynamicWords = ["voices", "speech", "narrations", "dubbing", "transcripts", "music", "localization"]

const sourceLinks = [
  {
    label: "ByteDance Seed Speech",
    href: "https://seed.bytedance.com/en/direction/speech",
  },
  {
    label: "Seed Models",
    href: "https://seed.bytedance.com/en/models",
  },
  {
    label: "BytePlus Seed Speech",
    href: "https://www.byteplus.com/en/product/seedspeech",
  },
  {
    label: "Seed-TTS paper",
    href: "https://arxiv.org/html/2406.02430v1",
  },
  {
    label: "Seed-ASR technical report",
    href: "https://bytedancespeech.github.io/seedasr_tech_report/",
  },
]

// ─── Waveform bars visual component ──────────────────────────────────────────
function WaveformBars({
  count = 32,
  active = false,
  color = "cyan",
}: {
  count?: number
  active?: boolean
  color?: "cyan" | "violet" | "amber" | "emerald"
}) {
  const colorMap = {
    cyan: "bg-cyan-400",
    violet: "bg-violet-400",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
  }
  const heights = Array.from({ length: count }, (_, i) => {
    const base = Math.sin(i * 0.6) * 0.4 + 0.5
    return Math.max(0.08, base)
  })
  return (
    <div className="flex items-center gap-[2px] h-10">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all duration-300 ${colorMap[color]} ${
            active ? "opacity-90" : "opacity-30"
          }`}
          style={{
            height: `${(h * 100).toFixed(4)}%`,
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Spectrogram accent bars ──────────────────────────────────────────────────
function SpectrogramAccent() {
  return (
    <div className="flex items-end gap-[2px] h-6 opacity-20">
      {Array.from({ length: 48 }).map((_, i) => {
        const h = Math.abs(Math.sin(i * 0.45 + 1.2) * 70 + Math.cos(i * 0.9) * 20) + 10
        return (
          <div
            key={i}
            className="w-[2px] rounded-full bg-gradient-to-t from-cyan-500 to-violet-500"
            style={{ height: `${Math.min(h, 100).toFixed(4)}%` }}
          />
        )
      })}
    </div>
  )
}

// ─── Production KIE audio console ─────────────────────────────────────────────
function AudioConsolePreview({ instanceId = "primary" }: { instanceId?: string }) {
  const audioModels = [
    {
      id: "elevenlabs/text-to-speech-turbo-2-5",
      label: "Turbo TTS",
      description: "Fast production voice generation",
    },
    {
      id: "elevenlabs/text-to-speech-multilingual-v2",
      label: "Multilingual TTS",
      description: "Natural speech for global content",
    },
  ] as const
  const voices = ["Rachel", "Adam", "Bella", "Antoni", "Elli"]
  const languages = [
    { label: "Auto", value: "" },
    { label: "English", value: "en" },
    { label: "Mandarin", value: "zh" },
    { label: "Japanese", value: "ja" },
    { label: "Spanish", value: "es" },
    { label: "French", value: "fr" },
    { label: "Korean", value: "ko" },
  ]
  const availableApis = ["TTS Turbo 2.5", "Multilingual v2", "Dialogue v3", "Audio Isolation"]

  const [selectedModel, setSelectedModel] = useState<(typeof audioModels)[number]["id"]>(audioModels[0].id)
  const [selectedVoice, setSelectedVoice] = useState("Rachel")
  const [selectedLang, setSelectedLang] = useState("")
  const [text, setText] = useState(
    "Seed Audio AI turns launch copy, product scripts, and learning content into production voice output.",
  )
  const [status, setStatus] = useState<"idle" | "submitting" | "polling" | "success" | "error">("idle")
  const [taskId, setTaskId] = useState("")
  const [progress, setProgress] = useState(0)
  const [audioUrl, setAudioUrl] = useState("")
  const [error, setError] = useState("")
  const requestIdRef = useRef(0)
  const voiceId = `voice-${instanceId}`
  const languageId = `language-${instanceId}`
  const audioTextId = `audioText-${instanceId}`

  const isBusy = status === "submitting" || status === "polling"
  const selectedModelInfo = audioModels.find((model) => model.id === selectedModel) ?? audioModels[0]

  async function pollTask(id: string, requestId: number) {
    setStatus("polling")
    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (requestId !== requestIdRef.current) return
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 1200 : Math.min(3200 + attempt * 200, 8000)))

      const response = await fetch(`/api/kie/audio/${encodeURIComponent(id)}`, { cache: "no-store" })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setStatus("error")
        setError(data?.error || "Unable to read KIE task status.")
        return
      }

      setProgress(typeof data.progress === "number" ? data.progress : Math.min(95, 15 + attempt * 4))

      if (data.state === "success") {
        const firstUrl = Array.isArray(data.audioUrls) ? data.audioUrls[0] : ""
        setAudioUrl(firstUrl || "")
        setProgress(100)
        setStatus("success")
        setError(firstUrl ? "" : "Task completed, but no audio URL was returned.")
        return
      }

      if (data.state === "fail") {
        setStatus("error")
        setError(data.failMsg || "KIE audio generation failed.")
        return
      }
    }

    setStatus("error")
    setError("KIE task timed out before returning a final audio result.")
  }

  async function createAudioTask() {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setStatus("submitting")
    setError("")
    setTaskId("")
    setAudioUrl("")
    setProgress(6)

    const response = await fetch("/api/kie/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        text,
        voice: selectedVoice,
        languageCode: selectedLang,
        speed: 1,
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
      }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      setStatus("error")
      setError(data?.error || "KIE audio task could not be created.")
      return
    }

    setTaskId(data.taskId)
    setProgress(12)
    void pollTask(data.taskId, requestId)
  }

  function cancelPolling() {
    requestIdRef.current += 1
    setStatus("idle")
    setProgress(0)
  }

  return (
    <div className="w-full rounded-[20px] border border-white/10 bg-[#0D1117] overflow-hidden shadow-2xl">
      {/* Console header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0A0D12]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[11px] text-[#A7ABB3] font-mono">seed-audio — production kie api</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 text-cyan-400 font-mono">
            LIVE API
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/8">
        {/* Left: Input panel */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-[#A7ABB3] mb-2">KIE audio model</div>
            <div className="grid grid-cols-1 gap-2">
              {audioModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`px-3 py-2 rounded-lg text-left text-xs font-mono border transition-all duration-200 ${
                    selectedModel === model.id
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                      : "bg-white/4 border-white/10 text-[#A7ABB3] hover:border-white/20"
                  }`}
                >
                  <span className="block text-[#F2F3F5]">{model.label}</span>
                  <span className="block mt-1 text-[10px] text-[#A7ABB3]">{model.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#A7ABB3] mb-2" htmlFor={voiceId}>
                Voice
              </label>
              <select
                id={voiceId}
                value={selectedVoice}
                onChange={(event) => setSelectedVoice(event.target.value)}
                className="w-full rounded-lg bg-white/4 border border-white/10 px-3 py-2 text-xs text-[#F2F3F5] font-mono focus:outline-none focus:border-cyan-400/50"
              >
                {voices.map((voice) => (
                  <option key={voice} value={voice} className="bg-[#0D1117]">
                    {voice}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#A7ABB3] mb-2" htmlFor={languageId}>
                Language
              </label>
              <select
                id={languageId}
                value={selectedLang}
                onChange={(event) => setSelectedLang(event.target.value)}
                className="w-full rounded-lg bg-white/4 border border-white/10 px-3 py-2 text-xs text-[#F2F3F5] font-mono focus:outline-none focus:border-violet-400/50"
              >
                {languages.map((language) => (
                  <option key={language.label} value={language.value} className="bg-[#0D1117]">
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-[#A7ABB3] mb-2" htmlFor={audioTextId}>
              Input text
            </label>
            <textarea
              id={audioTextId}
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, 500))}
              className="w-full rounded-lg bg-white/4 border border-white/10 p-3 text-xs text-[#F2F3F5]/80 font-mono leading-relaxed min-h-[96px] resize-none focus:outline-none focus:border-cyan-400/50"
            />
            <div className="mt-2 text-[10px] text-[#A7ABB3]/70 font-mono">{text.length}/500 chars</div>
          </div>

          <button
            onClick={createAudioTask}
            disabled={isBusy || text.trim().length < 4}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {status === "submitting" ? "Creating KIE task..." : status === "polling" ? "Generating audio..." : "Generate production audio"}
          </button>
        </div>

        {/* Right: Output / waveform panel */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-[#A7ABB3] mb-2">Production status</div>
            <div className="rounded-lg bg-white/4 border border-white/8 p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-mono text-[#F2F3F5]">
                    {status === "success"
                      ? "Audio ready"
                      : status === "error"
                        ? "Task needs attention"
                        : isBusy
                          ? "KIE task running"
                          : "Ready"}
                  </div>
                  <div className="text-[10px] text-[#A7ABB3] font-mono mt-1">{selectedModelInfo.id}</div>
                </div>
                {status === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                ) : status === "error" ? (
                  <AlertTriangle className="w-5 h-5 text-amber-300" />
                ) : isBusy ? (
                  <Loader2 className="w-5 h-5 text-cyan-300 animate-spin" />
                ) : (
                  <Radio className="w-5 h-5 text-cyan-300" />
                )}
              </div>
              <WaveformBars count={40} active={isBusy || status === "success"} color="cyan" />
              <div className="relative h-1 rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-cyan-400 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#A7ABB3]">{taskId || "No task yet"}</span>
                {isBusy ? (
                  <button
                    onClick={cancelPolling}
                    className="text-[10px] font-mono text-[#A7ABB3] hover:text-amber-300 transition-colors"
                  >
                    Stop polling
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-[#A7ABB3] mb-2">
              Audio result
            </div>
            <div className="rounded-lg bg-white/4 border border-white/8 p-3 min-h-[124px] flex flex-col justify-center">
              {audioUrl ? (
                <div className="space-y-3">
                  <audio controls src={audioUrl} className="w-full" />
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={audioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-mono text-cyan-300 hover:bg-cyan-500/20"
                    >
                      <Play className="h-3 w-3" />
                      Open audio
                    </a>
                    <a
                      href={audioUrl}
                      download
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-mono text-[#A7ABB3] hover:text-[#F2F3F5]"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  </div>
                </div>
              ) : error ? (
                <p className="text-xs text-amber-200 font-mono leading-relaxed">{error}</p>
              ) : (
                <p className="text-xs text-[#A7ABB3] font-mono leading-relaxed">
                  Submit text to create a KIE production audio task. Results appear here when the task completes.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-[#A7ABB3] mb-2">Available KIE audio APIs</div>
            <div className="rounded-lg bg-white/4 border border-white/8 p-3 flex flex-wrap gap-1.5">
              {availableApis.map((api) => (
                <span
                  key={api}
                  className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-white/5 text-[#A7ABB3]"
                >
                  {api}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {["KIE API", "Production task", "Server-side key", "Consent required"].map((badge) => (
              <span
                key={badge}
                className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-[#A7ABB3]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Model color helpers ──────────────────────────────────────────────────────
const modelColorMap = {
  cyan: {
    dot: "bg-cyan-400",
    border: "border-cyan-500/30",
    activeBorder: "border-cyan-400/60",
    text: "text-cyan-300",
    badge: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    bar: "bg-cyan-400",
    progress: "h-full bg-cyan-400",
  },
  violet: {
    dot: "bg-violet-400",
    border: "border-violet-500/30",
    activeBorder: "border-violet-400/60",
    text: "text-violet-300",
    badge: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    bar: "bg-violet-400",
    progress: "h-full bg-violet-400",
  },
  amber: {
    dot: "bg-amber-400",
    border: "border-amber-500/30",
    activeBorder: "border-amber-400/60",
    text: "text-amber-300",
    badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    bar: "bg-amber-400",
    progress: "h-full bg-amber-400",
  },
  emerald: {
    dot: "bg-emerald-400",
    border: "border-emerald-500/30",
    activeBorder: "border-emerald-400/60",
    text: "text-emerald-300",
    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    bar: "bg-emerald-400",
    progress: "h-full bg-emerald-400",
  },
}

const modelIconMap = {
  tts: Mic,
  asr: FileText,
  music: Music,
  live: Radio,
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SeedAudioPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [selectedModel, setSelectedModel] = useState(0)
  const [modelFade, setModelFade] = useState(true)
  const [autoRotationKey, setAutoRotationKey] = useState(0)
  const [dynamicWordIndex, setDynamicWordIndex] = useState(0)
  const [wordFade, setWordFade] = useState(true)
  const [dashboardScrollOffset, setDashboardScrollOffset] = useState(0)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setWordFade(false)
      setTimeout(() => {
        setDynamicWordIndex((prev) => (prev + 1) % dynamicWords.length)
        setWordFade(true)
      }, 300)
    }, 3000)
    return () => clearInterval(wordInterval)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      if (dashboardRef.current) {
        const rect = dashboardRef.current.getBoundingClientRect()
        const vh = window.innerHeight
        const start = vh * 0.8
        const end = vh * 0.2
        if (rect.top >= start) {
          setDashboardScrollOffset(0)
        } else if (rect.top <= end) {
          setDashboardScrollOffset(15)
        } else {
          const range = start - end
          const progress = (start - rect.top) / range
          setDashboardScrollOffset(progress * 15)
        }
      }
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsLoaded(true)
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("animate-in")
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    )
    document.querySelectorAll(".animate-on-scroll").forEach((el) => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setModelFade(false)
      setTimeout(() => {
        setSelectedModel((prev) => (prev + 1) % seedModels.length)
        setModelFade(true)
      }, 300)
    }, 6000)
    return () => clearInterval(interval)
  }, [autoRotationKey])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setIsMenuOpen(false)
  }

  const navLinks = [
    { label: "API", id: "demo" },
    { label: "Capabilities", id: "capabilities" },
    { label: "Models", id: "models" },
    { label: "Use Cases", id: "use-cases" },
    { label: "FAQ", id: "faq" },
  ]

  const activeModel = seedModels[selectedModel]
  const activeColors = modelColorMap[activeModel.color]

  return (
    <div className="relative min-h-screen bg-[#080C14] text-[#F2F3F5] overflow-x-hidden">
      {/* ── Navigation ── */}
      <header className="fixed top-6 left-6 md:w-auto md:right-auto right-6 z-40 border border-white/10 backdrop-blur-md bg-[#080C14]/80 rounded-[16px]">
        <div className="w-full mx-auto px-6">
          <div className="flex items-center gap-6 h-14">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-base md:text-lg font-semibold font-mono hover:text-cyan-400 transition-colors duration-300 whitespace-nowrap"
            >
              Seed Audio AI
            </button>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors duration-300"
                >
                  {link.label}
                </button>
              ))}
            </nav>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden ml-auto p-2 hover:bg-white/5 rounded-lg transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-[#080C14]/97 backdrop-blur-md z-50 flex flex-col px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="font-mono text-sm font-semibold text-cyan-300"
            >
              Seed Audio AI
            </button>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-[#F2F3F5] transition-colors hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-20 flex flex-col gap-7 items-start text-left w-full">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="font-serif text-4xl font-light text-[#F2F3F5] transition-colors duration-300 hover:text-cyan-400"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* ── Hero ── */}
      <section
        className={`relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 md:pt-32 md:pb-24 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isLoaded ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"
        }`}
      >
        {/* Background gradient mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04]"
            style={{
              background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)",
              transform: `translateY(${scrollY * 0.15}px)`,
            }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04]"
            style={{
              background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          />
          {/* Spectrogram strip */}
          <div className="absolute bottom-24 left-0 right-0 flex justify-center">
            <SpectrogramAccent />
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-[#080C14]/40 to-transparent pointer-events-none" />

        <div
          className="max-w-[1120px] w-full mx-auto relative z-10"
          style={{ transform: `translateY(${scrollY * 0.12}px)` }}
        >
          <div className="text-center mb-8 md:mb-12">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 glass-pill px-4 py-2 rounded-full mb-8 text-xs md:text-sm text-[#A7ABB3] stagger-reveal">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Seed Audio AI — AI Voice & Speech Generation Guide
            </div>

            <h1 className="font-serif text-[44px] leading-[1.1] md:text-[72px] md:leading-[1.05] font-medium mb-6 text-balance">
              <span
                className={`block stagger-reveal text-6xl font-light transition-all duration-500 md:text-8xl ${
                  wordFade ? "opacity-100 blur-0" : "opacity-0 blur-lg"
                }`}
              >
                Generate{" "}
                <AnimatedText key={dynamicWordIndex} text={dynamicWords[dynamicWordIndex]} delay={0} />
              </span>
              <span
                className="block stagger-reveal text-6xl font-light md:text-8xl"
                style={{ animationDelay: "90ms" }}
              >
                with{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Seed Audio
                </span>
              </span>
            </h1>

            <p
              className="text-[#A7ABB3] text-base md:text-lg max-w-[560px] mx-auto mb-8 leading-relaxed stagger-reveal"
              style={{ animationDelay: "180ms" }}
            >
              Explore SeedTTS, SeedASR, Seed-Music, and live speech research from ByteDance Seed, then generate
              production voice output through a server-side KIE audio API workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 stagger-reveal" style={{ animationDelay: "270ms" }}>
              <Button
                onClick={() => scrollToSection("demo")}
              className="glass-button px-8 py-6 text-base rounded-full bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 text-cyan-200"
            >
              Generate audio
            </Button>
              <Button
                onClick={() => scrollToSection("models")}
                className="glass-button px-8 py-6 text-base rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-white"
              >
                View models
              </Button>
            </div>
          </div>

          {/* Dashboard console */}
          <div className="mt-12 md:mt-20 stagger-reveal" style={{ animationDelay: "360ms" }} ref={dashboardRef}>
            <div style={{ perspective: "1200px" }}>
              <div
                style={{
                  transform: `rotateX(${dashboardScrollOffset}deg)`,
                  transformStyle: "preserve-3d",
                  transition: "transform 0.05s linear",
                }}
              >
                <AudioConsolePreview instanceId="hero" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee (partner/ecosystem logos) ── */}
      <section className="relative py-8 border-y border-white/5 bg-[#080C14] overflow-hidden">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-[#A7ABB3] mb-8">
          Research spanning voice, speech, music, and multimodal AI
        </p>
        <div className="logo-marquee">
          <div className="logo-marquee-content">
            {[
              "/logos/frame-11.png",
              "/logos/frame-55.png",
              "/logos/frame-4.png",
              "/logos/frame-6.png",
              "/logos/frame-8.png",
              "/logos/frame-2.png",
              "/logos/frame-3.png",
              "/logos/frame-7.png",
              "/logos/frame-11.png",
              "/logos/frame-55.png",
              "/logos/frame-4.png",
              "/logos/frame-6.png",
              "/logos/frame-8.png",
              "/logos/frame-2.png",
              "/logos/frame-3.png",
              "/logos/frame-7.png",
            ].map((logo, i) => (
              <div key={i} className="px-8 md:px-12 flex items-center justify-center flex-shrink-0">
                <img
                  src={logo}
                  alt={`Ecosystem logo ${i + 1}`}
                  className="h-20 md:h-16 w-auto object-contain brightness-0 invert"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics / model pillars ── */}
      <section id="capabilities" className="relative py-20 md:py-32 px-4 animate-on-scroll">
        <div className="max-w-[1120px] w-full mx-auto">
          <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 text-center text-balance">
            Seed Audio{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              capabilities
            </span>{" "}
            at a glance
          </h2>
          <p className="text-[#A7ABB3] text-sm md:text-base mb-12 md:mb-16 text-center max-w-[600px] mx-auto leading-relaxed">
            From ByteDance Seed research — covering speech, audio, music, and natural language understanding.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 max-w-[800px] mx-auto">
            {[
              { label: "Text-to-Speech", value: "SeedTTS", desc: "Voice synthesis & replication", color: "cyan" as const },
              { label: "Speech-to-Text", value: "SeedASR", desc: "Multilingual recognition", color: "violet" as const },
              { label: "Music Generation", value: "Seed-Music", desc: "Controlled composition", color: "amber" as const },
              { label: "Languages", value: "Multilingual", desc: "Regional & global support", color: "emerald" as const },
            ].map((metric, i) => (
              <div
                key={i}
                className="p-6 md:p-10 text-center border-b border-white/10 md:py-10 md:pb-20"
              >
                <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-4 flex items-center justify-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${modelColorMap[metric.color].dot}`} />
                  {metric.label}
                </div>
                <div className="font-serif text-[40px] md:text-[56px] leading-none font-medium font-mono">
                  {metric.value}
                </div>
                <div className="text-[11px] md:text-xs text-[#A7ABB3] mt-3">{metric.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Production API console section ── */}
      <section id="demo" className="relative py-20 md:py-32 px-4 animate-on-scroll bg-[#080C14]">
        <div className="max-w-[1120px] w-full mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Production KIE audio API
            </div>
            <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 text-balance">
              Generate with the{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                audio console
              </span>
            </h2>
            <p className="text-[#A7ABB3] text-sm md:text-base max-w-[560px] mx-auto leading-relaxed">
              Create real production audio tasks through KIE.ai audio models. Requests run through this site&apos;s
              server-side API route so the KIE key stays off the client.
            </p>
          </div>
          <AudioConsolePreview instanceId="section" />
        </div>
      </section>

      {/* ── Models section (feature selector) ── */}
      <section id="models" className="relative py-20 md:py-32 px-4 animate-on-scroll">
        <div className="max-w-[1120px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-stretch">
            {/* Left: copy + buttons */}
            <div>
              <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Model overview
              </div>
              <h2 className="font-serif text-[36px] leading-[1.15] md:text-[56px] md:leading-[1.1] font-medium mb-8 text-balance">
                Every audio workflow{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  covered
                </span>
              </h2>
              <p className="text-[#A7ABB3] text-base md:text-lg leading-relaxed mb-10">
                ByteDance Seed research spans text-to-speech, automatic speech recognition, controlled music
                generation, and live speech interpretation — a complete audio AI stack for enterprise and creative
                workflows.
              </p>

              {/* Mobile model image */}
              <div className="md:hidden mb-8">
                <ModelCard model={activeModel} colors={activeColors} fade={modelFade} />
              </div>

              <div className="space-y-3">
                {seedModels.map((model, i) => {
                  const colors = modelColorMap[model.color]
                  const Icon = modelIconMap[model.category]
                  const isActive = selectedModel === i
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        setModelFade(false)
                        setTimeout(() => {
                          setSelectedModel(i)
                          setModelFade(true)
                          setAutoRotationKey((prev) => prev + 1)
                        }, 300)
                      }}
                      className={`relative w-full text-left flex gap-4 items-start p-5 transition-all duration-300 rounded-xl overflow-hidden border ${
                        isActive ? colors.activeBorder : "border-white/10"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-colors ${
                          isActive ? colors.text : "text-[#A7ABB3]"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-medium">{model.name}</h3>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${colors.badge}`}
                          >
                            {model.shortName}
                          </span>
                        </div>
                        <p className="text-sm text-[#A7ABB3]">{model.tagline}</p>
                      </div>
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                          <div className={`h-full ${colors.bar} progress-bar`} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: model detail card */}
            <div className="hidden md:flex items-stretch justify-center">
              <div className="relative w-full">
                <ModelCard model={activeModel} colors={activeColors} fade={modelFade} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section id="use-cases" className="relative py-20 md:py-32 px-4 animate-on-scroll bg-[#080C14]">
        <div className="max-w-[1120px] w-full mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Who uses Seed Audio AI
            </div>
            <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 text-balance">
              Built for{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                every workflow
              </span>
            </h2>
            <p className="text-[#A7ABB3] text-sm md:text-base max-w-[600px] mx-auto leading-relaxed">
              Creators, developers, localization teams, and educators all find value in AI-powered audio generation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {useCases.map((uc) => {
              const colors = modelColorMap[uc.color]
              return (
                <div
                  key={uc.id}
                  className="group p-6 rounded-2xl border border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className="text-[10px] uppercase tracking-[0.15em] text-[#A7ABB3]">{uc.audience}</span>
                  </div>
                  <h3 className="text-lg font-medium mb-3">{uc.title}</h3>
                  <p className="text-sm text-[#A7ABB3] leading-relaxed mb-4">{uc.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {uc.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border ${colors.badge}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Selection guidance / comparison ── */}
      <section className="relative py-20 md:py-32 px-4 animate-on-scroll">
        <div className="max-w-[900px] w-full mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Choosing the right model
            </div>
            <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 text-balance">
              Which Seed model is right for{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                you?
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="text-left px-5 py-4 text-[#A7ABB3] font-normal text-xs uppercase tracking-widest">
                    Need
                  </th>
                  <th className="text-left px-5 py-4 text-[#A7ABB3] font-normal text-xs uppercase tracking-widest">
                    Model
                  </th>
                  <th className="text-left px-5 py-4 text-[#A7ABB3] font-normal text-xs uppercase tracking-widest hidden sm:table-cell">
                    Key strength
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {[
                  { need: "Convert text to natural speech", model: "SeedTTS", strength: "Prosody, expressiveness, voice cloning", color: "cyan" as const },
                  { need: "Transcribe audio or meetings", model: "SeedASR", strength: "Accuracy across accents & noise", color: "violet" as const },
                  { need: "Generate background music", model: "Seed-Music", strength: "Style & instrument control", color: "amber" as const },
                  { need: "Real-time spoken translation", model: "Live Interpretation", strength: "Low latency, context awareness", color: "emerald" as const },
                  { need: "Multilingual product voice", model: "SeedTTS + multilingual", strength: "Regional accent support", color: "cyan" as const },
                  { need: "Voice replication from sample", model: "SeedTTS", strength: "Zero-shot voice cloning", color: "cyan" as const },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4 text-[#F2F3F5]">{row.need}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono border ${modelColorMap[row.color].badge}`}>
                        {row.model}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#A7ABB3] hidden sm:table-cell">{row.strength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Responsible audio note ── */}
      <section className="relative py-16 px-4 animate-on-scroll bg-[#080C14]">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold mb-2 text-amber-200">Responsible audio AI</h3>
                <p className="text-sm text-[#A7ABB3] leading-relaxed">
                  AI voice synthesis and voice replication are powerful capabilities that require responsible use.
                  Always obtain consent before replicating a person&apos;s voice. Disclose AI-generated audio to
                  listeners. Do not use these technologies to deceive, impersonate, or spread misinformation.
                  Enterprises integrating Seed Speech or SeedTTS via BytePlus should review the applicable usage
                  policies and regional regulations before deployment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sources ── */}
      <section className="relative px-4 pb-8 animate-on-scroll bg-[#080C14]">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-cyan-300 mb-2">Primary sources</div>
                <p className="max-w-xl text-sm leading-relaxed text-[#A7ABB3]">
                  This independent guide summarizes public Seed Speech, Seed model, BytePlus, and research references.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {sourceLinks.map((source) => (
                  <a
                    key={source.href}
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-[#F2F3F5] transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
                  >
                    {source.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative py-20 md:py-32 px-4 animate-on-scroll">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Frequently asked questions
            </div>
            <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 text-balance">
              Got{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                questions?
              </span>
            </h2>
            <p className="text-[#A7ABB3] text-sm md:text-base max-w-[600px] mx-auto leading-relaxed">
              Everything you need to know about Seed Audio AI capabilities, models, and responsible use.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "What is Seed Audio AI?",
                answer:
                  "Seed Audio AI refers to the AI speech and audio research from ByteDance Seed, covering SeedTTS (text-to-speech and voice replication), SeedASR (speech recognition), Seed-Music (controlled music generation), and live speech interpretation. This site is an independent informational guide and is not affiliated with ByteDance, BytePlus, or TikTok.",
              },
              {
                question: "What is SeedTTS and what can it do?",
                answer:
                  "SeedTTS is a large-scale text-to-speech and voice replication model from ByteDance Seed research. It generates highly natural, expressive speech from text input, supports emotional prosody control, and can replicate a voice from a short reference audio sample (zero-shot voice cloning). It is designed for high-quality long-form narration, conversational agents, and multilingual synthesis.",
              },
              {
                question: "What is SeedASR?",
                answer:
                  "SeedASR is ByteDance Seed's automatic speech recognition (ASR) system. The public technical report presents it as an LLM-based speech recognition model designed for diverse speech signals, contextual information, accents, languages, and acoustic conditions.",
              },
              {
                question: "What is Seed-Music?",
                answer:
                  "Seed-Music is listed by ByteDance Seed as a suite of music generation systems for high-quality music with fine-grained style control.",
              },
              {
                question: "Does Seed Audio support multiple languages?",
                answer:
                  "Yes. BytePlus Seed Speech describes enterprise-grade multilingual and regional voice support, enabling localization teams and global products to generate voices in many languages with natural intonation and appropriate regional accents.",
              },
              {
                question: "Is this site the official ByteDance or BytePlus Seed Audio product?",
                answer:
                  "No. Seed Audio AI (seedaudioai.ai) is an independent product and research guide. It is not affiliated with ByteDance, BytePlus, or TikTok. The production audio generator on this site uses KIE.ai audio APIs, not an official ByteDance or BytePlus endpoint.",
              },
              {
                question: "Which production audio API does this site use?",
                answer:
                  "The production generator uses KIE.ai Market audio APIs, currently selecting ElevenLabs text-to-speech models through KIE's asynchronous task API. The site creates tasks server-side and polls KIE for the final audio result.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-white/20"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-base md:text-lg font-medium pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-[#A7ABB3] transition-transform duration-300 ${
                      openFaqIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaqIndex === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-6 pb-6 text-sm md:text-base text-[#A7ABB3] leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        id="cta"
        className="relative py-24 md:py-40 px-4 animate-on-scroll overflow-hidden"
      >
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 60%, #22d3ee 0%, #a78bfa 50%, transparent 80%)",
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-8">
            <SpectrogramAccent />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#080C14] via-transparent to-[#080C14] pointer-events-none" />

        <div className="max-w-[800px] w-full mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 glass-pill px-4 py-2 rounded-full mb-8 text-xs md:text-sm text-[#A7ABB3]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Seed Audio AI — Production Audio API
          </div>

          <h2 className="font-serif text-[40px] leading-[1.15] md:text-[64px] md:leading-[1.1] font-medium mb-6 text-balance">
            Start building with{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Seed Audio
            </span>
          </h2>
          <p className="text-[#A7ABB3] text-base md:text-lg mb-10 leading-relaxed max-w-[560px] mx-auto">
            Explore SeedTTS, SeedASR, and Seed-Music capabilities, then generate production voice output through the
            server-side KIE audio API integration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => scrollToSection("demo")}
              className="glass-button text-base rounded-full bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 text-cyan-200 px-8 py-6"
            >
              Generate audio
            </Button>
            <Button
              onClick={() => scrollToSection("faq")}
              className="glass-button text-base rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-white px-8 py-6"
            >
              Read FAQ
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative px-4 border-t border-white/5 py-8">
        <div className="max-w-[1120px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <div className="text-base font-semibold font-mono text-cyan-300">Seed Audio AI</div>
              <p className="text-xs text-[#A7ABB3] leading-relaxed">
                Independent Seed Audio guide with production KIE audio API generation for voice synthesis workflows.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {sourceLinks.slice(0, 2).map((source) => (
                  <a
                    key={source.href}
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-[#A7ABB3] transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
                  >
                    {source.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Models */}
            <div className="flex flex-col gap-4">
              <div className="text-xs uppercase tracking-[0.15em] text-[#F2F3F5] font-semibold mb-2">Models</div>
              <div className="flex flex-col gap-3">
                {["SeedTTS", "SeedASR", "Seed-Music", "Live Interpretation"].map((m) => (
                  <button
                    key={m}
                    onClick={() => scrollToSection("models")}
                    className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors text-left"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Use Cases */}
            <div className="flex flex-col gap-4">
              <div className="text-xs uppercase tracking-[0.15em] text-[#F2F3F5] font-semibold mb-2">Use Cases</div>
              <div className="flex flex-col gap-3">
                {["Creators", "Developers", "Localization", "Education"].map((u) => (
                  <button
                    key={u}
                    onClick={() => scrollToSection("use-cases")}
                    className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors text-left"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Waitlist */}
            <div className="flex flex-col gap-4">
              <div className="text-xs uppercase tracking-[0.15em] text-[#F2F3F5] font-semibold mb-2">Stay updated</div>
              <p className="text-xs text-[#A7ABB3] mb-3">
                Get updates on Seed Audio AI research and production audio capabilities.
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-[#F2F3F5] placeholder-[#A7ABB3] focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                />
                <button className="px-4 py-2 border rounded-lg text-xs font-medium bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col gap-4 text-xs text-[#A7ABB3]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>© 2025 Seed Audio AI. All rights reserved.</div>
              <div className="flex flex-wrap gap-6">
                <a href="#" className="hover:text-[#F2F3F5] transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-[#F2F3F5] transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-[#F2F3F5] transition-colors">Cookie Settings</a>
              </div>
            </div>
            <p className="text-[#A7ABB3]/50 text-[11px] leading-relaxed max-w-[720px]">
              Seed Audio AI is an independent informational site and is not affiliated with ByteDance, BytePlus,
              or TikTok. All product names, trademarks, and research references belong to their respective owners.
              Production audio generation is powered by server-side KIE.ai audio API calls.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Model detail card component ──────────────────────────────────────────────
function ModelCard({
  model,
  colors,
  fade,
}: {
  model: (typeof seedModels)[0]
  colors: (typeof modelColorMap)["cyan"]
  fade: boolean
}) {
  const Icon = modelIconMap[model.category]
  const waveColors = { cyan: "cyan", violet: "violet", amber: "amber", emerald: "emerald" } as const

  return (
    <div
      className={`w-full h-full min-h-[460px] rounded-[20px] border p-6 flex flex-col gap-5 transition-all duration-500 bg-[#0D1117] ${
        colors.border
      } ${fade ? "opacity-100" : "opacity-0"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border ${colors.border}`}>
            <Icon className={`w-4 h-4 ${colors.text}`} />
          </div>
          <div>
            <div className="text-base font-semibold">{model.name}</div>
            <div className="text-xs text-[#A7ABB3]">{model.tagline}</div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-lg text-[10px] font-mono border ${colors.badge}`}>
          {model.shortName}
        </span>
      </div>

      {/* Waveform strip */}
      <div className="rounded-xl bg-white/4 border border-white/8 px-4 py-3">
        <WaveformBars count={40} active={true} color={waveColors[model.color]} />
      </div>

      {/* Description */}
      <p className="text-sm text-[#A7ABB3] leading-relaxed">{model.description}</p>

      {/* Capabilities */}
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-widest text-[#A7ABB3] mb-3">Capabilities</div>
        <ul className="space-y-2">
          {model.capabilities.map((cap) => (
            <li key={cap} className="flex items-center gap-2.5 text-sm text-[#F2F3F5]">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
              {cap}
            </li>
          ))}
        </ul>
      </div>

      {/* Spectrogram footer accent */}
      <div className="mt-auto pt-4 border-t border-white/8">
        <SpectrogramAccent />
      </div>
    </div>
  )
}
