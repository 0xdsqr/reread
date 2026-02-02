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
    const convexError = error as Error & { data?: string }
    if (convexError.data) return convexError.data
    const msg = error.message
    if (msg.includes("already exists") || msg.includes("unique"))
      return "An account with that email already exists."
    if (msg.includes("password")) return "Password does not meet requirements."
    return msg
  }
  return "Something went wrong. Please try again."
}

export default function SignUp() {
  const { signIn } = useAuthActions()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long")
      return
    }

    setIsLoading(true)
    try {
      await signIn("password", { email, password, username, flow: "signUp" })
    } catch (error: unknown) {
      Alert.alert("Sign Up Failed", extractErrorMessage(error))
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
          Create Account
        </Text>

        <View className="mb-4">
          <Text className="mb-2 text-base text-gray-700">Username</Text>
          <TextInput
            className="rounded-lg border border-gray-300 p-3 text-base text-gray-900"
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

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
            placeholder="Create a password (8+ characters)"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleSignUp}
          />
        </View>

        <TouchableOpacity
          className={`mt-2 mb-4 items-center rounded-lg p-4 ${isLoading ? "bg-gray-400" : "bg-indigo-500"}`}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text className="text-base font-semibold text-white">
            {isLoading ? "Creating account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-gray-500">
            Already have an account?{" "}
            <Link
              href="/(auth)/sign-in"
              className="font-semibold text-indigo-500"
            >
              Sign in
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
