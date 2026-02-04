import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../_generated/api"
import schema from "../schema"

const modules = (
  import.meta as unknown as {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>
  }
).glob("../**/*.*s")

describe("users.getByUsername", () => {
  it("returns only public profile fields for public users", async () => {
    const t = convexTest(schema, modules)

    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        username: "public-user",
        email: "public@example.com",
        avatarUrl: "https://example.com/avatar.png",
        bio: "hello",
        settings: { darkMode: false, dyslexiaFont: false, publicProfile: true },
        stats: { booksCount: 1, wordsCount: 2, currentStreak: 3 },
        badges: ["starter"],
        createdAt: Date.now(),
      })
    })

    const user = await t.query(api.users.getByUsername, {
      username: "public-user",
    })

    expect(user).not.toBeNull()
    expect(user?.username).toBe("public-user")
    expect("email" in (user as object)).toBe(false)
    expect("settings" in (user as object)).toBe(false)
  })

  it("returns null for private profiles", async () => {
    const t = convexTest(schema, modules)

    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        username: "private-user",
        email: "private@example.com",
        settings: { darkMode: false, dyslexiaFont: false, publicProfile: false },
        stats: { booksCount: 0, wordsCount: 0, currentStreak: 0 },
        badges: [],
        createdAt: Date.now(),
      })
    })

    const user = await t.query(api.users.getByUsername, {
      username: "private-user",
    })

    expect(user).toBeNull()
  })
})
