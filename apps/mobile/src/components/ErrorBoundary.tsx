import React from "react"
import { Text, TouchableOpacity, View } from "react-native"

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
        <View className="flex-1 items-center justify-center bg-white p-8">
          <Text className="mb-2 text-xl font-bold text-gray-900">
            Something went wrong
          </Text>
          <Text className="mb-6 text-center text-sm text-gray-500">
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          <TouchableOpacity
            className="rounded-lg bg-indigo-500 px-6 py-3"
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text className="text-base font-semibold text-white">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}
