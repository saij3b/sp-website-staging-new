import type { CommunityCampaignMeta } from "@/lib/types"

export interface ExportPackPreset {
  id: string
  label: string
  width: number
  height: number
  platform: string
}

export interface ExportPackPayload {
  assetUrl: string
  type: "image" | "video"
  prompt?: string
  title?: string
  model?: string
  aspect?: string
  creationId?: string
  generationPlatform?: string
  campaign?: CommunityCampaignMeta
}

export const EXPORT_PACK_PRESETS: ExportPackPreset[] = [
  { id: "instagram-post", label: "Instagram Post", width: 1080, height: 1080, platform: "Instagram" },
  { id: "instagram-story", label: "Instagram Story", width: 1080, height: 1920, platform: "Instagram" },
  { id: "x-landscape", label: "X / Twitter Landscape", width: 1600, height: 900, platform: "X" },
  { id: "linkedin-post", label: "LinkedIn Post", width: 1200, height: 627, platform: "LinkedIn" },
  { id: "youtube-thumb", label: "YouTube Thumbnail", width: 1280, height: 720, platform: "YouTube" },
]

export function buildExportPackHref(payload: ExportPackPayload): string {
  const params = new URLSearchParams()
  params.set("assetUrl", payload.assetUrl)
  params.set("type", payload.type)

  if (payload.prompt) params.set("prompt", payload.prompt)
  if (payload.title) params.set("title", payload.title)
  if (payload.model) params.set("model", payload.model)
  if (payload.aspect) params.set("aspect", payload.aspect)
  if (payload.creationId) params.set("creationId", payload.creationId)
  if (payload.generationPlatform) params.set("generationPlatform", payload.generationPlatform)
  if (payload.campaign?.goal) params.set("campaignGoal", payload.campaign.goal)
  if (payload.campaign?.platform) params.set("campaignPlatform", payload.campaign.platform)
  if (payload.campaign?.style) params.set("campaignStyle", payload.campaign.style)
  if (payload.campaign?.variationCount) params.set("campaignVariationCount", String(payload.campaign.variationCount))
  if (payload.campaign?.brief) params.set("campaignBrief", payload.campaign.brief)
  if (payload.campaign?.directed) params.set("campaignDirected", "1")

  return `/export-pack?${params.toString()}`
}

export function buildExportPackFilename(title: string | undefined, creationId: string | undefined): string {
  const base = (title || "studiox-campaign-pack")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)

  const suffix = creationId ? `-${creationId.slice(0, 8)}` : ""
  return `${base || "studiox-campaign-pack"}${suffix}`
}
