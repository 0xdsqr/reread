import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server"
import { RateLimiter } from "@convex-dev/ratelimiter"
import { ConvexError } from "convex/values"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"

// Rate limiter: max 10 auth attempts per minute per unique key (email).
// Prevents brute-force password attacks.
const rateLimiter = new RateLimiter(components.ratelimiter, {
  authAttempt: {
    kind: "token bucket",
    rate: 10,
    period: 60_000, // 1 minute
    capacity: 10,
  },
})

const CustomPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      username:
        (params.username as string) ||
        (params.email as string).split("@")[0] ||
        "user",
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
    }
  },
  async validatePasswordRequirements(password: string) {
    if (password.length < 8) {
      throw new ConvexError("Password must be at least 8 characters long")
    }
  },
})

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [CustomPassword],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Rate-limit auth attempts by email or a generic key
      const key = (args.profile?.email as string) ?? "anonymous"
      const { ok } = await rateLimiter.limit(ctx, "authAttempt", { key })
      if (!ok) {
        throw new ConvexError("Too many attempts. Please try again later.")
      }

      if (args.existingUserId) {
        return args.existingUserId
      }

      // New user: create with the profile data from the Password provider
      const profile = args.profile as Record<string, unknown>
      return ctx.db.insert(
        "users",
        profile as typeof profile & { _id?: never; _creationTime?: never },
      )
    },
  },
})
