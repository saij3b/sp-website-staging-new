import { NextResponse } from "next/server"
import { queryApiMartTaskStatus } from "@/lib/apimart"

export const runtime = "edge"

export async function GET(request: Request, context: { params: Promise<{ taskId: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const { taskId } = await context.params
    const language = searchParams.get("language") || "en"
    const result = await queryApiMartTaskStatus(taskId, language)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "ApiMart task query failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
