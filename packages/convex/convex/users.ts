import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get current user's profile
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    return await ctx.db.get(userId)
  },
})

// Get user by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()

    if (!user || !user.settings.publicProfile) return null

    return {
      _id: user._id,
      _creationTime: user._creationTime,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      stats: user.stats,
      badges: user.badges,
      createdAt: user.createdAt,
    }
  },
})

// Update user profile
export const update = mutation({
  args: {
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    settings: v.optional(
      v.object({
        darkMode: v.boolean(),
        dyslexiaFont: v.boolean(),
        publicProfile: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, { bio, avatarUrl, settings }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new ConvexError("Not authenticated")
    }

    const patch: {
      bio?: string
      avatarUrl?: string
      settings?: {
        darkMode: boolean
        dyslexiaFont: boolean
        publicProfile: boolean
      }
    } = {}
    if (bio !== undefined) patch.bio = bio
    if (avatarUrl !== undefined) patch.avatarUrl = avatarUrl
    if (settings !== undefined) patch.settings = settings

    await ctx.db.patch(userId, patch)
    return await ctx.db.get(userId)
  },
})
