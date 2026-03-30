"use client";

import { useState } from "react";
import { Search, Download, Star, Zap, Image, Video, Wand2, LayoutGrid, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  image: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  video: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  template: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  utility: "text-green-400 bg-green-500/10 border-green-500/20",
};

type Category = "all" | "image" | "video" | "template" | "utility";

export default function ClawHubPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered = BUILT_IN_SKILLS.filter((skill) => {
    const matchesSearch =
      !search ||
      skill.name.includes(search.toLowerCase()) ||
      skill.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || skill.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featured = filtered.filter((s) => s.featured);
  const rest = filtered.filter((s) => !s.featured);

  return (
    <div className="min-h-screen bg-[#050508] px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-400 text-sm mb-4">
            <LayoutGrid className="w-4 h-4" />
            ClawHub
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Skills Marketplace</h1>
          <p className="text-neutral-400 max-w-lg mx-auto">
            Extend StudioX Claw with skills. Each skill adds new commands to your bot.
            Install with one click — available instantly in chat.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-neutral-600"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["all", "image", "video", "template", "utility"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-colors",
                  activeCategory === cat
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm text-neutral-500 uppercase tracking-wider mb-4">Featured</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((skill) => (
                <SkillCard key={skill.name} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {/* All */}
        {rest.length > 0 && (
          <div>
            <h2 className="text-sm text-neutral-500 uppercase tracking-wider mb-4">All Skills</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((skill) => (
                <SkillCard key={skill.name} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-neutral-500">
            No skills match &ldquo;{search}&rdquo;
          </div>
        )}

        {/* Coming soon */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white/[0.02] border border-white/5 rounded-2xl px-8 py-6">
            <Tag className="w-8 h-8 text-violet-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-2">Community Skills Coming Soon</h3>
            <p className="text-neutral-500 text-sm max-w-sm">
              Create and publish your own skills. Earn credits when others install them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillCard({ skill }: { skill: SkillEntry }) {
  const Icon = CATEGORY_ICONS[skill.category];
  const colorClass = CATEGORY_COLORS[skill.category];

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/[0.05] transition-colors">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center", colorClass)}>
          <Icon className="w-4 h-4" />
        </div>
        <Badge
          variant="outline"
          className="border-white/10 text-neutral-500 text-xs"
        >
          v{skill.version}
        </Badge>
      </div>

      {/* Name + description */}
      <div>
        <h3 className="text-white font-medium text-sm mb-1">{skill.name}</h3>
        <p className="text-neutral-500 text-xs leading-relaxed">{skill.description}</p>
      </div>

      {/* Triggers */}
      <div className="flex flex-wrap gap-1">
        {skill.triggers.slice(0, 2).map((t) => (
          <span key={t} className="text-xs bg-white/[0.04] text-neutral-500 rounded-md px-2 py-0.5 font-mono">
            {t}
          </span>
        ))}
        {skill.triggers.length > 2 && (
          <span className="text-xs text-neutral-600">+{skill.triggers.length - 2}</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-white/5">
        <div className="flex items-center gap-3 text-xs text-neutral-600">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {skill.stars.toLocaleString()}
          </span>
          <span>{skill.costEstimate === "0" ? "Free" : `~${skill.costEstimate} cr`}</span>
        </div>
        <Button
          size="sm"
          disabled={skill.installed}
          className={cn(
            "h-7 text-xs px-3",
            skill.installed
              ? "bg-green-500/10 text-green-400 border border-green-500/20 cursor-default"
              : "bg-violet-600 hover:bg-violet-500 text-white"
          )}
        >
          {skill.installed ? (
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" /> Installed
            </span>
          ) : (
            "Install"
          )}
        </Button>
      </div>
    </div>
  );
}
