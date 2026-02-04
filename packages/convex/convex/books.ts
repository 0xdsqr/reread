import { v } from "convex/values"
import { action, mutation, query } from "./_generated/server"

// Search books using Open Library API.
// This must be an action (not a query) because it makes HTTP calls.
export const search = action({
  args: { query: v.string() },
  handler: async (_ctx, { query }) => {
    if (!query.trim()) return []

    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`,
      )
      if (!response.ok) {
        throw new Error(`Open Library returned ${response.status}`)
      }
      const data = await response.json()

      return ((data.docs as Record<string, unknown>[]) || []).map(
        (doc: Record<string, unknown>) => ({
          key: doc.key as string,
          title: (doc.title as string) || "Unknown Title",
          author:
            (doc.author_name as string[] | undefined)?.[0] || "Unknown Author",
          coverUrl: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : undefined,
          isbn: (doc.isbn as string[] | undefined)?.[0],
          firstPublishYear: doc.first_publish_year as number | undefined,
        }),
      )
    } catch (error) {
      console.error("Error searching Open Library:", error)
      return []
    }
  },
})

// Get book by Open Library key
export const getByOpenLibraryKey = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("books")
      .withIndex("by_openLibraryKey", (q) => q.eq("openLibraryKey", key))
      .first()
  },
})

// Get recently added books (ordered by creation time desc).
// Note: There is no popularity sort yet — would require an aggregate or
// denormalized field. This is intentionally named "getRecent" to be honest.
export const getRecent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("books").order("desc").take(20)
  },
})

// Get all users reading a specific book
export const getReaders = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const userBooks = await ctx.db
      .query("userBooks")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .collect()

    const users = await Promise.all(
      userBooks.map(async (userBook) => {
        const user = await ctx.db.get(userBook.userId)
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
          status: userBook.status,
          startedAt: userBook.startedAt,
          finishedAt: userBook.finishedAt,
        }
      }),
    )

    return users.filter((user): user is NonNullable<typeof user> => user !== null)
  },
})

// Create or get existing book from Open Library data
export const createFromOpenLibrary = mutation({
  args: {
    openLibraryKey: v.string(),
    title: v.string(),
    author: v.string(),
    coverUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    firstPublishYear: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { openLibraryKey, title, author, coverUrl, isbn, firstPublishYear },
  ) => {
    const existing = await ctx.db
      .query("books")
      .withIndex("by_openLibraryKey", (q) =>
        q.eq("openLibraryKey", openLibraryKey),
      )
      .first()

    if (existing) {
      return existing._id
    }

    return await ctx.db.insert("books", {
      openLibraryKey,
      title,
      author,
      coverUrl,
      isbn,
      firstPublishYear,
      stats: {
        readersCount: 0,
        wordsCount: 0,
      },
      createdAt: Date.now(),
    })
  },
})
