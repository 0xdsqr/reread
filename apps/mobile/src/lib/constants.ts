// Shared constants used across screens.

export type ReadingStatus = "reading" | "finished" | "want-to-read"

export const STATUS_CONFIG: Record<
  ReadingStatus,
  { label: string; color: string; lightColor: string }
> = {
  reading: { label: "Reading", color: "#6366f1", lightColor: "#e0e7ff" },
  finished: { label: "Finished", color: "#10b981", lightColor: "#d1fae5" },
  "want-to-read": {
    label: "Want to Read",
    color: "#f59e0b",
    lightColor: "#fef3c7",
  },
}

export function getStatusColor(status: string): string {
  return (
    (STATUS_CONFIG as Record<string, { color: string }>)[status]?.color ??
    "#6b7280"
  )
}

export function getStatusLightColor(status: string): string {
  return (
    (STATUS_CONFIG as Record<string, { lightColor: string }>)[status]
      ?.lightColor ?? "#f3f4f6"
  )
}

export function getStatusLabel(status: string): string {
  return (
    (STATUS_CONFIG as Record<string, { label: string }>)[status]?.label ??
    status
  )
}

export function formatDate(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 30) {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}

// Design tokens
export const COLORS = {
  primary: "#6366f1",
  primaryLight: "#e0e7ff",
  success: "#10b981",
  successLight: "#d1fae5",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  surface: "#ffffff",
  surfaceSecondary: "#f9fafb",
  border: "#f3f4f6",
  borderStrong: "#e5e7eb",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  textInverse: "#ffffff",
} as const

// App-wide accent color (kept for backwards compat)
export const ACCENT = COLORS.primary

// Shared error message extraction for auth flows
export function extractAuthError(error: unknown): string {
  if (error instanceof Error) {
    const convexError = error as Error & { data?: string }
    if (convexError.data) return convexError.data
    const msg = error.message
    if (msg.includes("Invalid credentials")) return "Invalid email or password."
    if (msg.includes("Could not find"))
      return "No account found with that email."
    if (msg.includes("already exists") || msg.includes("unique"))
      return "An account with that email already exists."
    if (msg.includes("password")) return "Password does not meet requirements."
    return msg
  }
  return "Something went wrong. Please try again."
}
