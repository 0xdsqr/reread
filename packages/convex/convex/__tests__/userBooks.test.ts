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

// Helper: seed a user (insert first, then create identity with real ID)
async function seedUser(t: ReturnType<typeof convexTest>) {
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

  const asUser = t.withIdentity({ subject: userId })
  return { asUser, userId }
}

// Helper: seed a user with a book already in their library
async function seedUserWithBook(t: ReturnType<typeof convexTest>) {
  const { asUser, userId } = await seedUser(t)

  const { bookId, userBookId } = await asUser.run(async (ctx) => {
    const bookId = await ctx.db.insert("books", {
      openLibraryKey: "/works/OL123",
      title: "Test Book",
      author: "Test Author",
      stats: { readersCount: 1, wordsCount: 0 },
      createdAt: Date.now(),
    })
    const userBookId = await ctx.db.insert("userBooks", {
      userId,
      bookId,
      status: "reading",
      wordsCount: 0,
      createdAt: Date.now(),
    })
    await ctx.db.patch(userId, {
      stats: { booksCount: 1, wordsCount: 0, currentStreak: 0 },
    })
    return { bookId, userBookId }
  })

  return { asUser, userId, bookId, userBookId }
}

describe("userBooks.add", () => {
  it("creates a userBook and increments counters", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userId } = await seedUser(t)

    const userBookId = await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL456",
      title: "New Book",
      author: "Author",
      status: "reading",
    })

    expect(userBookId).toBeDefined()

    // Check the userBook was created correctly
    const ub = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(ub).not.toBeNull()
    expect(ub!.status).toBe("reading")
    expect(ub!.wordsCount).toBe(0)
    expect(ub!.startedAt).toBeDefined() // reading sets startedAt

    // Check user.stats.booksCount incremented
    const user = await asUser.run(async (ctx) => ctx.db.get(userId))
    expect(user!.stats.booksCount).toBe(1)

    // Check book was created with readersCount = 1 (0 + increment)
    const book = await asUser.run(async (ctx) => ctx.db.get(ub!.bookId))
    expect(book!.stats.readersCount).toBe(1)
    expect(book!.title).toBe("New Book")
  })

  it("reuses existing book record for same openLibraryKey", async () => {
    const t = convexTest(schema, modules)
    const { asUser } = await seedUser(t)

    // Pre-seed a book
    const existingBookId = await asUser.run(async (ctx) => {
      return await ctx.db.insert("books", {
        openLibraryKey: "/works/OL789",
        title: "Existing Book",
        author: "Author",
        stats: { readersCount: 5, wordsCount: 10 },
        createdAt: Date.now(),
      })
    })

    const userBookId = await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL789",
      title: "Existing Book",
      author: "Author",
      status: "want-to-read",
    })

    const ub = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(ub!.bookId).toBe(existingBookId)

    // readersCount should be 6 (5 + 1)
    const book = await asUser.run(async (ctx) => ctx.db.get(existingBookId))
    expect(book!.stats.readersCount).toBe(6)
  })

  it("rejects duplicate book for same user", async () => {
    const t = convexTest(schema, modules)
    const { asUser } = await seedUser(t)

    await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL999",
      title: "Dup Book",
      author: "Author",
      status: "reading",
    })

    await expect(
      asUser.mutation(api.userBooks.add, {
        openLibraryKey: "/works/OL999",
        title: "Dup Book",
        author: "Author",
        status: "reading",
      }),
    ).rejects.toThrow("Book already in your library")
  })

  it("sets startedAt only for reading status", async () => {
    const t = convexTest(schema, modules)
    const { asUser } = await seedUser(t)

    const wantId = await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL111",
      title: "Want Book",
      author: "Author",
      status: "want-to-read",
    })

    const ub = await asUser.run(async (ctx) => ctx.db.get(wantId))
    expect(ub!.startedAt).toBeUndefined()
  })
})

describe("userBooks.updateStatus", () => {
  it("sets startedAt when transitioning to reading", async () => {
    const t = convexTest(schema, modules)
    const { asUser } = await seedUser(t)

    const userBookId = await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL200",
      title: "Status Book",
      author: "Author",
      status: "want-to-read",
    })

    const before = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(before!.startedAt).toBeUndefined()

    await asUser.mutation(api.userBooks.updateStatus, {
      userBookId,
      status: "reading",
    })

    const after = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(after!.status).toBe("reading")
    expect(after!.startedAt).toBeDefined()
  })

  it("sets finishedAt when transitioning to finished", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userBookId } = await seedUserWithBook(t)

    await asUser.mutation(api.userBooks.updateStatus, {
      userBookId,
      status: "finished",
    })

    const ub = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(ub!.status).toBe("finished")
    expect(ub!.finishedAt).toBeDefined()
  })

  it("does not overwrite startedAt if already reading", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userBookId } = await seedUserWithBook(t)

    // Manually set startedAt to a known value so we can verify it's preserved
    const knownTime = 1700000000000
    await asUser.run(async (ctx) => {
      await ctx.db.patch(userBookId, { startedAt: knownTime })
    })

    // Re-set to reading (no-op for startedAt since already reading)
    await asUser.mutation(api.userBooks.updateStatus, {
      userBookId,
      status: "reading",
    })

    const after = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(after!.startedAt).toBe(knownTime)
  })
})

describe("userBooks.remove", () => {
  it("deletes userBook and decrements counters", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userId, bookId, userBookId } = await seedUserWithBook(t)

    await asUser.mutation(api.userBooks.remove, { userBookId })

    // userBook should be deleted
    const ub = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(ub).toBeNull()

    // user booksCount should be 0
    const user = await asUser.run(async (ctx) => ctx.db.get(userId))
    expect(user!.stats.booksCount).toBe(0)

    // book readersCount should be 0
    const book = await asUser.run(async (ctx) => ctx.db.get(bookId))
    expect(book!.stats.readersCount).toBe(0)
  })

  it("cascade-deletes words and their likes, decrements all counters", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userId, bookId, userBookId } = await seedUserWithBook(t)

    // Add 2 words
    const wordId1 = await asUser.mutation(api.words.add, {
      userBookId,
      word: "cascade1",
    })
    const wordId2 = await asUser.mutation(api.words.add, {
      userBookId,
      word: "cascade2",
    })

    // Like one of them
    await asUser.mutation(api.words.toggleLike, { wordId: wordId1 })

    // Verify setup: user has 2 words, book has 2 words
    const userBefore = await asUser.run(async (ctx) => ctx.db.get(userId))
    expect(userBefore!.stats.wordsCount).toBe(2)

    // Remove the book
    await asUser.mutation(api.userBooks.remove, { userBookId })

    // Words should be gone
    const w1 = await asUser.run(async (ctx) => ctx.db.get(wordId1))
    const w2 = await asUser.run(async (ctx) => ctx.db.get(wordId2))
    expect(w1).toBeNull()
    expect(w2).toBeNull()

    // Like should be gone
    const likes = await asUser.run(async (ctx) =>
      ctx.db.query("wordLikes").collect(),
    )
    expect(likes).toHaveLength(0)

    // H1 fix: user.stats.wordsCount should be decremented by the deleted words count
    const user = await asUser.run(async (ctx) => ctx.db.get(userId))
    expect(user!.stats.wordsCount).toBe(0)
    expect(user!.stats.booksCount).toBe(0)

    // Book counters should be decremented
    const book = await asUser.run(async (ctx) => ctx.db.get(bookId))
    expect(book!.stats.readersCount).toBe(0)
    expect(book!.stats.wordsCount).toBe(0)
  })
})

describe("userBooks.listMine", () => {
  it("returns all user books when no status filter", async () => {
    const t = convexTest(schema, modules)
    const { asUser } = await seedUser(t)

    await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL301",
      title: "Book A",
      author: "Author A",
      status: "reading",
    })
    await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL302",
      title: "Book B",
      author: "Author B",
      status: "finished",
    })
    await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL303",
      title: "Book C",
      author: "Author C",
      status: "want-to-read",
    })

    const all = await asUser.query(api.userBooks.listMine, {})
    expect(all).toHaveLength(3)
  })

  it("filters by status using compound index", async () => {
    const t = convexTest(schema, modules)
    const { asUser } = await seedUser(t)

    await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL401",
      title: "Reading Book",
      author: "Author",
      status: "reading",
    })
    await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL402",
      title: "Finished Book",
      author: "Author",
      status: "finished",
    })

    const reading = await asUser.query(api.userBooks.listMine, {
      status: "reading",
    })
    expect(reading).toHaveLength(1)
    expect(reading[0].book!.title).toBe("Reading Book")

    const finished = await asUser.query(api.userBooks.listMine, {
      status: "finished",
    })
    expect(finished).toHaveLength(1)
    expect(finished[0].book!.title).toBe("Finished Book")

    const wantToRead = await asUser.query(api.userBooks.listMine, {
      status: "want-to-read",
    })
    expect(wantToRead).toHaveLength(0)
  })

  it("enriches results with book data and wordsCount", async () => {
    const t = convexTest(schema, modules)
    const { asUser } = await seedUser(t)

    const userBookId = await asUser.mutation(api.userBooks.add, {
      openLibraryKey: "/works/OL501",
      title: "Enriched Book",
      author: "Rich Author",
      status: "reading",
    })

    // Add a word to verify wordsCount
    await asUser.mutation(api.words.add, { userBookId, word: "vocabulary" })

    const results = await asUser.query(api.userBooks.listMine, {})
    expect(results).toHaveLength(1)
    expect(results[0].book!.title).toBe("Enriched Book")
    expect(results[0].book!.author).toBe("Rich Author")
    expect(results[0].wordsCount).toBe(1)
  })
})

describe("userBooks.updateNotes", () => {
  it("updates notes on a userBook", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userBookId } = await seedUserWithBook(t)

    await asUser.mutation(api.userBooks.updateNotes, {
      userBookId,
      notes: "Great book about testing!",
    })

    const ub = await asUser.run(async (ctx) => ctx.db.get(userBookId))
    expect(ub!.notes).toBe("Great book about testing!")
  })
})

describe("userBooks.getById", () => {
  it("returns enriched userBook for the owner", async () => {
    const t = convexTest(schema, modules)
    const { asUser, userBookId, bookId } = await seedUserWithBook(t)

    const result = await asUser.query(api.userBooks.getById, { userBookId })
    expect(result).not.toBeNull()
    expect(result!.book!._id).toBe(bookId)
    expect(result!.wordsCount).toBe(0)
  })

  it("returns null for another user's book", async () => {
    const t = convexTest(schema, modules)
    const { userBookId } = await seedUserWithBook(t)

    // Create a second user with different identity
    const otherUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        username: "other",
        email: "other@example.com",
        settings: {
          darkMode: false,
          dyslexiaFont: false,
          publicProfile: true,
        },
        stats: { booksCount: 0, wordsCount: 0, currentStreak: 0 },
        badges: [],
        createdAt: Date.now(),
      })
    })

    const asOther = t.withIdentity({ subject: otherUserId })
    const result = await asOther.query(api.userBooks.getById, { userBookId })
    expect(result).toBeNull()
  })
})
