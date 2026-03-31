import { NextResponse } from "next/server"
import { submitApiMartVideoGeneration } from "@/lib/apimart"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const result = await submitApiMartVideoGeneration(payload)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "ApiMart video generation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
