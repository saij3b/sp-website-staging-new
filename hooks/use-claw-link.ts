"use client"

import { useEffect, useState } from "react"
import { collection, limit, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebaseClient"
import { useAuth } from "@/context/auth-context"

export interface ClawLinkRecord {
  id: string
  channelType: string
  channelUserId: string
  chatId: string
  linkedAt?: string
}

export function useClawLink() {
  const { user } = useAuth()
  const [link, setLink] = useState<ClawLinkRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setLink(null)
      setLoading(false)
      return
    }

    const q = query(collection(db, "claw_user_links"), where("firebaseUID", "==", user.uid), limit(1))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const record = snapshot.docs[0]
        if (!record) {
          setLink(null)
          setLoading(false)
          return
        }

        const data = record.data() as Record<string, any>
        setLink({
          id: record.id,
          channelType: data.channelType || "telegram",
          channelUserId: data.channelUserId || "",
          chatId: data.chatId || "",
          linkedAt: data.linkedAt,
        })
        setLoading(false)
      },
      () => {
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  return {
    link,
    isLinked: Boolean(link),
    loading,
  }
}
