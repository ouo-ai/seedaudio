import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://seedaudioai.ai"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Seed Audio AI | SeedTTS, SeedASR & Speech Guide",
    template: "%s | Seed Audio AI",
  },
  description:
    "Explore Seed Audio AI with SeedTTS, SeedASR, Seed-Music, use cases, model guidance, and responsible voice AI notes for creators and developers.",
  keywords: [
    "Seed Audio",
    "Seed Audio AI",
    "Seed Audio generator",
    "Seed Speech",
    "SeedTTS",
    "SeedASR",
    "AI voice generator",
    "AI speech synthesis",
    "text to speech API",
    "voice replication AI",
    "Seed Music",
    "ByteDance Seed",
    "BytePlus Seed Speech",
    "multilingual TTS",
    "natural voice generation",
  ],
  authors: [{ name: "Seed Audio AI" }],
  creator: "Seed Audio AI",
  publisher: "Seed Audio AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Seed Audio AI",
    title: "Seed Audio AI | SeedTTS, SeedASR & Speech Guide",
    description:
      "Explore Seed Audio AI with SeedTTS, SeedASR, Seed-Music, use cases, model guidance, and responsible voice AI notes.",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Seed Audio AI — AI Voice & Speech Generation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seed Audio AI | SeedTTS, SeedASR & Speech Guide",
    description:
      "Independent guide to Seed Audio AI, SeedTTS, SeedASR, Seed-Music, and responsible voice AI use cases.",
    images: [`${SITE_URL}/opengraph-image`],
    creator: "@seedaudioai",
  },
  alternates: {
    canonical: SITE_URL,
  },
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-light-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080C14",
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Seed Audio AI",
      description:
        "Independent informational guide to Seed Audio AI voice and speech generation capabilities. Not affiliated with ByteDance, BytePlus, or TikTok.",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Seed Audio AI",
      url: SITE_URL,
      description:
        "Independent informational site covering Seed Audio AI research and capabilities. Not affiliated with ByteDance, BytePlus, or TikTok.",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.svg`,
        width: 512,
        height: 512,
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "Seed Audio AI",
      applicationCategory: "ReferenceApplication",
      operatingSystem: "Web",
      description:
        "Independent web guide and demo preview covering Seed Audio research, SeedTTS text-to-speech, SeedASR speech recognition, Seed-Music generation, and responsible audio AI use cases. Not affiliated with ByteDance, BytePlus, or TikTok.",
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        description: "Free informational guide and visual demo preview; no production audio API is provided by this site.",
      },
      featureList: [
        "SeedTTS text-to-speech synthesis",
        "SeedASR speech-to-text recognition",
        "Voice replication and cloning",
        "Multilingual and regional voice support",
        "Seed-Music controlled generation",
        "Real-time speech interpretation",
        "Enterprise API integration",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Seed Audio AI?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Seed Audio AI refers to the AI speech and audio research from ByteDance Seed, covering SeedTTS (text-to-speech), SeedASR (speech recognition), voice replication, multilingual synthesis, and Seed-Music generation. This is an independent informational guide and is not affiliated with ByteDance, BytePlus, or TikTok.",
          },
        },
        {
          "@type": "Question",
          name: "What is SeedTTS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "SeedTTS is a text-to-speech and voice replication model from ByteDance Seed research. It supports high-quality natural voice generation, emotional expressiveness, and voice cloning from reference audio samples.",
          },
        },
        {
          "@type": "Question",
          name: "What is SeedASR?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "SeedASR is ByteDance Seed's speech-to-text (automatic speech recognition) system. It is designed for high-accuracy transcription across diverse languages, accents, and audio conditions.",
          },
        },
        {
          "@type": "Question",
          name: "Does Seed Audio AI support multiple languages?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. BytePlus Seed Speech describes enterprise-grade multilingual and regional voice support, enabling localization teams and global products to generate voices in many languages with natural intonation.",
          },
        },
        {
          "@type": "Question",
          name: "What is Seed-Music?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Seed-Music is a ByteDance Seed research model for controlled music generation and editing, allowing users to create and modify musical content with AI-driven composition and style control.",
          },
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#080C14]">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-[#080C14]">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
