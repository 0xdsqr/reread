import type React from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { formatDate } from "../lib/constants"

interface WordCardProps {
  word: string
  definition?: string | null
  context?: string | null
  pageNumber?: number | null
  notes?: string | null
  createdAt?: number
  bookTitle?: string
  bookAuthor?: string
  likesCount?: number
  action?: React.ReactNode
  onPress?: () => void
}

export function WordCard({
  word,
  definition,
  context,
  pageNumber,
  notes,
  createdAt,
  bookTitle,
  bookAuthor,
  likesCount,
  action,
  onPress,
}: WordCardProps) {
  const content = (
    <View className="rounded-2xl bg-surface p-4 shadow-sm">
      {/* Header */}
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 text-lg font-bold text-text-primary">
          {word}
        </Text>
        {pageNumber != null && (
          <View className="ml-2 rounded-lg bg-surface-secondary px-2 py-0.5">
            <Text className="text-xs font-medium text-text-tertiary">
              p. {pageNumber}
            </Text>
          </View>
        )}
      </View>

      {/* Definition */}
      {definition ? (
        <Text className="mt-2 text-sm leading-5 text-text-secondary">
          {definition}
        </Text>
      ) : null}

      {/* Context quote */}
      {context ? (
        <View className="mt-2 rounded-xl bg-surface-secondary p-3">
          <Text className="text-sm italic leading-5 text-text-secondary">
            "{context}"
          </Text>
        </View>
      ) : null}

      {/* Notes */}
      {notes ? (
        <Text className="mt-2 text-sm text-text-tertiary">Note: {notes}</Text>
      ) : null}

      {/* Footer */}
      {(bookTitle || createdAt != null || likesCount != null) && (
        <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
          {bookTitle && (
            <View className="flex-1">
              <Text className="text-xs font-medium text-text-secondary">
                {bookTitle}
              </Text>
              {bookAuthor && (
                <Text className="mt-0.5 text-xs text-text-tertiary">
                  {bookAuthor}
                </Text>
              )}
            </View>
          )}
          <View className="items-end">
            {createdAt != null && (
              <Text className="text-xs text-text-tertiary">
                {formatDate(createdAt)}
              </Text>
            )}
            {(likesCount ?? 0) > 0 && (
              <Text className="mt-0.5 text-xs font-medium text-danger">
                {likesCount} {likesCount === 1 ? "like" : "likes"}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Action slot */}
      {action && <View className="mt-3">{action}</View>}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    )
  }

  return content
}
