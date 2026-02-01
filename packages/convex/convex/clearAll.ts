import { internalMutation } from "./_generated/server";

export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all documents from all tables
    const tables = [
      "users",
      "authSessions", 
      "authAccounts",
      "authRefreshTokens",
      "authVerificationCodes",
      "authVerifiers",
      "books", 
      "userBooks",
      "words",
      "wordLikes", 
      "follows",
      "badges",
      "userBadges"
    ];

    for (const tableName of tables) {
      const docs = await ctx.db.query(tableName as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    console.log("All data cleared successfully");
    return "All data cleared";
  },
});