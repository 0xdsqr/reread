import React from "react";
import { useCurrentUser } from "@convex-dev/auth/react";
import { Redirect } from "expo-router";

export default function App() {
  const user = useCurrentUser();
  
  // Redirect based on auth state
  if (user === undefined) {
    // Loading state
    return null;
  }
  
  if (user === null) {
    // Not authenticated - redirect to sign in
    return <Redirect href="/(auth)/sign-in" />;
  }
  
  // Authenticated - redirect to main app
  return <Redirect href="/(tabs)" />;
}