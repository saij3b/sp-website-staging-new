import type { CommunityPost } from "@/lib/types"

export interface CommunityGraphStats {
  totalNodes: number
  siblingCount: number
  directChildCount: number
  maxDepth: number
  depthBreakdown: Array<{ depth: number; count: number }>
  platformBreakdown: Array<{ platform: string; count: number }>
}

export function dedupeCommunityPosts(posts: Array<CommunityPost | null | undefined>): CommunityPost[] {
  const seen = new Map<string, CommunityPost>()
  for (const post of posts) {
    if (!post) continue
    seen.set(post.id, post)
  }
  return Array.from(seen.values())
}

export function buildLineageChain(current: CommunityPost, parent?: CommunityPost | null, root?: CommunityPost | null): CommunityPost[] {
  return dedupeCommunityPosts([root, parent, current])
}

export function buildCommunityGraphStats(input: {
  current: CommunityPost
  graphPosts: CommunityPost[]
  siblingPosts: CommunityPost[]
  childPosts: CommunityPost[]
}): CommunityGraphStats {
  const allPosts = dedupeCommunityPosts([input.current, ...input.graphPosts])
  const platformCounts = new Map<string, number>()
  const depthCounts = new Map<number, number>()

  for (const post of allPosts) {
    const platform = (post.generationPlatform || "unknown").toUpperCase()
    platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1)
    const depth = post.remixDepth || 0
    depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1)
  }

  return {
    totalNodes: allPosts.length,
    siblingCount: input.siblingPosts.length,
    directChildCount: input.childPosts.length,
    maxDepth: allPosts.reduce((max, post) => Math.max(max, post.remixDepth || 0), 0),
    depthBreakdown: Array.from(depthCounts.entries())
      .map(([depth, count]) => ({ depth, count }))
      .sort((a, b) => a.depth - b.depth),
    platformBreakdown: Array.from(platformCounts.entries())
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count),
  }
}
