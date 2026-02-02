import { useAuthActions } from "@convex-dev/auth/react"
import { Link } from "expo-router"
import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Convex errors often have structured data
    const convexError = error as Error & { data?: string }
    if (convexError.data) return convexError.data
    // Strip Convex wrapper prefix if present
    const msg = error.message
    if (msg.includes("Invalid credentials")) return "Invalid email or password."
    if (msg.includes("Could not find"))
      return "No account found with that email."
    return msg
  }
  return "Something went wrong. Please try again."
}

export default function SignIn() {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      await signIn("password", { email, password, flow: "signIn" })
    } catch (error: unknown) {
      Alert.alert("Sign In Failed", extractErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-5"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-10 text-center text-[32px] font-bold text-gray-900">
          Welcome Back
        </Text>

        <View className="mb-4">
          <Text className="mb-2 text-base text-gray-700">Email</Text>
          <TextInput
            className="rounded-lg border border-gray-300 p-3 text-base text-gray-900"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-base text-gray-700">Password</Text>
          <TextInput
            className="rounded-lg border border-gray-300 p-3 text-base text-gray-900"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleSignIn}
          />
        </View>

        <TouchableOpacity
          className={`mt-2 mb-4 items-center rounded-lg p-4 ${isLoading ? "bg-gray-400" : "bg-indigo-500"}`}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          <Text className="text-base font-semibold text-white">
            {isLoading ? "Signing in..." : "Sign In"}
          </Text>
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-gray-500">
            Don't have an account?{" "}
            <Link
              href="/(auth)/sign-up"
              className="font-semibold text-indigo-500"
            >
              Sign up
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
