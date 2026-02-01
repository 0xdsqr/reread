import { Stack } from "expo-router";
import { ConvexProvider } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convex } from "../lib/convex";

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}