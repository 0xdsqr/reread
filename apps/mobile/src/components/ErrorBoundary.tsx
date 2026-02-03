import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { COLORS } from "../lib/constants"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-surface p-8">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-danger-light">
            <Ionicons name="warning-outline" size={28} color={COLORS.danger} />
          </View>
          <Text className="mb-2 text-xl font-bold text-text-primary">
            Something went wrong
          </Text>
          <Text className="mb-8 text-center text-sm leading-5 text-text-secondary">
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity
            className="rounded-xl bg-primary px-8 py-4"
            onPress={() => this.setState({ hasError: false, error: null })}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text className="text-base font-semibold text-text-inverse">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}
