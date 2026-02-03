import { useAuthActions } from "@convex-dev/auth/react"
import { Link } from "expo-router"
import { useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { COLORS, extractAuthError } from "~/lib/constants"

export default function SignIn() {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const passwordRef = useRef<TextInput>(null)

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      await signIn("password", { email, password, flow: "signIn" })
    } catch (error: unknown) {
      Alert.alert("Sign In Failed", extractAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-2 text-center text-3xl font-bold text-text-primary">
          Welcome Back
        </Text>
        <Text className="mb-10 text-center text-base text-text-secondary">
          Sign in to continue reading
        </Text>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-text-secondary">
            Email
          </Text>
          <TextInput
            className="rounded-xl border border-border-strong px-4 py-3.5 text-base text-text-primary"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>

        <View className="mb-6">
          <Text className="mb-2 text-sm font-medium text-text-secondary">
            Password
          </Text>
          <TextInput
            ref={passwordRef}
            className="rounded-xl border border-border-strong px-4 py-3.5 text-base text-text-primary"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.textTertiary}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleSignIn}
          />
        </View>

        <TouchableOpacity
          className="mb-5 items-center rounded-xl bg-primary py-4"
          style={isLoading ? { opacity: 0.7 } : undefined}
          onPress={handleSignIn}
          disabled={isLoading}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.textInverse} />
          ) : (
            <Text className="text-base font-semibold text-text-inverse">
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-sm text-text-secondary">
            Don't have an account?{" "}
            <Link href="/(auth)/sign-up" className="font-semibold text-primary">
              Sign up
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
