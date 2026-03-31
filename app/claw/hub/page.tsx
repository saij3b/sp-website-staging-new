"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
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
import { db } from "@/lib/firebaseClient";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-claw-display",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-claw-mono",
});

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
}

interface ClawRecentJob {
  id: string;
  prompt: string;
  status: string;
  model?: string;
  createdAt?: string;
}

const BUILT_IN_SKILLS: SkillEntry[] = [
  {
    name: "image-gen",
    description: "Generate images from text prompts using 13 models including Flux, Seedream, and SDXL.",
    author: "StudioX",
    category: "image",
    costEstimate: "2-10",
    triggers: ["generate", "image of", "create an image"],
    installed: true,
    featured: true,
    stars: 1247,
    version: "1.0.0",
  },
  {
    name: "video-gen",
    description: "Generate videos from text prompts using Sora 2, Kling 3.0, and more.",
    author: "StudioX",
    category: "video",
    costEstimate: "10-100",
    triggers: ["create a video", "generate a video", "video of"],
    installed: true,
    featured: true,
    stars: 892,
    version: "1.0.0",
  },
  {
    name: "template-fire-lava",
    description: "Apply dramatic fire and lava effects to any subject. Cinematic quality.",
    author: "StudioX",
    category: "template",
    costEstimate: "15-30",
    triggers: ["fire lava", "fire effect", "lava effect"],
    installed: true,
    featured: true,
    stars: 634,
    version: "1.0.0",
  },
  {
    name: "template-air-bending",
    description: "Create stunning air-bending effects with flowing wind and particle trails.",
    author: "StudioX",
    category: "template",
    costEstimate: "15-30",
    triggers: ["air bending", "air effect", "wind effect"],
    installed: true,
    featured: true,
    stars: 521,
    version: "1.0.0",
  },
  {
    name: "template-earth-zoom",
    description: "Epic earth zoom-out effect starting from any location or subject.",
    author: "StudioX",
    category: "template",
    costEstimate: "20-40",
    triggers: ["earth zoom", "zoom out from earth", "globe zoom"],
    installed: true,
    featured: false,
    stars: 445,
    version: "1.0.0",
  },
  {
    name: "template-shadow-smoke",
    description: "Mysterious shadow smoke effects with atmospheric fog and depth.",
    author: "StudioX",
    category: "template",
    costEstimate: "15-30",
    triggers: ["shadow smoke", "smoke effect", "fog effect"],
    installed: true,
    featured: false,
    stars: 389,
    version: "1.0.0",
  },
  {
    name: "template-animalization",
    description: "Transform any portrait into an animal hybrid with photorealistic quality.",
    author: "StudioX",
    category: "template",
    costEstimate: "10-20",
    triggers: ["animalize", "animalization", "turn into animal"],
    installed: true,
    featured: false,
    stars: 756,
    version: "1.0.0",
  },
  {
    name: "template-raven-transform",
    description: "Dark raven transformation effect — gothic, cinematic, atmospheric.",
    author: "StudioX",
    category: "template",
    costEstimate: "15-30",
    triggers: ["raven transform", "raven effect", "dark raven"],
    installed: true,
    featured: false,
    stars: 312,
    version: "1.0.0",
  },
  {
    name: "template-train-rush",
    description: "High-speed train rush effect with motion blur and dynamic perspective.",
    author: "StudioX",
    category: "template",
    costEstimate: "20-35",
    triggers: ["train rush", "train effect", "speeding train"],
    installed: true,
    featured: false,
    stars: 278,
    version: "1.0.0",
  },
  {
    name: "template-mouth-in",
    description: "Surreal mouth-pull-in zoom effect popularized on social media.",
    author: "StudioX",
    category: "template",
    costEstimate: "15-25",
    triggers: ["mouth in", "mouth zoom", "pull into mouth"],
    installed: true,
    featured: false,
    stars: 891,
    version: "1.0.0",
  },
  {
    name: "upscale",
    description: "Upscale any image to 4K resolution with AI enhancement.",
    author: "StudioX",
    category: "utility",
    costEstimate: "5-15",
    triggers: ["upscale", "enhance image", "4k upscale"],
    installed: true,
    featured: false,
    stars: 445,
    version: "1.0.0",
  },
  {
    name: "remix",
    description: "Remix your existing creations with new prompts while keeping style.",
    author: "StudioX",
    category: "utility",
    costEstimate: "5-20",
    triggers: ["remix", "remix this", "create variation"],
    installed: true,
    featured: true,
    stars: 567,
    version: "1.0.0",
  },
  {
    name: "smart-model-picker",
    description: "Auto-selects the best model for your request based on quality and cost.",
    author: "StudioX",
    category: "utility",
    costEstimate: "0",
    triggers: ["pick model", "best model for", "suggest model"],
    installed: true,
    featured: false,
    stars: 334,
    version: "1.0.0",
  },
  {
    name: "prompt-enhance",
    description: "AI-improves your raw prompt for better generation results.",
    author: "StudioX",
    category: "utility",
    costEstimate: "1-2",
    triggers: ["enhance prompt", "improve prompt", "better prompt for"],
    installed: true,
    featured: false,
    stars: 289,
    version: "1.0.0",
  },
  {
    name: "batch",
    description: "Generate multiple variations at once. Up to 10 images in a single command.",
    author: "StudioX",
    category: "utility",
    costEstimate: "varies",
    triggers: ["batch generate", "generate 5", "create multiple"],
    installed: true,
    featured: false,
    stars: 198,
    version: "1.0.0",
  },
  {
    name: "character-consistency",
    description: "Maintain a consistent character across multiple generations.",
    author: "StudioX",
    category: "utility",
    costEstimate: "10-25",
    triggers: ["character", "same character", "consistent character"],
    installed: true,
    featured: false,
    stars: 412,
    version: "1.0.0",
  },
  {
    name: "style-profile",
    description: "Save and load your personal style preferences for consistent results.",
    author: "StudioX",
    category: "utility",
    costEstimate: "0",
    triggers: ["save style", "load style", "style profile", "my style"],
    installed: true,
    featured: false,
    stars: 167,
    version: "1.0.0",
  },
  {
    name: "community-post",
    description: "Publish your creations to the StudioX community feed.",
    author: "StudioX",
    category: "utility",
    costEstimate: "0",
    triggers: ["post to community", "share creation", "publish"],
    installed: true,
    featured: false,
    stars: 223,
    version: "1.0.0",
  },
  {
    name: "credit-check",
    description: "Check your credit balance and get personalized recommendations.",
    author: "StudioX",
    category: "utility",
    costEstimate: "0",
    triggers: ["credits", "balance", "how many credits"],
    installed: true,
    featured: false,
    stars: 156,
    version: "1.0.0",
  },
];

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

type Category = "all" | "image" | "video" | "template" | "utility";

export default function ClawHubPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { link, isLinked, loading: linkLoading } = useClawLink();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [recentJobs, setRecentJobs] = useState<ClawRecentJob[]>([]);

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

  const filtered = useMemo(
    () =>
      BUILT_IN_SKILLS.filter((skill) => {
        const text = search.toLowerCase().trim();
        const matchesSearch =
          !text ||
          skill.name.includes(text) ||
          skill.description.toLowerCase().includes(text) ||
          skill.triggers.some((trigger) => trigger.toLowerCase().includes(text));
        const matchesCategory = activeCategory === "all" || skill.category === activeCategory;
        return matchesSearch && matchesCategory;
      }),
    [activeCategory, search]
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
    <div className={cn("relative min-h-screen overflow-hidden bg-[#040506]", displayFont.variable, monoFont.variable)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute right-[-140px] top-[280px] h-[360px] w-[360px] rounded-full bg-lime-400/12 blur-[130px]" />
        <div className="absolute left-[-160px] bottom-[-100px] h-[340px] w-[340px] rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px] opacity-[0.08]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 md:pb-20 md:pt-14">
        <section className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.03] p-6 md:p-8 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.09] via-transparent to-transparent" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                <Rocket className="h-3.5 w-3.5" />
                Claw Control Deck
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl [font-family:var(--font-claw-display)]">
                Premium command center for your chat-native creation workflow
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
                Orchestrate Telegram creation, Director-mode handoff, and generation intelligence from one surface built for speed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
              <MetricCard label="Skills Ready" value={String(BUILT_IN_SKILLS.length)} tone="cyan" />
              <MetricCard label="Recent Jobs" value={String(statusCounts.total)} tone="lime" />
              <MetricCard label="Completed" value={String(statusCounts.completed)} tone="amber" />
              <MetricCard label="Failures" value={String(statusCounts.failed)} tone="rose" />
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[24px] border border-white/10 bg-[#0a0c0f]/85 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Connection Status</p>
                <h2 className="mt-2 text-xl font-semibold text-white [font-family:var(--font-claw-display)]">
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
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#0a0c0f]/85 p-5 md:p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Execution Pulse</p>
            <h3 className="mt-2 text-3xl font-semibold text-white [font-family:var(--font-claw-display)]">{recentJobs.length}</h3>
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
                        <span className="[font-family:var(--font-claw-mono)]">{job.model || "unknown model"}</span>
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
                placeholder="Search skills, triggers, workflows..."
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
              <h2 className="text-sm uppercase tracking-[0.24em]">Featured Workflows</h2>
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
              <h2 className="text-sm uppercase tracking-[0.24em]">All Skills</h2>
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
            No skills match “{search}”. Try a broader keyword.
          </section>
        )}

        <section className="mt-12 rounded-[24px] border border-white/10 bg-gradient-to-r from-white/[0.06] via-white/[0.02] to-white/[0.04] p-6 text-center">
          <Activity className="mx-auto h-7 w-7 text-cyan-200" />
          <h3 className="mt-3 text-xl text-white [font-family:var(--font-claw-display)]">Community skill marketplace is next</h3>
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
      <p className="mt-1 text-xl font-semibold text-white [font-family:var(--font-claw-display)]">{value}</p>
    </div>
  );
}

function SkillCard({ skill, emphasis = false }: { skill: SkillEntry; emphasis?: boolean }) {
  const Icon = CATEGORY_ICONS[skill.category];
  const colorClass = CATEGORY_COLORS[skill.category];

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-[#090b0d]/95 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25",
        emphasis ? "shadow-[0_16px_55px_rgba(46,255,232,0.08)]" : ""
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent opacity-70" />
      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", colorClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <Badge variant="outline" className="border-white/15 bg-white/[0.03] text-[10px] uppercase tracking-[0.16em] text-zinc-400">
            v{skill.version}
          </Badge>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white [font-family:var(--font-claw-display)]">{skill.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{skill.description}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {skill.triggers.slice(0, 2).map((t) => (
            <span key={t} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-400 [font-family:var(--font-claw-mono)]">
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
