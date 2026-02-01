import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

const CustomPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      username: params.username as string,
    };
  },
  async validatePasswordRequirements(password: string) {
    if (password.length < 8) {
      throw new ConvexError("Password must be at least 8 characters long");
    }
  },
});

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [CustomPassword],
});