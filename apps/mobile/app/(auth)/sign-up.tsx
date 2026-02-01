import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "expo-router";

export default function SignUp() {
  const { signIn } = useAuthActions();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await signIn("password", { email, password, username });
    } catch (error) {
      Alert.alert("Error", "Failed to sign up. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 32, fontWeight: "bold", marginBottom: 40, textAlign: "center" }}>
        Create Account
      </Text>
      
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, marginBottom: 8, color: "#374151" }}>Username</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
          }}
          value={username}
          onChangeText={setUsername}
          placeholder="Choose a username"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, marginBottom: 8, color: "#374151" }}>Email</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
          }}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, marginBottom: 8, color: "#374151" }}>Password</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
          }}
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password (8+ characters)"
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: isLoading ? "#9ca3af" : "#3b82f6",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 16,
        }}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
          {isLoading ? "Creating account..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      <View style={{ alignItems: "center" }}>
        <Text style={{ color: "#6b7280" }}>
          Already have an account?{" "}
          <Link href="/(auth)/sign-in" style={{ color: "#3b82f6", fontWeight: "600" }}>
            Sign in
          </Link>
        </Text>
      </View>
    </View>
  );
}