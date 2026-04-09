"use client"

import { useEffect } from "react"
import { Layers, Cpu, Fingerprint, Scale } from "lucide-react"

const FEATURES = [
    {
        icon: Layers,
        title: "Remix Engine",
        description: "Build on community creations and iterate with one click. Experience the fluidity of creation without limits.",
        gradient: "from-violet-500/20 to-purple-600/5",
        borderHover: "hover:border-violet-500/30",
        glowColor: "group-hover:shadow-[0_0_40px_rgba(139,92,246,0.12)]",
        iconBg: "bg-violet-500/10 border-violet-500/20 group-hover:bg-violet-500/20",
        iconColor: "text-violet-300",
        col: "lg:col-span-2",
        num: "01",
    },
    {
        icon: Cpu,
        title: "Hybrid Routing",
        description: "Intelligent model selection for optimal quality and speed. Our engine anticipates and adapts to your workflow.",
        gradient: "from-sky-500/20 to-blue-600/5",
        borderHover: "hover:border-sky-500/30",
        glowColor: "group-hover:shadow-[0_0_40px_rgba(14,165,233,0.12)]",
        iconBg: "bg-sky-500/10 border-sky-500/20 group-hover:bg-sky-500/20",
        iconColor: "text-sky-300",
        col: "lg:col-span-1",
        num: "02",
    },
    {
        icon: Fingerprint,
        title: "Ethical Core",
        description: "Consent-based generation anchored by identity-safe practices. Craft fearlessly, security built in.",
        gradient: "from-emerald-500/20 to-teal-600/5",
        borderHover: "hover:border-emerald-500/30",
        glowColor: "group-hover:shadow-[0_0_40px_rgba(16,185,129,0.12)]",
        iconBg: "bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20",
        iconColor: "text-emerald-300",
        col: "lg:col-span-1",
        num: "03",
    },
    {
        icon: Scale,
        title: "Fair Credits",
        description: "Transparent pricing powered by a flexible control system. Generate assets exactly tailored to fit your ultimate vision.",
        gradient: "from-amber-500/20 to-orange-600/5",
        borderHover: "hover:border-amber-500/30",
        glowColor: "group-hover:shadow-[0_0_40px_rgba(245,158,11,0.12)]",
        iconBg: "bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500/20",
        iconColor: "text-amber-300",
        col: "lg:col-span-2",
        num: "04",
    },
]

interface FeaturesStateProps {
    register: (cb: (progress: number, index: number) => void) => () => void
}

export function FeaturesState({ register }: FeaturesStateProps) {
    // Keep register alive so BackgroundSystem knows this section is active
    useEffect(() => {
        const unregister = register(() => {})
        return () => unregister?.()
    }, [register])

    return (
        <section className="md:absolute md:inset-0 relative w-full min-h-[100svh] flex flex-col items-center justify-center bg-transparent px-4 sm:px-6 py-20 md:py-0">

            {/* Label */}
            <div className="mb-8 md:mb-10 flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/30 ring-1 ring-white/10" />
                <span className="uppercase tracking-[0.3em] text-[10px] font-bold text-white/40">
                    The Paradigm
                </span>
            </div>

            {/* Bento grid — offset asymmetric layout */}
            <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-3 lg:h-[62vh]">
                {FEATURES.map((feature) => {
                    const Icon = feature.icon
                    return (
                        <div
                            key={feature.num}
                            className={`
                                group relative flex flex-col justify-between
                                ${feature.col}
                                rounded-2xl border border-white/[0.08] bg-white/[0.03]
                                p-6 overflow-hidden cursor-default
                                transition-all duration-500 ease-out
                                ${feature.borderHover} hover:bg-white/[0.06] ${feature.glowColor}
                            `}
                        >
                            {/* Gradient reveal on hover */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                            />

                            {/* Number label */}
                            <span className="absolute top-5 right-5 text-[10px] font-mono text-white/15 tracking-widest select-none">
                                {feature.num}
                            </span>

                            {/* Icon */}
                            <div className={`relative w-10 h-10 rounded-xl border ${feature.iconBg} flex items-center justify-center transition-all duration-300`}>
                                <Icon className={`w-[18px] h-[18px] ${feature.iconColor}`} strokeWidth={1.5} />
                            </div>

                            {/* Text */}
                            <div className="relative mt-auto pt-8 flex flex-col gap-2">
                                <h3 className="text-lg md:text-xl font-semibold text-white/90 tracking-tight leading-snug">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-white/40 leading-relaxed line-clamp-3 lg:line-clamp-none">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

        </section>
    )
}
