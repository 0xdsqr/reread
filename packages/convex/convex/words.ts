import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// Add a word to a book
export const add = mutation({
  args: {
    userBookId: v.id("userBooks"),
    word: v.string(),
    definition: v.optional(v.string()),
    context: v.optional(v.string()),
    pageNumber: v.optional(v.number()),
    notes: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, { userBookId, word, definition, context, pageNumber, notes, isPublic }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const userBook = await ctx.db.get(userBookId);
    if (!userBook || userBook.userId !== userId) {
      throw new ConvexError("Book not found in your library");
    }

    const wordId = await ctx.db.insert("words", {
      userId,
      userBookId,
      bookId: userBook.bookId,
      word: word.trim().toLowerCase(),
      definition,
      context,
      pageNumber,
      notes,
      likesCount: 0,
      isPublic: isPublic ?? true,
      createdAt: Date.now(),
    });

    // Update user word count
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.patch(userId, {
        stats: {
          ...user.stats,
          wordsCount: user.stats.wordsCount + 1,
        },
      });
    }

    // Update book word count
    const book = await ctx.db.get(userBook.bookId);
    if (book) {
      await ctx.db.patch(userBook.bookId, {
        stats: {
          ...book.stats,
          wordsCount: book.stats.wordsCount + 1,
        },
      });
    }

    return wordId;
  },
});

// Update a word
export const update = mutation({
  args: {
    wordId: v.id("words"),
    definition: v.optional(v.string()),
    context: v.optional(v.string()),
    pageNumber: v.optional(v.number()),
    notes: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, { wordId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const word = await ctx.db.get(wordId);
    if (!word || word.userId !== userId) {
      throw new ConvexError("Word not found");
    }

    const patch: Record<string, any> = {};
    if (updates.definition !== undefined) patch.definition = updates.definition;
    if (updates.context !== undefined) patch.context = updates.context;
    if (updates.pageNumber !== undefined) patch.pageNumber = updates.pageNumber;
    if (updates.notes !== undefined) patch.notes = updates.notes;
    if (updates.isPublic !== undefined) patch.isPublic = updates.isPublic;

    await ctx.db.patch(wordId, patch);
    return await ctx.db.get(wordId);
  },
});

// Delete a word
export const remove = mutation({
  args: { wordId: v.id("words") },
  handler: async (ctx, { wordId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const word = await ctx.db.get(wordId);
    if (!word || word.userId !== userId) {
      throw new ConvexError("Word not found");
    }

    // Delete all likes for this word
    const likes = await ctx.db
      .query("wordLikes")
      .withIndex("by_word", (q) => q.eq("wordId", wordId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    await ctx.db.delete(wordId);

    // Update user word count
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.patch(userId, {
        stats: {
          ...user.stats,
          wordsCount: Math.max(0, user.stats.wordsCount - 1),
        },
      });
    }

    // Update book word count
    const book = await ctx.db.get(word.bookId);
    if (book) {
      await ctx.db.patch(word.bookId, {
        stats: {
          ...book.stats,
          wordsCount: Math.max(0, book.stats.wordsCount - 1),
        },
      });
    }
  },
});

// List words for a specific userBook
export const listByUserBook = query({
  args: { userBookId: v.id("userBooks") },
  handler: async (ctx, { userBookId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const userBook = await ctx.db.get(userBookId);
    if (!userBook || userBook.userId !== userId) return [];

    return await ctx.db
      .query("words")
      .withIndex("by_userBook", (q) => q.eq("userBookId", userBookId))
      .order("desc")
      .collect();
  },
});

// List all words for current user (across all books)
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const words = await ctx.db
      .query("words")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Enrich with book info
    const enriched = await Promise.all(
      words.map(async (word) => {
        const book = await ctx.db.get(word.bookId);
        return {
          ...word,
          bookTitle: book?.title || "Unknown",
          bookAuthor: book?.author || "Unknown",
        };
      })
    );

    return enriched;
  },
});

// List public words for a book (from all users)
export const listPublicByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const words = await ctx.db
      .query("words")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .order("desc")
      .collect();

    return words.filter((w) => w.isPublic);
  },
});

// Toggle like on a word
export const toggleLike = mutation({
  args: { wordId: v.id("words") },
  handler: async (ctx, { wordId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const existing = await ctx.db
      .query("wordLikes")
      .withIndex("by_user_word", (q) => q.eq("userId", userId).eq("wordId", wordId))
      .first();

    const word = await ctx.db.get(wordId);
    if (!word) throw new ConvexError("Word not found");

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(wordId, {
        likesCount: Math.max(0, word.likesCount - 1),
      });
      return { liked: false };
    } else {
      await ctx.db.insert("wordLikes", {
        userId,
        wordId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(wordId, {
        likesCount: word.likesCount + 1,
      });
      return { liked: true };
    }
  },
});
