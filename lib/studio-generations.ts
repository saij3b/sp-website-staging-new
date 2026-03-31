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
  const snapshot = await getDocs(query(collection(db, "users", uid, "studioGenerations"), orderBy("createdAtMs", "desc")))
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Record<string, unknown>),
  }))
}

export async function deletePersistedStudioGeneration(uid: string, generationId: string) {
  await deleteDoc(doc(db, "users", uid, "studioGenerations", generationId))
}
