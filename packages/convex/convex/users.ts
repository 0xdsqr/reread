import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// Get current user's profile
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db.get(userId);
  },
});

// Get user by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
  },
});

// Create user profile after auth
export const create = mutation({
  args: {
    username: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { username, email }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Check if username is already taken
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    
    if (existingUser) {
      throw new ConvexError("Username already taken");
    }

    // Create user profile
    return await ctx.db.insert("users", {
      username,
      email,
      avatarUrl: undefined,
      bio: undefined,
      settings: {
        darkMode: false,
        dyslexiaFont: false,
        publicProfile: true,
      },
      stats: {
        booksCount: 0,
        wordsCount: 0,
        currentStreak: 0,
      },
      badges: [],
      createdAt: Date.now(),
    });
  },
});

// Update user profile
export const update = mutation({
  args: {
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    settings: v.optional(v.object({
      darkMode: v.boolean(),
      dyslexiaFont: v.boolean(),
      publicProfile: v.boolean(),
    })),
  },
  handler: async (ctx, { bio, avatarUrl, settings }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (settings !== undefined) updateData.settings = settings;

    await ctx.db.patch(userId, updateData);
    return await ctx.db.get(userId);
  },
});