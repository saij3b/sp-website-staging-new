"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Loader2, Plus, Pause, Play, Trash2, Clock, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebaseClient";
import { collection, query, where, onSnapshot, type DocumentData } from "firebase/firestore";

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

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "claw_scheduled_jobs"),
      where("firebaseUID", "==", user.uid),
      where("status", "in", ["active", "paused"])
    );

    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ jobId: d.id, ...d.data() } as ScheduledJob)));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#050508] px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-violet-400" />
              Scheduled Jobs
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Automated generations running in the background
            </p>
          </div>
          <div className="text-xs text-neutral-500 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2">
            Create via bot: /schedule every 1h generate...
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.jobId} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: ScheduledJob }) {
  const scheduleLabel = () => {
    if (job.schedule.type === "once") return `Once at ${new Date(job.schedule.at!).toLocaleString()}`;
    if (job.schedule.type === "interval") return `Every ${job.schedule.every}`;
    return `Cron: ${job.schedule.cron} (${job.schedule.timezone ?? "UTC"})`;
  };

  const prompt = job.args["prompt"] ?? job.skillName;
  const isActive = job.status === "active";

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className={
              isActive
                ? "border-green-500/30 text-green-400 bg-green-500/10"
                : "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
            }
          >
            {isActive ? "Active" : "Paused"}
          </Badge>
          <span className="text-xs text-neutral-500 font-mono">{job.jobId.slice(0, 8)}</span>
        </div>

        <p className="text-white text-sm font-medium truncate">&ldquo;{prompt}&rdquo;</p>

        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {scheduleLabel()}
          </span>
          {job.lastRunAt && (
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Last: {new Date(job.lastRunAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-xs text-neutral-600 text-right">
          <p>skill: {job.skillName}</p>
          {job.retryCount > 0 && <p className="text-yellow-600">retries: {job.retryCount}</p>}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
        <Clock className="w-7 h-7 text-violet-400" />
      </div>
      <h2 className="text-white font-medium mb-2">No scheduled jobs yet</h2>
      <p className="text-neutral-500 text-sm mb-6 max-w-sm mx-auto">
        Create automated generations that run on a schedule — daily product shots, weekly content, and more.
      </p>
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left inline-block max-w-sm">
        <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Examples</p>
        <div className="space-y-1.5 text-sm text-neutral-300 font-mono">
          <p>/schedule every 1h generate a sunset</p>
          <p>/schedule every monday 9am generate product shots</p>
          <p>/schedule daily at noon generate my post</p>
        </div>
      </div>
    </div>
  );
}
