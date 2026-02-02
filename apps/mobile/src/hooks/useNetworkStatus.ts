import { useEffect, useState } from "react"
import { Platform } from "react-native"

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Simple online/offline detection using Navigator API
    // Works on web and most React Native environments
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    // Check initial state
    if (typeof navigator !== "undefined" && "onLine" in navigator) {
      setIsOffline(!navigator.onLine)
    }

    // Add event listeners (only works on web, but won't crash on native)
    if (Platform.OS === "web") {
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  return { isOffline }
}
