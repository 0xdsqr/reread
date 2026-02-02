import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    // Ensure vitest resolves from the package root so convex-test
    // can find the _generated directory next to our convex functions.
    root: ".",
  },
})
