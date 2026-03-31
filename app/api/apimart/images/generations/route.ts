import { NextResponse } from "next/server"
import { submitApiMartImageGeneration } from "@/lib/apimart"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const result = await submitApiMartImageGeneration(payload)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "ApiMart image generation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
