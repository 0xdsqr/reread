import type React from "react"
import { Text, View } from "react-native"
import { formatDate } from "../lib/constants"

interface WordCardProps {
  word: string
  definition?: string | null
  context?: string | null
  pageNumber?: number | null
  notes?: string | null
  createdAt?: number
  /** Book title to show in footer */
  bookTitle?: string
  /** Book author to show in footer */
  bookAuthor?: string
  /** Number of likes */
  likesCount?: number
  /** Optional right-side action (delete button, etc.) */
  action?: React.ReactNode
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
}: WordCardProps) {
  return (
    <View className="mb-3 mx-4 rounded-lg bg-white p-4 shadow-sm elevation-2">
      <View className="mb-2 flex-row items-start">
        <Text className="flex-1 text-xl font-bold text-gray-900">{word}</Text>
        {pageNumber != null && (
          <Text className="rounded-xl bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            p. {pageNumber}
          </Text>
        )}
      </View>

      {definition ? (
        <Text className="mb-2 text-base text-gray-700">{definition}</Text>
      ) : null}

      {context ? (
        <View className="mb-2 rounded-md bg-gray-50 p-3">
          <Text className="text-sm italic text-gray-500">
            &ldquo;{context}&rdquo;
          </Text>
        </View>
      ) : null}

      {notes ? (
        <Text className="mb-2 text-sm text-gray-500">Note: {notes}</Text>
      ) : null}

      {(bookTitle || createdAt != null || likesCount != null) && (
        <View className="flex-row items-center justify-between border-t border-gray-100 pt-2">
          {bookTitle && (
            <View>
              <Text className="text-xs font-medium text-gray-700">
                {bookTitle}
              </Text>
              {bookAuthor && (
                <Text className="text-[11px] text-gray-400">
                  by {bookAuthor}
                </Text>
              )}
            </View>
          )}
          <View className="items-end">
            {createdAt != null && (
              <Text className="text-[11px] text-gray-400">
                {formatDate(createdAt)}
              </Text>
            )}
            {(likesCount ?? 0) > 0 && (
              <Text className="text-[11px] text-red-500">
                {likesCount} {likesCount === 1 ? "like" : "likes"}
              </Text>
            )}
          </View>
        </View>
      )}

      {action}
    </View>
  )
}
