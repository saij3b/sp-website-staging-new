"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Loader2, CheckCircle2, XCircle, Bot, Link2, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

export default function ClawPairPage() {
  return (
    <ProtectedRoute>
      <PairContent />
    </ProtectedRoute>
  );
}

type Step = "enter" | "loading" | "success" | "error";

function PairContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code")?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "");
  const [step, setStep] = useState<Step>("enter");
  const [errorMsg, setErrorMsg] = useState("");
  const [channelInfo, setChannelInfo] = useState<{ channelType: string; channelUserId: string } | null>(null);
  const telegramBotUrl = useMemo(() => "https://t.me/StudioXCbot", []);

  useEffect(() => {
    const queryCode = searchParams.get("code");
    if (!queryCode) return;
    const normalized = queryCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (normalized.length > 0) setCode(normalized);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || code.length < 6) return;

    setStep("loading");
    setErrorMsg("");

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/claw/pairing/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string; channelType?: string; channelUserId?: string };

      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? "Invalid or expired code. Please generate a new one.");
        setStep("error");
        return;
      }

      setChannelInfo({ channelType: data.channelType ?? "telegram", channelUserId: data.channelUserId ?? "" });
      setStep("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStep("error");
    }
  };

  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-[#040506] px-4 py-10 md:py-14", displayFont.variable, monoFont.variable)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-140px] h-[360px] w-[620px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute right-[-100px] top-[260px] h-[320px] w-[320px] rounded-full bg-lime-400/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px] opacity-[0.08]" />
      </div>

      <div className="relative mx-auto grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[24px] border border-white/12 bg-white/[0.03] p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100">
            <Link2 className="h-3.5 w-3.5" />
            Claw Pairing
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl [font-family:var(--font-claw-display)]">
            Link chat identity to StudioX in under ten seconds
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Pair once and route creations between web and Telegram instantly, with secure account binding.
          </p>

          <div className="mt-7 space-y-3">
            {[
              "Open Telegram bot",
              "Run /pair to receive your code",
              "Enter code here to activate shared context",
            ].map((item, idx) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-300/10 text-xs font-semibold text-cyan-100">
                  {idx + 1}
                </span>
                <p className="text-sm text-zinc-200">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
            <p className="inline-flex items-center gap-2 text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Your code is short-lived and tied to your account token.
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/12 bg-[#090c10]/90 p-6 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          {step === "enter" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-500">Pairing Code</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="ABC123"
                  maxLength={6}
                  className={cn(
                    "h-14 rounded-xl border-white/15 bg-white/[0.03] text-center text-2xl text-white placeholder:text-zinc-600",
                    "tracking-[0.34em] [font-family:var(--font-claw-mono)]"
                  )}
                  autoFocus
                />
                <p className="mt-2 text-xs text-zinc-500">Use /pair in Telegram bot to generate code.</p>
              </div>

              <Button type="button" variant="outline" asChild className="h-10 w-full rounded-xl border-white/15 bg-white/[0.02] text-zinc-200 hover:bg-white/[0.08]">
                <a href={telegramBotUrl} target="_blank" rel="noreferrer">
                  <Bot className="mr-2 h-4 w-4" />
                  Open Telegram Bot
                </a>
              </Button>

              <Button type="submit" disabled={code.length < 6} className="h-11 w-full rounded-xl bg-cyan-300 text-black hover:bg-cyan-200">
                Link Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
              <p className="text-sm text-zinc-300">Verifying secure pairing...</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-300" />
              <div className="text-center">
                <p className="text-lg text-white [font-family:var(--font-claw-display)]">Account linked successfully</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Connected to <span className="capitalize text-cyan-100">{channelInfo?.channelType ?? "chat"}</span>.
                </p>
              </div>
              <div className="mt-1 flex w-full flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline" className="flex-1 rounded-xl border-white/15 bg-white/[0.02] text-zinc-200 hover:bg-white/[0.08]">
                  <a href={telegramBotUrl} target="_blank" rel="noreferrer">Return to Telegram</a>
                </Button>
                <Button onClick={() => router.push("/studio")} className="flex-1 rounded-xl bg-cyan-300 text-black hover:bg-cyan-200">
                  Open Studio
                </Button>
              </div>
              <Button onClick={() => { setCode(""); setStep("enter"); }} variant="ghost" className="text-zinc-400 hover:text-white">
                Link another channel
              </Button>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-3">
              <XCircle className="h-12 w-12 text-rose-300" />
              <div className="text-center">
                <p className="text-lg text-white [font-family:var(--font-claw-display)]">Pairing failed</p>
                <p className="mt-1 text-sm text-zinc-400">{errorMsg}</p>
              </div>
              <Button onClick={() => { setStep("enter"); setErrorMsg(""); }} className="w-full rounded-xl bg-cyan-300 text-black hover:bg-cyan-200">
                Try again
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
