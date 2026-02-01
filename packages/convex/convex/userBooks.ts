import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// Add a book to user's profile
export const add = mutation({
  args: {
    openLibraryKey: v.string(),
    title: v.string(),
    author: v.string(),
    coverUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    firstPublishYear: v.optional(v.number()),
    status: v.union(
      v.literal("reading"),
      v.literal("finished"),
      v.literal("want-to-read")
    ),
  },
  handler: async (ctx, { openLibraryKey, title, author, coverUrl, isbn, firstPublishYear, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Create or get book
    let bookId;
    const existingBook = await ctx.db
      .query("books")
      .withIndex("by_openLibraryKey", (q) => q.eq("openLibraryKey", openLibraryKey))
      .first();

    if (existingBook) {
      bookId = existingBook._id;
    } else {
      bookId = await ctx.db.insert("books", {
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
      });
    }

    // Check if user already has this book
    const existingUserBook = await ctx.db
      .query("userBooks")
      .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
      .first();

    if (existingUserBook) {
      throw new ConvexError("Book already in your library");
    }

    // Create userBook relationship
    const userBookId = await ctx.db.insert("userBooks", {
      userId,
      bookId,
      status,
      notes: undefined,
      startedAt: status === "reading" ? Date.now() : undefined,
      finishedAt: undefined,
      createdAt: Date.now(),
    });

    // Update book readers count
    if (existingBook) {
      await ctx.db.patch(bookId, {
        stats: {
          ...existingBook.stats,
          readersCount: existingBook.stats.readersCount + 1,
        },
      });
    } else {
      await ctx.db.patch(bookId, {
        stats: {
          readersCount: 1,
          wordsCount: 0,
        },
      });
    }

    // Update user book count
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.patch(userId, {
        stats: {
          ...user.stats,
          booksCount: user.stats.booksCount + 1,
        },
      });
    }

    return userBookId;
  },
});

// Update book status
export const updateStatus = mutation({
  args: {
    userBookId: v.id("userBooks"),
    status: v.union(
      v.literal("reading"),
      v.literal("finished"),
      v.literal("want-to-read")
    ),
  },
  handler: async (ctx, { userBookId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const userBook = await ctx.db.get(userBookId);
    if (!userBook || userBook.userId !== userId) {
      throw new ConvexError("User book not found");
    }

    const updateData: any = { status };

    if (status === "reading" && userBook.status !== "reading") {
      updateData.startedAt = Date.now();
    }

    if (status === "finished" && userBook.status !== "finished") {
      updateData.finishedAt = Date.now();
    }

    await ctx.db.patch(userBookId, updateData);
    return await ctx.db.get(userBookId);
  },
});

// Update book notes
export const updateNotes = mutation({
  args: {
    userBookId: v.id("userBooks"),
    notes: v.string(),
  },
  handler: async (ctx, { userBookId, notes }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const userBook = await ctx.db.get(userBookId);
    if (!userBook || userBook.userId !== userId) {
      throw new ConvexError("User book not found");
    }

    await ctx.db.patch(userBookId, { notes });
    return await ctx.db.get(userBookId);
  },
});

// Remove book from user's profile
export const remove = mutation({
  args: { userBookId: v.id("userBooks") },
  handler: async (ctx, { userBookId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const userBook = await ctx.db.get(userBookId);
    if (!userBook || userBook.userId !== userId) {
      throw new ConvexError("User book not found");
    }

    // Delete all words for this userBook
    const words = await ctx.db
      .query("words")
      .withIndex("by_userBook", (q) => q.eq("userBookId", userBookId))
      .collect();

    for (const word of words) {
      await ctx.db.delete(word._id);
    }

    // Delete the userBook
    await ctx.db.delete(userBookId);

    // Update book readers count
    const book = await ctx.db.get(userBook.bookId);
    if (book) {
      await ctx.db.patch(userBook.bookId, {
        stats: {
          ...book.stats,
          readersCount: Math.max(0, book.stats.readersCount - 1),
        },
      });
    }

    // Update user book count
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.patch(userId, {
        stats: {
          ...user.stats,
          booksCount: Math.max(0, user.stats.booksCount - 1),
        },
      });
    }
  },
});

// Get user's books
export const listMine = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let userBooksQuery = ctx.db.query("userBooks").withIndex("by_user", (q) => q.eq("userId", userId));
    
    const userBooks = await userBooksQuery.collect();
    
    const books = await Promise.all(
      userBooks.map(async (userBook) => {
        const book = await ctx.db.get(userBook.bookId);
        const wordsCount = await ctx.db
          .query("words")
          .withIndex("by_userBook", (q) => q.eq("userBookId", userBook._id))
          .collect()
          .then(words => words.length);
        
        return {
          userBook,
          book,
          wordsCount,
        };
      })
    );

    // Filter by status if provided
    if (status) {
      return books.filter(item => item.userBook.status === status);
    }

    return books;
  },
});

// Get books for a specific user (public)
export const listByUser = query({
  args: { 
    userId: v.id("users"), 
    status: v.optional(v.string()) 
  },
  handler: async (ctx, { userId, status }) => {
    const user = await ctx.db.get(userId);
    if (!user || !user.settings.publicProfile) {
      return [];
    }

    let userBooksQuery = ctx.db.query("userBooks").withIndex("by_user", (q) => q.eq("userId", userId));
    
    const userBooks = await userBooksQuery.collect();
    
    const books = await Promise.all(
      userBooks.map(async (userBook) => {
        const book = await ctx.db.get(userBook.bookId);
        const wordsCount = await ctx.db
          .query("words")
          .withIndex("by_userBook", (q) => q.eq("userBookId", userBook._id))
          .collect()
          .then(words => words.length);
        
        return {
          userBook,
          book,
          wordsCount,
        };
      })
    );

    // Filter by status if provided
    if (status) {
      return books.filter(item => item.userBook.status === status);
    }

    return books;
  },
});