"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Loader2, CheckCircle2, XCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("enter");
  const [errorMsg, setErrorMsg] = useState("");
  const [channelInfo, setChannelInfo] = useState<{ channelType: string; channelUserId: string } | null>(null);

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
    <div className="min-h-screen bg-[#050508] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
            <span className="text-3xl">🦞</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link StudioX Claw</h1>
          <p className="text-neutral-400 text-sm">
            Enter the 6-digit code from your Telegram/Discord bot to connect your account.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          {step === "enter" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Pairing Code</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="ABC123"
                  maxLength={6}
                  className={cn(
                    "text-center text-xl font-mono tracking-[0.3em] bg-white/[0.03] border-white/10",
                    "text-white placeholder:text-neutral-600 h-12"
                  )}
                  autoFocus
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Type /pair in your Telegram bot to get a code
                </p>
              </div>
              <Button
                type="submit"
                disabled={code.length < 6}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white"
              >
                Link Account
              </Button>
            </form>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-neutral-300 text-sm">Verifying code...</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <div className="text-center">
                <p className="text-white font-medium mb-1">Account linked!</p>
                <p className="text-neutral-400 text-sm">
                  Your StudioX account is now connected to{" "}
                  <span className="text-violet-400 capitalize">{channelInfo?.channelType ?? "chat"}</span>.
                </p>
                <p className="text-neutral-500 text-xs mt-2">
                  Go back to your bot and start creating 🎨
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <Button
                  onClick={() => router.push("/studio")}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
                >
                  Open Studio
                </Button>
                <Button
                  onClick={() => { setCode(""); setStep("enter"); }}
                  variant="outline"
                  className="flex-1 border-white/10 text-neutral-300 hover:text-white hover:bg-white/5"
                >
                  Link Another
                </Button>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <XCircle className="w-12 h-12 text-red-400" />
              <div className="text-center">
                <p className="text-white font-medium mb-1">Pairing failed</p>
                <p className="text-neutral-400 text-sm">{errorMsg}</p>
              </div>
              <Button
                onClick={() => { setStep("enter"); setErrorMsg(""); }}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* How it works */}
        {step === "enter" && (
          <div className="mt-6 space-y-3">
            <p className="text-xs text-neutral-500 text-center uppercase tracking-wider">How it works</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: "1", label: "Open your bot", desc: "Telegram, Discord, or Slack" },
                { step: "2", label: "Type /pair", desc: "Get a 6-digit code" },
                { step: "3", label: "Enter code here", desc: "Your account is linked" },
              ].map((item) => (
                <div key={item.step} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center mx-auto mb-2">
                    {item.step}
                  </div>
                  <p className="text-white text-xs font-medium">{item.label}</p>
                  <p className="text-neutral-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supported channels */}
        {step === "enter" && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <Bot className="w-4 h-4 text-neutral-600" />
            <span className="text-xs text-neutral-600">
              Works with Telegram · Discord · Slack · WhatsApp
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
