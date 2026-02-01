import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

// Convex deployment URL
const CONVEX_URL = "https://rare-reindeer-667.convex.cloud";

export const convex = new ConvexReactClient(CONVEX_URL);