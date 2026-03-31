const APIMART_BASE_URL = "https://api.apimart.ai/v1"

export interface ApiMartRequestOptions {
  method?: "GET" | "POST"
  path: string
  body?: unknown
  language?: string
}

function getApiMartKey(): string {
  const key = process.env.APIMART_API_KEY
  if (!key) {
    throw new Error("APIMART_API_KEY is not configured on the server")
  }
  return key
}

export async function apimartRequest<T>({
  method = "GET",
  path,
  body,
  language,
}: ApiMartRequestOptions): Promise<T> {
  const key = getApiMartKey()
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const url = new URL(`${APIMART_BASE_URL}${normalizedPath}`)

  if (language) {
    url.searchParams.set("language", language)
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === "object" && "message" in data && typeof data.message === "string" && data.message) ||
      (data && typeof data === "object" && "error" in data && typeof data.error === "string" && data.error) ||
      `ApiMart request failed with ${response.status}`

    throw new Error(errorMessage)
  }

  return data as T
}

export interface ApiMartTaskImageResult {
  url: string[]
  expires_at?: number
}

export interface ApiMartTaskVideoResult {
  url: string
  thumbnail_url?: string
  expires_at?: number
}

export interface ApiMartTaskStatusResponse {
  code: number
  data: {
    id: string
    status: "pending" | "processing" | "completed" | "failed" | "cancelled"
    progress?: number
    result?: {
      images?: ApiMartTaskImageResult[]
      videos?: ApiMartTaskVideoResult[]
      thumbnail_url?: string
    }
    error?: {
      code?: number
      message?: string
      type?: string
    }
    created?: number
    completed?: number
    estimated_time?: number
    actual_time?: number
  }
}

export interface ApiMartSubmissionResponse {
  code: number
  data: Array<{
    status: string
    task_id: string
  }>
}

export interface ApiMartDirectImageResponse {
  created: number
  background?: string
  output_format?: string
  data: Array<{
    b64_json?: string
    url?: string
    revised_prompt?: string
  }>
}

export interface ApiMartBalanceResponse {
  success: boolean
  remain_balance: number
  used_balance: number
  unlimited_quota: boolean
  message?: string
}

export async function queryApiMartTokenBalance() {
  return apimartRequest<ApiMartBalanceResponse>({
    path: "/balance",
  })
}

export async function queryApiMartUserBalance() {
  return apimartRequest<ApiMartBalanceResponse>({
    path: "/user/balance",
  })
}

export async function submitApiMartImageGeneration(body: Record<string, unknown>) {
  return apimartRequest<ApiMartSubmissionResponse | ApiMartDirectImageResponse>({
    method: "POST",
    path: "/images/generations",
    body,
  })
}

export async function submitApiMartVideoGeneration(body: Record<string, unknown>) {
  return apimartRequest<ApiMartSubmissionResponse>({
    method: "POST",
    path: "/videos/generations",
    body,
  })
}

export async function queryApiMartTaskStatus(taskId: string, language = "en") {
  return apimartRequest<ApiMartTaskStatusResponse>({
    path: `/tasks/${taskId}`,
    language,
  })
}

export async function remixApiMartVideo(videoId: string, body: Record<string, unknown>) {
  return apimartRequest<ApiMartSubmissionResponse>({
    method: "POST",
    path: `/videos/${videoId}/remix`,
    body,
  })
}
