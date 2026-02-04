import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../_generated/api"
import schema from "../schema"

// Explicit modules glob so convex-test can find our functions in the monorepo.
const modules = (
  import.meta as unknown as {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>
  }
).glob("../**/*.*s")

// Helper: seed a user, book, and userBook, returning all IDs.
// The key trick: we insert the user first via an unauthenticated run(),
// then use that real Id<"users"> as the `subject` for withIdentity().
// This makes getAuthUserId() return the same ID stored in the DB.
async function seedUserWithBook(t: ReturnType<typeof convexTest>) {
  // Step 1: Insert user without auth to get the real Id
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      username: "testuser",
      email: "test@example.com",
      settings: { darkMode: false, dyslexiaFont: false, publicProfile: true },
      stats: { booksCount: 0, wordsCount: 0, currentStreak: 0 },
      badges: [],
      createdAt: Date.now(),
    })
  })

  // Step 2: Create identity with real userId as subject
  const asUser = t.withIdentity({ subject: userId })

  // Step 3: Seed book + userBook under that identity
  const { bookId, userBookId } = await asUser.run(async (ctx) => {
    const bookId = await ctx.db.insert("books", {
      openLibraryKey: "/works/OL123",
      title: "Test Book",
      author: "Test Author",
      stats: { readersCount: 0, wordsCount: 0 },
      createdAt: Date.now(),
    })
    const userBookId = await ctx.db.insert("userBooks", {
      userId,
      bookId,
      status: "reading",
      wordsCount: 0,
      createdAt: Date.now(),
    })
    // Update counters
    await ctx.db.patch(userId, {
      stats: { booksCount: 1, wordsCount: 0, currentStreak: 0 },
    })
    await ctx.db.patch(bookId, {
      stats: { readersCount: 1, wordsCount: 0 },
    })
    return { bookId, userBookId }
  })

  return { asUser, userId, bookId, userBookId }
}

describe("words.add", () => {
  it("creates a word and increments all counters", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userId, bookId, userBookId } = await seedUserWithBook(t)

    const wordId = await asUser.mutation(api.words.add, {
      userBookId,
      word: "Ephemeral",
      definition: "lasting a very short time",
    })

    expect(wordId).toBeDefined()

    // Check the word was created correctly
    const word = await asUser.run(async (ctx) => ctx.db.get(wordId))
    expect(word).not.toBeNull()
    expect(word!.word).toBe("ephemeral") // lowercased
    expect(word!.definition).toBe("lasting a very short time")
    expect(word!.isPublic).toBe(true) // default
    expect(word!.likesCount).toBe(0)

    // Check counters
    const user = await asUser.run(async (ctx) => ctx.db.get(userId))
    expect(user!.stats.wordsCount).toBe(1)

    const book = await asUser.run(async (ctx) => ctx.db.get(bookId))
    expect(book!.stats.wordsCount).toBe(1)

    const ub = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(ub!.wordsCount).toBe(1)
  })

  it("increments counters correctly for multiple words", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userId, bookId, userBookId } = await seedUserWithBook(t)

    await asUser.mutation(api.words.add, { userBookId, word: "word1" })
    await asUser.mutation(api.words.add, { userBookId, word: "word2" })
    await asUser.mutation(api.words.add, { userBookId, word: "word3" })

    const user = await asUser.run(async (ctx) => ctx.db.get(userId))
    expect(user!.stats.wordsCount).toBe(3)

    const book = await asUser.run(async (ctx) => ctx.db.get(bookId))
    expect(book!.stats.wordsCount).toBe(3)

    const ub = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(ub!.wordsCount).toBe(3)
  })

  it("rejects blank words", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userBookId } = await seedUserWithBook(t)

    await expect(
      asUser.mutation(api.words.add, {
        userBookId,
        word: "   ",
      }),
    ).rejects.toThrow("Word cannot be empty")
  })
})

describe("words.remove", () => {
  it("deletes a word and decrements all counters", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userId, bookId, userBookId } = await seedUserWithBook(t)

    const wordId = await asUser.mutation(api.words.add, {
      userBookId,
      word: "transient",
    })

    await asUser.mutation(api.words.remove, { wordId })

    // Word should be gone
    const word = await asUser.run(async (ctx) => ctx.db.get(wordId))
    expect(word).toBeNull()

    // All counters back to 0
    const user = await asUser.run(async (ctx) => ctx.db.get(userId))
    expect(user!.stats.wordsCount).toBe(0)

    const book = await asUser.run(async (ctx) => ctx.db.get(bookId))
    expect(book!.stats.wordsCount).toBe(0)

    const ub = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(ub!.wordsCount).toBe(0)
  })

  it("counters never go negative", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userId, userBookId } = await seedUserWithBook(t)

    // Force counters to 0 then delete a word
    await asUser.run(async (ctx) => {
      await ctx.db.patch(userId, {
        stats: { booksCount: 1, wordsCount: 0, currentStreak: 0 },
      })
    })

    const wordId = await asUser.mutation(api.words.add, {
      userBookId,
      word: "test",
    })

    // Force counter to 0 before removal to test Math.max guard
    await asUser.run(async (ctx) => {
      await ctx.db.patch(userId, {
        stats: { booksCount: 1, wordsCount: 0, currentStreak: 0 },
      })
    })

    await asUser.mutation(api.words.remove, { wordId })

    const user = await asUser.run(async (ctx) => ctx.db.get(userId))
    expect(user!.stats.wordsCount).toBe(0) // not -1
  })
})

describe("words.update", () => {
  it("updates word fields", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userBookId } = await seedUserWithBook(t)

    const wordId = await asUser.mutation(api.words.add, {
      userBookId,
      word: "test",
    })

    const updated = await asUser.mutation(api.words.update, {
      wordId,
      definition: "a procedure",
      pageNumber: 42,
      isPublic: false,
    })

    expect(updated!.definition).toBe("a procedure")
    expect(updated!.pageNumber).toBe(42)
    expect(updated!.isPublic).toBe(false)
  })
})

describe("words.toggleLike", () => {
  it("likes and unlikes a word", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userBookId } = await seedUserWithBook(t)

    const wordId = await asUser.mutation(api.words.add, {
      userBookId,
      word: "likeable",
    })

    // Like
    const result1 = await asUser.mutation(api.words.toggleLike, { wordId })
    expect(result1.liked).toBe(true)

    let word = await asUser.run(async (ctx) => ctx.db.get(wordId))
    expect(word!.likesCount).toBe(1)

    // Unlike
    const result2 = await asUser.mutation(api.words.toggleLike, { wordId })
    expect(result2.liked).toBe(false)

    word = await asUser.run(async (ctx) => ctx.db.get(wordId))
    expect(word!.likesCount).toBe(0)
  })
})
