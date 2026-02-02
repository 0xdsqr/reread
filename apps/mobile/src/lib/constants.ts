// Shared constants used across screens.

export type ReadingStatus = "reading" | "finished" | "want-to-read"

export const STATUS_CONFIG: Record<
  ReadingStatus,
  { label: string; color: string }
> = {
  reading: { label: "Reading", color: "#6366f1" },
  finished: { label: "Finished", color: "#10b981" },
  "want-to-read": { label: "Want to Read", color: "#f59e0b" },
}

export function getStatusColor(status: string): string {
  return (
    (STATUS_CONFIG as Record<string, { color: string }>)[status]?.color ??
    "#6b7280"
  )
}

export function getStatusLabel(status: string): string {
  return (
    (STATUS_CONFIG as Record<string, { label: string }>)[status]?.label ??
    status
  )
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// App-wide accent color
export const ACCENT = "#6366f1"
