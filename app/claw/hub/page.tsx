"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Download,
  Star,
  Zap,
  Image,
  Video,
  Wand2,
  Bot,
  ArrowUpRight,
  Rocket,
  ShieldCheck,
  Sparkles,
  Activity,
  Compass,
  Clock3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useClawLink } from "@/hooks/use-claw-link";
import { ASSET_BASE } from "@/lib/assets";
import { db } from "@/lib/firebaseClient";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";

interface SkillEntry {
  name: string;
  description: string;
  author: string;
  category: "image" | "video" | "template" | "utility";
  costEstimate: string;
  triggers: string[];
  installed: boolean;
  featured: boolean;
  stars: number;
  version: string;
  visualUrl?: string;
  visualPosterUrl?: string;
  visualKind?: "image" | "video";
  sourcePostId?: string;
}

interface ClawRecentJob {
  id: string;
  prompt: string;
  status: string;
  model?: string;
  createdAt?: string;
}

const SKILL_VISUAL_ASSETS = [
  "/community/community21.webp",
  "/community/community22.png",
  "/community/community23.webp",
  "/community/community24.webp",
  "/community/community25.png",
  "/community/community26.webp",
  "/community/community27.webp",
  "/community/community28.webp",
  "/community/community29.webp",
  "/community/community30.webp",
  "/community/community31.webp",
  "/community/community32.webp",
  "/community/community33.png",
  "/community/community34.webp",
  "/community/community35.webp",
  "/community/community36.webp",
  "/community/community37.webp",
  "/community/community38.webp",
  "/community/community39.webp",
  "/community/community40.webp",
  "/community/community41.webp",
  "/community/community42.webp",
  "/community/community43.webp",
  "/community/community44.webp",
  "/community/community6.jpg",
  "/community/community7.jpg",
  "/community/community8.jpg",
  "/community/community9.jpg",
];

const LEGACY_TEMPLATE_SLUG_FRAGMENTS = [
  "fire-lava",
  "firelava",
  "air-bending",
  "earth-zoom",
  "shadow-smoke",
  "animalization",
  "raven-transform",
  "train-rush",
  "mouth-in",
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const fallbackSkillVisual = (skillName: string) => {
  const idx = hashString(skillName) % SKILL_VISUAL_ASSETS.length;
  return SKILL_VISUAL_ASSETS[idx];
};

const isVideoUrl = (value?: string) => Boolean(value && /(\.mp4|\.mov|\.webm|\.m3u8)(\?|$)/i.test(value));

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const cleanText = (value: unknown) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const CATEGORY_ICONS = {
  image: Image,
  video: Video,
  template: Wand2,
  utility: Zap,
};

const CATEGORY_COLORS = {
  image: "text-cyan-200 border-cyan-300/40 bg-cyan-400/10",
  video: "text-amber-100 border-amber-300/40 bg-amber-400/10",
  template: "text-lime-100 border-lime-300/40 bg-lime-300/10",
  utility: "text-rose-100 border-rose-300/40 bg-rose-400/10",
};

interface HeroMotifMedia {
  key: string;
  kind: "image" | "video";
  src: string;
  poster?: string;
  alt: string;
  label: string;
  caption: string;
  accent: string;
}

const HERO_MOTIF_MEDIA_FALLBACK: HeroMotifMedia[] = [
  {
    key: "fallback-image",
    kind: "image",
    src: `${ASSET_BASE}/capabilities/capabilities3.png`,
    alt: "Image generation motif",
    label: "Image",
    caption: "Prompt-ready render",
    accent: "border-cyan-200/40 bg-cyan-300/12 text-cyan-100",
  },
  {
    key: "fallback-video",
    kind: "video",
    src: `${ASSET_BASE}/capabilities/capabilities8.png`,
    poster: `${ASSET_BASE}/capabilities/capabilities8.png`,
    alt: "Video generation motif",
    label: "Video",
    caption: "Motion template pass",
    accent: "border-amber-200/40 bg-amber-300/12 text-amber-100",
  },
  {
    key: "fallback-community",
    kind: "image",
    src: `${ASSET_BASE}/capabilities/capabilities12.png`,
    alt: "Community motif",
    label: "Community",
    caption: "Community remix flow",
    accent: "border-lime-200/40 bg-lime-300/12 text-lime-100",
  },
];

type Category = "all" | "image" | "video" | "template" | "utility";

export default function ClawHubPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { link, isLinked, loading: linkLoading } = useClawLink();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [recentJobs, setRecentJobs] = useState<ClawRecentJob[]>([]);
  const [heroMotifMedia, setHeroMotifMedia] = useState<HeroMotifMedia[]>(HERO_MOTIF_MEDIA_FALLBACK);
  const [communityTemplateSkills, setCommunityTemplateSkills] = useState<SkillEntry[]>([]);

  const incomingPrompt = searchParams.get("prompt") || "";
  const incomingAssetUrl = searchParams.get("assetUrl") || "";
  const incomingCreationId = searchParams.get("creationId") || "";

  useEffect(() => {
    if (!user?.uid) {
      setRecentJobs([]);
      return;
    }

    const q = query(collection(db, "jobs"), where("uid", "==", user.uid), where("source", "==", "claw"), limit(24));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const toMillis = (value: unknown) => {
          if (!value) return 0;
          if (typeof value === "string") {
            const d = Date.parse(value);
            return Number.isNaN(d) ? 0 : d;
          }
          if (typeof value === "object" && value !== null) {
            const maybeTs = value as { toDate?: () => Date; seconds?: number };
            if (typeof maybeTs.toDate === "function") return maybeTs.toDate().getTime();
            if (typeof maybeTs.seconds === "number") return maybeTs.seconds * 1000;
          }
          return 0;
        };

        const jobs = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as Record<string, any>;
            return {
              id: docSnap.id,
              prompt: data.prompt || data.args?.prompt || "Untitled request",
              status: data.status || "pending",
              model: data.model || data.args?.model || "",
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate().toISOString()
                : typeof data.createdAt === "string"
                  ? data.createdAt
                  : undefined,
              createdMs: toMillis(data.createdAt),
            };
          })
          .sort((a, b) => b.createdMs - a.createdMs)
          .slice(0, 8)
          .map(({ createdMs: _createdMs, ...rest }) => rest);

        setRecentJobs(jobs);
      },
      () => setRecentJobs([])
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(120));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() as Record<string, any> }))
          .filter((entry) => entry.data.isDeleted !== true && entry.data.status !== "deleted");

        const mapped = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as Record<string, any>;
            if (data.isDeleted === true || data.status === "deleted") return null;

            const assetUrl = typeof data.assetUrl === "string" ? data.assetUrl : "";
            const thumbnailUrl = typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : "";
            const inferredVideo = data.type === "video" || isVideoUrl(assetUrl);
            const kind: "image" | "video" = inferredVideo ? "video" : "image";

            const source = kind === "video" ? assetUrl : thumbnailUrl || assetUrl;
            if (!source) return null;

            const captionRaw = (
              data.title ||
              data.prompt ||
              data.model ||
              data.description ||
              "Community creation"
            )
              .toString()
              .replace(/\s+/g, " ")
              .trim();
            const normalizedCaption = slugify(captionRaw);
            if (LEGACY_TEMPLATE_SLUG_FRAGMENTS.some((fragment) => normalizedCaption.includes(fragment))) {
              return null;
            }

            return {
              key: docSnap.id,
              kind,
              src: source,
              poster:
                kind === "video"
                  ? thumbnailUrl || `${ASSET_BASE}/capabilities/capabilities8.png`
                  : undefined,
              alt: captionRaw || `Community ${kind}`,
              label: kind === "video" ? "Live Video" : "Live Image",
              caption: captionRaw || "Community creation",
              accent:
                kind === "video"
                  ? "border-amber-200/40 bg-amber-300/12 text-amber-100"
                  : "border-cyan-200/40 bg-cyan-300/12 text-cyan-100",
            } as HeroMotifMedia;
          })
          .filter((entry): entry is HeroMotifMedia => Boolean(entry));

        const prioritized = [...mapped.filter((item) => item.kind === "video"), ...mapped.filter((item) => item.kind === "image")];
        const heroSeen = new Set<string>();
        const selected = prioritized.filter((item) => {
          const heroKey = slugify(item.caption || item.alt || item.key);
          if (heroSeen.has(heroKey)) return false;
          heroSeen.add(heroKey);
          return true;
        }).slice(0, 3);
        setHeroMotifMedia(selected.length > 0 ? selected : HERO_MOTIF_MEDIA_FALLBACK);

        type TemplateCandidate = SkillEntry & { _dedupeKey: string };
        const templateCandidates = docs.reduce<TemplateCandidate[]>((acc, entry) => {
          const { id, data } = entry;
          const assetUrl = cleanText(data.assetUrl);
          const thumbnailUrl = cleanText(data.thumbnailUrl) || assetUrl;
          const tags = Array.isArray(data.tags) ? data.tags.map((tag: unknown) => cleanText(tag).toLowerCase()).filter(Boolean) : [];
          const isVideo = data.type === "video" || isVideoUrl(assetUrl);
          if (!isVideo) return acc;
          if (tags.includes("legacy-community")) return acc;

          const title = cleanText(data.title || data.prompt || `Template ${id.slice(0, 6)}`);
          if (!title) return acc;
          const normalizedTitle = slugify(title);
          if (LEGACY_TEMPLATE_SLUG_FRAGMENTS.some((fragment) => normalizedTitle.includes(fragment))) {
            return acc;
          }

          const description =
            cleanText(data.description) ||
            cleanText(data.prompt) ||
            "Live video workflow synced from the current community feed.";
          const filteredTags = tags.filter((tag) => !["community", "upload", "legacy-community"].includes(tag));
          const baseTrigger = title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          const triggers = Array.from(new Set([baseTrigger, ...filteredTags, "live video"])).filter(Boolean).slice(0, 3);
          const stars = Number(data.likes || 0) + Number(data.views || 0);

          acc.push({
            name: title,
            description,
            author: cleanText(data.author?.name) || "Community",
            category: "video",
            costEstimate: "10-40",
            triggers: triggers.length ? triggers : ["video template"],
            installed: true,
            featured: false,
            stars: Number.isFinite(stars) ? stars : 0,
            version: "live",
            visualUrl: assetUrl,
            visualPosterUrl: thumbnailUrl || undefined,
            visualKind: "video",
            sourcePostId: id,
            _dedupeKey: normalizedTitle || id,
          });
          return acc;
        }, []);

        const seen = new Set<string>();
        const uniqueTemplates: SkillEntry[] = [];
        for (const template of templateCandidates) {
          if (seen.has(template._dedupeKey)) continue;
          seen.add(template._dedupeKey);
          uniqueTemplates.push({
            name: template.name,
            description: template.description,
            author: template.author,
            category: template.category,
            costEstimate: template.costEstimate,
            triggers: template.triggers,
            installed: template.installed,
            featured: uniqueTemplates.length < 3,
            stars: template.stars,
            version: template.version,
            visualUrl: template.visualUrl,
            visualPosterUrl: template.visualPosterUrl,
            visualKind: template.visualKind,
            sourcePostId: template.sourcePostId,
          });
          if (uniqueTemplates.length >= 12) break;
        }

        setCommunityTemplateSkills(uniqueTemplates);
      },
      () => {
        setHeroMotifMedia(HERO_MOTIF_MEDIA_FALLBACK);
        setCommunityTemplateSkills([]);
      }
    );

    return () => unsubscribe();
  }, []);

  const allSkills = useMemo(() => communityTemplateSkills, [communityTemplateSkills]);

  const filtered = useMemo(
    () =>
      allSkills.filter((skill) => {
        const text = search.toLowerCase().trim();
        const matchesSearch =
          !text ||
          skill.name.includes(text) ||
          skill.description.toLowerCase().includes(text) ||
          skill.triggers.some((trigger) => trigger.toLowerCase().includes(text));
        const matchesCategory = activeCategory === "all" || skill.category === activeCategory;
        return matchesSearch && matchesCategory;
      }),
    [activeCategory, allSkills, search]
  );

  const featured = filtered.filter((s) => s.featured);
  const rest = filtered.filter((s) => !s.featured);

  const statusCounts = useMemo(() => {
    const total = recentJobs.length;
    const completed = recentJobs.filter((job) => job.status === "completed").length;
    const failed = recentJobs.filter((job) => job.status === "failed" || job.status === "cancelled").length;
    return { total, completed, failed };
  }, [recentJobs]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040506]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute right-[-140px] top-[280px] h-[360px] w-[360px] rounded-full bg-lime-400/12 blur-[130px]" />
        <div className="absolute left-[-160px] bottom-[-100px] h-[340px] w-[340px] rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px] opacity-[0.08]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-36 md:pb-20 md:pt-44">
        <section className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.03] p-6 md:p-8 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.09] via-transparent to-transparent" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                <Rocket className="h-3.5 w-3.5" />
                Claw Control Deck
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl ">
                Premium command center for your chat-native creation workflow
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
                Orchestrate Telegram creation, Director-mode handoff, and generation intelligence from one surface built for speed.
              </p>
            </div>

            <div className="flex w-full max-w-[360px] flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Live Templates" value={String(allSkills.length)} tone="cyan" />
                <MetricCard label="Recent Jobs" value={String(statusCounts.total)} tone="lime" />
                <MetricCard label="Completed" value={String(statusCounts.completed)} tone="amber" />
                <MetricCard label="Failures" value={String(statusCounts.failed)} tone="rose" />
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
                <div className="relative">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    Live command motifs
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                  {heroMotifMedia.map((media, index) => (
                    <article
                      key={media.key}
                      className={cn(
                        "overflow-hidden rounded-xl border border-white/15 bg-white/[0.04] shadow-[0_16px_36px_rgba(0,0,0,0.4)]",
                        index === 1 ? "md:translate-y-1" : index === 2 ? "md:translate-y-2" : ""
                      )}
                    >
                      <div className="relative h-24 w-full overflow-hidden bg-black/40">
                        {media.kind === "video" ? (
                          <video
                            src={media.src}
                            poster={media.poster}
                            className="h-full w-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img src={media.src} alt={media.alt} className="h-full w-full object-cover" />
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        {media.kind === "video" && (
                          <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white">
                            <Video className="h-2.5 w-2.5" />
                          </span>
                        )}
                        <span
                          className={cn(
                            "absolute bottom-1.5 left-1.5 right-1.5 inline-flex max-w-[calc(100%-0.75rem)] items-center justify-center rounded-full border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em]",
                            media.accent
                          )}
                        >
                          {media.label}
                        </span>
                      </div>
                      <p
                        className="min-h-[2.2rem] px-2 py-1.5 text-[9px] font-medium leading-[1.15] tracking-[0.04em] text-zinc-300"
                        title={media.caption}
                      >
                        {media.caption}
                      </p>
                    </article>
                  ))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[8px] uppercase tracking-[0.08em] text-zinc-400 sm:text-[9px]">
                    <span className="flex min-w-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-center">Tap-ready</span>
                    <span className="flex min-w-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-center">Mobile-first</span>
                    <span className="col-span-2 flex min-w-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-center">Community sync</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[24px] border border-white/10 bg-[#0a0c0f]/85 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Connection Status</p>
                <h2 className="mt-2 text-xl font-semibold text-white ">
                  {linkLoading ? "Verifying your Claw identity..." : isLinked ? "Telegram channel is authenticated" : "Link required to activate cross-surface handoff"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                  {isLinked
                    ? `Connected as ${link?.channelUserId || "unknown"} on ${link?.channelType || "telegram"}.`
                    : "Run /pair in Telegram, then enter your six-digit code to unlock command routing from Studio to chat."}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                  isLinked ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {isLinked ? "Linked" : "Not Linked"}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild className="h-10 rounded-xl bg-cyan-400 text-black hover:bg-cyan-300">
                <a href="https://t.me/StudioXCbot" target="_blank" rel="noreferrer">
                  <Bot className="mr-2 h-4 w-4" />
                  Open Telegram Bot
                </a>
              </Button>
              <Button asChild variant="outline" className="h-10 rounded-xl border-white/15 bg-white/[0.02] text-zinc-200 hover:bg-white/[0.08]">
                <Link href="/claw/pair">{isLinked ? "Re-link" : "Pair Account"}</Link>
              </Button>
              <Button asChild variant="outline" className="h-10 rounded-xl border-white/15 bg-white/[0.02] text-zinc-200 hover:bg-white/[0.08]">
                <Link href="/claw/schedule">
                  <Clock3 className="mr-2 h-4 w-4" />
                  Schedule Jobs
                </Link>
              </Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Channel Identity</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-300/12 text-cyan-100">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm text-zinc-100">{link?.channelUserId || "Not paired yet"}</p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">{link?.channelType || "telegram"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Ready Actions</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Generate", "Remix", "Post", "Export"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#0a0c0f]/85 p-5 md:p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Execution Pulse</p>
            <h3 className="mt-2 text-3xl font-semibold text-white ">{recentJobs.length}</h3>
            <p className="mt-2 text-sm text-zinc-400">Recent chat-driven actions tracked across generation workflows.</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs text-zinc-400">
              <p>Command Layer: Telegram polling</p>
              <p>Graph Sync: {isLinked ? "Active" : "Pending link"}</p>
            </div>
            <Button asChild variant="outline" className="mt-4 w-full rounded-xl border-white/15 bg-white/[0.02] text-zinc-200 hover:bg-white/[0.08]">
              <Link href="/claw/schedule">Open Job Timeline</Link>
            </Button>
          </div>
        </section>

        {(incomingPrompt || incomingAssetUrl) && (
          <section className="mt-6 rounded-[24px] border border-lime-200/30 bg-lime-300/10 p-5 md:p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-lime-100/90">Incoming from Studio</p>
            <p className="mt-2 text-sm text-lime-100/90">
              A creation is queued for chat handoff.
              {incomingPrompt ? ` Prompt: “${incomingPrompt.slice(0, 100)}${incomingPrompt.length > 100 ? "..." : ""}”` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="h-10 rounded-xl bg-lime-200 text-black hover:bg-lime-100">
                <a href="https://t.me/StudioXCbot" target="_blank" rel="noreferrer">Send to Telegram</a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-xl border-lime-100/40 bg-lime-200/5 text-lime-50 hover:bg-lime-200/15"
              >
                <Link
                  href={`/studio?mode=remix&prompt=${encodeURIComponent(incomingPrompt || "")}&previewUrl=${encodeURIComponent(
                    incomingAssetUrl || ""
                  )}&creationId=${encodeURIComponent(incomingCreationId || "")}`}
                >
                  Open in Studio
                </Link>
              </Button>
            </div>
          </section>
        )}

        {recentJobs.length > 0 && (
          <section className="mt-6 rounded-[24px] border border-white/10 bg-[#0a0c0f]/85 p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Latest Bot Actions</h2>
              <Link href="/claw/schedule" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                Full timeline
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-4 grid gap-2">
              {recentJobs.map((job) => (
                <article
                  key={job.id}
                  className="group rounded-2xl border border-white/8 bg-black/30 px-3 py-3 transition-all duration-300 hover:border-white/20 hover:bg-black/45"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{job.prompt}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        <span className="font-mono">{job.model || "unknown model"}</span>
                        {job.createdAt ? ` • ${new Date(job.createdAt).toLocaleString()}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.16em]",
                        job.status === "completed"
                          ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                          : job.status === "failed" || job.status === "cancelled"
                            ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
                            : "border-amber-300/30 bg-amber-300/10 text-amber-100"
                      )}
                    >
                      {job.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search live templates, triggers, workflows..."
                className="h-11 rounded-xl border-white/15 bg-white/[0.03] pl-10 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "image", "video", "template", "utility"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition-all",
                    activeCategory === cat
                      ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                      : "border-white/12 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {featured.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2 text-zinc-300">
              <Sparkles className="h-4 w-4 text-cyan-200" />
              <h2 className="text-sm uppercase tracking-[0.24em]">Featured Community Workflows</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((skill) => (
                <SkillCard key={skill.name} skill={skill} emphasis />
              ))}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2 text-zinc-300">
              <Compass className="h-4 w-4 text-lime-200" />
              <h2 className="text-sm uppercase tracking-[0.24em]">Live Community Templates</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((skill) => (
                <SkillCard key={skill.name} skill={skill} />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <section className="mt-14 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-zinc-400">
            No live templates match “{search}”. Try a broader keyword.
          </section>
        )}

        <section className="mt-12 rounded-[24px] border border-white/10 bg-gradient-to-r from-white/[0.06] via-white/[0.02] to-white/[0.04] p-6 text-center">
          <Activity className="mx-auto h-7 w-7 text-cyan-200" />
          <h3 className="mt-3 text-xl text-white ">Community skill marketplace is next</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-400">
            Curated skill packs, verified creators, and install analytics are being prepared for launch.
          </p>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "cyan" | "lime" | "amber" | "rose" }) {
  const toneClass = {
    cyan: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    lime: "border-lime-300/30 bg-lime-300/10 text-lime-100",
    amber: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    rose: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  }[tone];

  return (
    <div className={cn("rounded-2xl border px-3 py-2", toneClass)}>
      <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white ">{value}</p>
    </div>
  );
}

function SkillCard({ skill, emphasis = false }: { skill: SkillEntry; emphasis?: boolean }) {
  const Icon = CATEGORY_ICONS[skill.category];
  const colorClass = CATEGORY_COLORS[skill.category];
  const skillVisualUrl = skill.visualUrl || fallbackSkillVisual(skill.name);
  const skillPosterUrl = skill.visualPosterUrl || (!isVideoUrl(skillVisualUrl) ? skillVisualUrl : undefined) || fallbackSkillVisual(skill.name);
  const showsVideoPreview = skill.visualKind === "video" && Boolean(skill.visualUrl);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-[#090b0d]/95 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25",
        emphasis ? "shadow-[0_16px_55px_rgba(46,255,232,0.08)]" : ""
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent opacity-70" />
      <div className="relative flex h-full flex-col gap-3">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/25">
          {showsVideoPreview ? (
            <video
              src={skillVisualUrl}
              poster={skillPosterUrl}
              className="h-24 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={skillPosterUrl}
              alt={`${skill.name} visual`}
              className="h-24 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        <div className="flex items-start justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", colorClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <Badge variant="outline" className="border-white/15 bg-white/[0.03] text-[10px] uppercase tracking-[0.16em] text-zinc-400">
            v{skill.version}
          </Badge>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white ">{skill.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{skill.description}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {skill.triggers.slice(0, 2).map((t) => (
            <span key={t} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-400 font-mono">
              {t}
            </span>
          ))}
          {skill.triggers.length > 2 && <span className="text-[11px] text-zinc-500">+{skill.triggers.length - 2}</span>}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-2">
          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3" />
              {skill.stars.toLocaleString()}
            </span>
            <span>{skill.costEstimate === "0" ? "Free" : `~${skill.costEstimate} cr`}</span>
          </div>
          <Button
            size="sm"
            disabled={skill.installed}
            className={cn(
              "h-7 rounded-lg px-3 text-[11px]",
              skill.installed
                ? "cursor-default border border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                : "bg-cyan-300 text-black hover:bg-cyan-200"
            )}
          >
            {skill.installed ? (
              <span className="inline-flex items-center gap-1">
                <Download className="h-3 w-3" />
                Installed
              </span>
            ) : (
              "Install"
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
