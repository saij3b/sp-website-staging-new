"use client"

import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseClient"
import type { CommunityCampaignMeta } from "@/lib/types"

export interface PersistedStudioGeneration {
  id: string
  creationId: string
  taskId?: string | null
  prompt: string
  model?: string
  type: "image" | "video"
  outputUrl: string
  outputUrls?: string[]
  thumbnailUrl?: string | null
  generationPlatform?: string
  rootCreationId?: string | null
  parentCreationId?: string | null
  remixDepth?: number
  sourcePostId?: string | null
  campaign?: CommunityCampaignMeta | null
}

function readLocalStudioGenerationHistory(): PersistedStudioGeneration[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem("studio_generations_history")
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const mapped: PersistedStudioGeneration[] = []

    for (const item of parsed) {
      const outputUrl = typeof item?.src === "string" ? item.src : ""
      if (!outputUrl) continue

      mapped.push({
        id: String(item.id || item.creationId || item.taskId || outputUrl),
        creationId: String(item.creationId || item.taskId || item.id || outputUrl),
        taskId: item.taskId || null,
        prompt: item.prompt || "Untitled Creation",
        model: item.model,
        type: item.type === "video" ? "video" : "image",
        outputUrl,
        outputUrls: Array.isArray(item.srcs) ? item.srcs : undefined,
        thumbnailUrl: item.thumbnailUrl || null,
        generationPlatform: item.generationPlatform || item.settings?.provider,
        rootCreationId: item.settings?.rootCreationId || item.settings?.originalCreationId || null,
        parentCreationId: item.settings?.parentCreationId || null,
        remixDepth: Number(item.settings?.remixDepth || 0),
        sourcePostId: item.settings?.sourcePostId || null,
        campaign: item.settings?.campaign || null,
      })
    }

    return mapped
  } catch (error) {
    console.warn("Failed to read local studio generation history.", error)
    return []
  }
}

export async function persistStudioGeneration(uid: string, input: PersistedStudioGeneration) {
  const ref = doc(db, "users", uid, "studioGenerations", input.id)
  const now = Date.now()

  await setDoc(
    ref,
    {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAtMs: now,
      updatedAtMs: now,
      source: "studiox-web",
    },
    { merge: true }
  )
}

export async function listPersistedStudioGenerations(uid: string) {
  try {
    const snapshot = await getDocs(query(collection(db, "users", uid, "studioGenerations"), orderBy("createdAtMs", "desc")))
    const remoteItems = snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Record<string, unknown>),
    })) as PersistedStudioGeneration[]

    if (remoteItems.length > 0) {
      return remoteItems
    }
  } catch (error) {
    console.warn("Persisted studio generations query failed, falling back to local history.", error)
  }

  return readLocalStudioGenerationHistory()
}

export async function deletePersistedStudioGeneration(uid: string, generationId: string) {
  await deleteDoc(doc(db, "users", uid, "studioGenerations", generationId))
}
