import "../styles.css"
import { ConvexAuthProvider } from "@convex-dev/auth/react"
import { ConvexReactClient, useConvexAuth } from "convex/react"
import { Slot, useRouter, useSegments } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { useEffect } from "react"
import { ActivityIndicator, View } from "react-native"
import { ErrorBoundary, OfflineBanner } from "~/components"
import { useNetworkStatus } from "~/hooks/useNetworkStatus"
import { COLORS } from "~/lib/constants"

const tokenStorage = {
  getItem(key: string) {
    return SecureStore.getItem(key)
  },
  setItem(key: string, value: string) {
    SecureStore.setItem(key, value)
  },
  removeItem(key: string) {
    SecureStore.deleteItemAsync(key)
  },
}

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL
if (!convexUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_CONVEX_URL environment variable. " +
      "Set it in apps/mobile/.env or your EAS build secrets.",
  )
}
const convex = new ConvexReactClient(convexUrl)

function AuthGate() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const segments = useSegments()
  const router = useRouter()
  const { isOffline } = useNetworkStatus()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === "(auth)"

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/sign-in")
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)")
    }
  }, [isLoading, isAuthenticated, segments, router])

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <>
      {isOffline && <OfflineBanner />}
      <Slot />
    </>
  )
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ConvexAuthProvider client={convex} storage={tokenStorage}>
        <AuthGate />
      </ConvexAuthProvider>
    </ErrorBoundary>
  )
}
