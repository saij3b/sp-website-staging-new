import { NextResponse } from "next/server"
import { remixApiMartVideo } from "@/lib/apimart"

export const runtime = "edge"

export async function POST(request: Request, context: { params: Promise<{ videoId: string }> }) {
  try {
    const payload = await request.json()
    const { videoId } = await context.params
    const result = await remixApiMartVideo(videoId, payload)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "ApiMart video remix failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
