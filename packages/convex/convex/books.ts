import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// Search books using Open Library API
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    if (!query.trim()) return [];
    
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`
      );
      const data = await response.json();
      
      return (data.docs || []).map((doc: any) => ({
        key: doc.key,
        title: doc.title || "Unknown Title",
        author: doc.author_name?.[0] || "Unknown Author", 
        coverUrl: doc.cover_i 
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
        isbn: doc.isbn?.[0],
        firstPublishYear: doc.first_publish_year,
      }));
    } catch (error) {
      console.error("Error searching Open Library:", error);
      return [];
    }
  },
});

// Get book by Open Library key
export const getByOpenLibraryKey = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("books")
      .withIndex("by_openLibraryKey", (q) => q.eq("openLibraryKey", key))
      .first();
  },
});

// Get popular books (most readers)
export const getPopular = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("books")
      .order("desc")
      .take(20);
  },
});

// Get all users reading a specific book
export const getReaders = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const userBooks = await ctx.db
      .query("userBooks")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .collect();
    
    const users = await Promise.all(
      userBooks.map(async (userBook) => {
        const user = await ctx.db.get(userBook.userId);
        return {
          ...user,
          status: userBook.status,
          startedAt: userBook.startedAt,
          finishedAt: userBook.finishedAt,
        };
      })
    );
    
    return users.filter(Boolean);
  },
});

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
  handler: async (ctx, { openLibraryKey, title, author, coverUrl, isbn, firstPublishYear }) => {
    // Check if book already exists
    const existing = await ctx.db
      .query("books")
      .withIndex("by_openLibraryKey", (q) => q.eq("openLibraryKey", openLibraryKey))
      .first();
    
    if (existing) {
      return existing._id;
    }
    
    // Create new book
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
    });
  },
});