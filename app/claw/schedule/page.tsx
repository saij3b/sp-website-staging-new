"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Loader2,
  Clock,
  Calendar,
  RefreshCw,
  Sparkles,
  Activity,
  AlertTriangle,
  Image as ImageIcon,
  Video,
  Wand2,
  SlidersHorizontal,
  PauseCircle,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebaseClient";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface ScheduledJob {
  jobId: string;
  skillName: string;
  args: Record<string, string>;
  schedule: { type: "once" | "interval" | "cron"; at?: string; every?: string; cron?: string; timezone?: string };
  status: "active" | "paused" | "cancelled" | "permanently_failed";
  retryCount: number;
  createdAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <ScheduleContent />
    </ProtectedRoute>
  );
}

function ScheduleContent() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "retry">("all");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "claw_scheduled_jobs"),
      where("firebaseUID", "==", user.uid),
      where("status", "in", ["active", "paused", "cancelled", "permanently_failed"])
    );

    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ jobId: d.id, ...d.data() } as ScheduledJob)));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const stats = useMemo(() => {
    const active = jobs.filter((job) => job.status === "active").length;
    const paused = jobs.filter((job) => job.status === "paused").length;
    const completed = jobs.filter((job) => job.lastRunAt && job.status === "active").length;
    const retries = jobs.reduce((acc, job) => acc + (job.retryCount || 0), 0);
    return { active, paused, completed, retries };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") return jobs;
    if (statusFilter === "retry") return jobs.filter((job) => (job.retryCount || 0) > 0);
    return jobs.filter((job) => job.status === statusFilter);
  }, [jobs, statusFilter]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040506] px-4 pt-36 pb-12 md:pt-44 md:pb-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-160px] h-[360px] w-[620px] -translate-x-1/2 rounded-full bg-cyan-500/14 blur-[140px]" />
        <div className="absolute left-[-140px] bottom-[-140px] h-[320px] w-[320px] rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px] opacity-[0.08]" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <section className="rounded-[24px] border border-white/12 bg-white/[0.03] p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                <Clock className="h-3.5 w-3.5" />
                Claw Scheduler
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl ">Automation timeline</h1>
              <p className="mt-2 text-sm text-zinc-300">Monitor recurring chat jobs and keep your generation cadence reliable.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
              <StatChip label="Active" value={String(stats.active)} tone="emerald" />
              <StatChip label="Paused" value={String(stats.paused)} tone="amber" />
              <StatChip label="Completed" value={String(stats.completed)} tone="cyan" />
              <StatChip label="Retries" value={String(stats.retries)} tone="rose" />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-white/10 bg-[#0a0c0f]/90 p-5 md:p-6">
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs text-zinc-400 font-mono">
            Create jobs from Telegram using: <span className="text-zinc-200">/schedule every 1h generate ...</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </span>
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "paused", label: "Paused" },
              { id: "retry", label: "High Retry" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id as "all" | "active" | "paused" | "retry")}
                className={cn(
                  "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] transition-all",
                  statusFilter === item.id
                    ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                    : "border-white/12 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="relative mt-5 space-y-3 pl-6 before:absolute before:left-2.5 before:top-0 before:h-full before:w-px before:bg-white/10">
              {filteredJobs.map((job) => (
                <JobCard key={job.jobId} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatChip({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" | "rose" | "cyan" }) {
  const toneClass = {
    emerald: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
    amber: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    rose: "border-rose-300/30 bg-rose-300/10 text-rose-100",
    cyan: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  }[tone];

  return (
    <div className={cn("rounded-xl border px-3 py-2", toneClass)}>
      <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white ">{value}</p>
    </div>
  );
}

function JobCard({ job }: { job: ScheduledJob }) {
  const scheduleLabel = () => {
    if (job.schedule.type === "once") return `Once at ${new Date(job.schedule.at || "").toLocaleString()}`;
    if (job.schedule.type === "interval") return `Every ${job.schedule.every}`;
    return `Cron: ${job.schedule.cron} (${job.schedule.timezone ?? "UTC"})`;
  };

  const prompt = job.args["prompt"] ?? job.skillName;
  const isActive = job.status === "active";
  const hasRetry = (job.retryCount || 0) > 0;
  const icon = job.skillName.includes("video")
    ? Video
    : job.skillName.includes("template")
      ? Wand2
      : job.skillName.includes("image")
        ? ImageIcon
        : Sparkles;
  const Icon = icon;

  return (
    <article className="relative rounded-2xl border border-white/10 bg-black/30 px-4 py-3 transition-all duration-300 hover:border-white/20">
      <span className={cn(
        "absolute -left-[22px] top-5 z-10 h-3 w-3 rounded-full border",
        isActive
          ? "border-emerald-300/40 bg-emerald-300/20"
          : "border-amber-300/40 bg-amber-300/20"
      )} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05]">
              <Icon className="h-3.5 w-3.5 text-zinc-200" />
            </span>
            <Badge
              variant="outline"
              className={
                isActive
                  ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                  : "border-amber-300/30 bg-amber-300/10 text-amber-100"
              }
            >
              {isActive ? "Active" : "Paused"}
            </Badge>
            {hasRetry ? (
              <Badge variant="outline" className="border-rose-300/30 bg-rose-300/10 text-rose-100">
                Retry {job.retryCount}
              </Badge>
            ) : null}
            <span className="text-[11px] text-zinc-500 font-mono">{job.jobId.slice(0, 10)}</span>
          </div>

          <p className="truncate text-sm text-white">“{prompt}”</p>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {scheduleLabel()}
            </span>
            {job.lastRunAt && (
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Last run: {new Date(job.lastRunAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="text-right text-xs text-zinc-500">
          <p className="font-mono">skill: {job.skillName}</p>
          {isActive ? (
            <p className="mt-1 inline-flex items-center gap-1 text-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              Running
            </p>
          ) : (
            <p className="mt-1 inline-flex items-center gap-1 text-amber-200">
              <PauseCircle className="h-3 w-3" />
              Paused
            </p>
          )}
          {job.retryCount > 0 ? (
            <p className="mt-1 inline-flex items-center gap-1 text-amber-200">
              <TriangleAlert className="h-3 w-3" />
              retries: {job.retryCount}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10">
        <Sparkles className="h-6 w-6 text-cyan-100" />
      </div>
      <h2 className="mt-4 text-xl text-white ">No scheduled jobs yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
        Set up recurring generations from Telegram and monitor all automation in this timeline.
      </p>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
        {[
          {
            title: "Hourly Product Shots",
            desc: "Every 1h generate clean product rotations",
            cmd: "/schedule every 1h generate product hero shot",
          },
          {
            title: "Daily Social Variant",
            desc: "Every day create one social-ready variant",
            cmd: "/schedule daily at noon generate social ad variant",
          },
          {
            title: "Weekly Campaign Kit",
            desc: "Every Monday generate campaign starter pack",
            cmd: "/schedule every monday 9am generate campaign hero set",
          },
        ].map((template) => (
          <div key={template.title} className="rounded-2xl border border-white/10 bg-black/30 p-3 text-left">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">Template</p>
            <p className="mt-1 text-sm font-medium text-white">{template.title}</p>
            <p className="mt-1 text-xs text-zinc-400">{template.desc}</p>
            <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-300">{template.cmd}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-white/10 bg-black/25 p-4 text-left text-xs text-zinc-300 font-mono">
        <p className="mb-2 inline-flex items-center gap-2 text-zinc-400">
          <Activity className="h-3.5 w-3.5" />
          Example commands
        </p>
        <p>/schedule every 1h generate a product closeup</p>
        <p>/schedule every monday 9am generate weekly hero images</p>
        <p>/schedule daily at noon generate campaign variant</p>
        <p className="mt-2 inline-flex items-center gap-1 text-amber-200">
          <AlertTriangle className="h-3.5 w-3.5" />
          Use concise prompts for stable recurring output.
        </p>
      </div>
    </div>
  );
}
