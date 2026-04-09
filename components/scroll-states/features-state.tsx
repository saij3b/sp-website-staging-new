"use client"

import { useEffect, useRef } from "react"
import { Layers, Cpu, Fingerprint, Scale } from "lucide-react"
import Image from "next/image"
import { ASSET_BASE } from "@/lib/assets"

const IMAGES = [
    { src: `${ASSET_BASE}/capabilities/capabilities1.png`, top: "-10%", left: "8%", size: "16rem", rotate: -4, blur: 0, z: 20, depth: 1.2 },
    { src: `${ASSET_BASE}/capabilities/capabilities2.png`, top: "5%", left: "78%", size: "20rem", rotate: 6, blur: 4, z: 5, depth: 0.6 },
    { src: `${ASSET_BASE}/capabilities/capabilities3.png`, top: "45%", left: "-5%", size: "22rem", rotate: 2, blur: 0, z: 30, depth: 1.5 },
    { src: `${ASSET_BASE}/capabilities/capabilities4.png`, top: "60%", left: "85%", size: "14rem", rotate: -8, blur: 1, z: 25, depth: 1.3 },
    { src: `${ASSET_BASE}/capabilities/capabilities5.png`, top: "20%", left: "22%", size: "10rem", rotate: 12, blur: 6, z: 2, depth: 0.4 },
    { src: `${ASSET_BASE}/capabilities/capabilities6.png`, top: "30%", left: "88%", size: "18rem", rotate: -3, blur: 2, z: 15, depth: 0.9 },
    { src: `${ASSET_BASE}/capabilities/capabilities7.png`, top: "75%", left: "12%", size: "12rem", rotate: -15, blur: 5, z: 4, depth: 0.5 },
    { src: `${ASSET_BASE}/capabilities/capabilities8.png`, top: "85%", left: "42%", size: "18rem", rotate: 5, blur: 0, z: 22, depth: 1.1 },
    { src: `${ASSET_BASE}/capabilities/capabilities9.png`, top: "-5%", left: "45%", size: "14rem", rotate: -6, blur: 0, z: 18, depth: 1.0 },
    { src: `${ASSET_BASE}/capabilities/capabilities10.png`, top: "95%", left: "75%", size: "11rem", rotate: 18, blur: 8, z: 1, depth: 0.3 },
    { src: `${ASSET_BASE}/capabilities/capabilities11.png`, top: "35%", left: "10%", size: "11rem", rotate: 4, blur: 3, z: 12, depth: 0.8 },
    { src: `${ASSET_BASE}/capabilities/capabilities12.png`, top: "15%", left: "55%", size: "9rem", rotate: -10, blur: 7, z: 0, depth: 0.2 },
    { src: `${ASSET_BASE}/capabilities/capabilities13.png`, top: "80%", left: "95%", size: "15rem", rotate: -5, blur: 2, z: 16, depth: 0.9 },
    { src: `${ASSET_BASE}/capabilities/capabilities14.png`, top: "50%", left: "70%", size: "13rem", rotate: 8, blur: 4, z: 6, depth: 0.7 },
]

const FEATURES = [
    {
        icon: Layers,
        title: "Remix Engine",
        description: "Build on community creations and iterate with one click. Experience the fluidity of creation without limits.",
        col: "lg:col-span-2",
        num: "01",
    },
    {
        icon: Cpu,
        title: "Hybrid Routing",
        description: "Intelligent model selection for optimal quality and speed. Our engine anticipates and adapts to your workflow.",
        col: "lg:col-span-1",
        num: "02",
    },
    {
        icon: Fingerprint,
        title: "Ethical Core",
        description: "Consent-based generation anchored by identity-safe practices. Craft fearlessly, security built in.",
        col: "lg:col-span-1",
        num: "03",
    },
    {
        icon: Scale,
        title: "Fair Credits",
        description: "Transparent pricing powered by a flexible control system. Generate assets exactly tailored to fit your vision.",
        col: "lg:col-span-2",
        num: "04",
    },
]

interface FeaturesStateProps {
    register: (cb: (progress: number, index: number) => void) => () => void
}

export function FeaturesState({ register }: FeaturesStateProps) {
    const imageEls = useRef<(HTMLDivElement | null)[]>([])
    const mouseRef = useRef({ x: 0.5, y: 0.5 })
    const currentRef = useRef({ x: 0.5, y: 0.5 })
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        const unregister = register(() => {})
        return () => unregister?.()
    }, [register])

    // Mouse parallax loop — each image moves by its own depth factor
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = {
                x: e.clientX / window.innerWidth,
                y: e.clientY / window.innerHeight,
            }
        }

        window.addEventListener("mousemove", handleMouseMove)

        const loop = () => {
            currentRef.current.x += (mouseRef.current.x - currentRef.current.x) * 0.06
            currentRef.current.y += (mouseRef.current.y - currentRef.current.y) * 0.06

            const dx = (currentRef.current.x - 0.5) * -40
            const dy = (currentRef.current.y - 0.5) * -30

            imageEls.current.forEach((el, i) => {
                if (!el) return
                const depth = IMAGES[i].depth
                el.style.transform = `rotate(${IMAGES[i].rotate}deg) translate(${dx * depth}px, ${dy * depth}px)`
            })

            rafRef.current = requestAnimationFrame(loop)
        }
        loop()

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    return (
        <section className="md:absolute md:inset-0 relative w-full h-auto min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-white origin-center no-scrollbar">

            {/* Background layer: noise + floating capability images */}
            <div className="absolute inset-0 z-0 pointer-events-none w-full h-full overflow-hidden">
                {/* Noise overlay */}
                <div
                    className="absolute inset-0 opacity-[0.015] mix-blend-multiply z-10"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />

                {/* Floating images — each moved independently by mouse depth */}
                <div className="absolute inset-0 w-full h-full origin-center scale-[0.6] sm:scale-[0.8] md:scale-100 pointer-events-none">
                    {IMAGES.map((img, i) => (
                        <div
                            key={i}
                            ref={(el) => { imageEls.current[i] = el }}
                            className="absolute will-change-transform"
                            style={{
                                top: img.top,
                                left: img.left,
                                width: img.size,
                                height: img.size,
                                zIndex: img.z,
                                // base rotation set inline; parallax will override via style.transform
                                transform: `rotate(${img.rotate}deg)`,
                                filter: img.blur > 0 ? `blur(${img.blur}px)` : "drop-shadow(0 30px 40px rgba(0,0,0,0.06)) drop-shadow(0 15px 20px rgba(0,0,0,0.03))",
                            }}
                        >
                            <Image
                                src={img.src}
                                alt={`Capability visual ${i}`}
                                fill
                                sizes="(max-width: 768px) 40vw, 25vw"
                                priority={i < 5}
                                className="object-cover"
                                style={{
                                    borderRadius: "2.5rem",
                                    border: "1px solid rgba(0,0,0,0.05)",
                                    WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* White glass card — uses padding-based sizing to adapt to any viewport */}
            <div className="relative z-30 w-[95%] md:w-[90%] max-w-6xl rounded-[3.5rem] bg-white/30 backdrop-blur-[30px] md:backdrop-blur-[80px] border border-white/60 shadow-xl md:shadow-[0_8px_32px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(255,255,255,0.4)] flex flex-col items-center text-center overflow-hidden p-5 md:p-6 py-6 md:py-8">

                {/* Inner ring */}
                <div className="absolute inset-0 rounded-[3.5rem] ring-1 ring-inset ring-white/50 pointer-events-none z-10" />

                {/* THE PARADIGM label */}
                <div className="relative z-20 pb-5 md:pb-6 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.3)] ring-1 ring-zinc-950/20" />
                    <span className="uppercase tracking-[0.3em] text-[10px] font-bold text-zinc-600">
                        The Paradigm
                    </span>
                </div>

                {/* Bento grid */}
                <div className="relative z-20 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {FEATURES.map((feature) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={feature.num}
                                className={`
                                    group relative ${feature.col}
                                    flex flex-col items-start justify-between text-left
                                    rounded-[2rem] bg-white/40 backdrop-blur-sm
                                    border border-white/60
                                    p-5 md:p-6
                                    shadow-[0_4px_20px_rgba(0,0,0,0.03)]
                                    transition-all duration-500 ease-out
                                    hover:bg-white/60 hover:border-white/80 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]
                                    hover:-translate-y-0.5
                                    overflow-hidden
                                    min-h-[160px] md:min-h-[180px]
                                `}
                            >
                                {/* Number label */}
                                <span className="absolute top-4 right-5 text-[10px] font-mono text-zinc-400 tracking-widest select-none">
                                    {feature.num}
                                </span>

                                {/* Icon box */}
                                <div className="p-2.5 bg-white shadow-[0_8px_16px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)] rounded-[1.1rem] text-zinc-950 border border-zinc-100/50 transition-transform duration-500 group-hover:scale-105">
                                    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                                </div>

                                {/* Title + description */}
                                <div className="mt-auto pt-4 flex flex-col gap-1.5">
                                    <h3 className="text-lg md:text-xl font-sans font-semibold tracking-[-0.02em] text-zinc-950 leading-tight">
                                        {feature.title}
                                    </h3>
                                    <p className="text-xs md:text-sm text-zinc-500 font-medium leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

        </section>
    )
}
