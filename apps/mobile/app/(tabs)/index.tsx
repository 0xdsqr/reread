import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useCurrentUser } from "@convex-dev/auth/react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function Home() {
  const user = useCurrentUser();
  const { signOut } = useAuthActions();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Welcome to Re-Reader! 📚
      </Text>
      
      {user && (
        <>
          <Text style={{ fontSize: 18, marginBottom: 20, color: "#374151" }}>
            Hello, {user.email}!
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 30, textAlign: "center", color: "#6b7280" }}>
            Your social vocabulary-building platform is ready.
          </Text>
          
          <TouchableOpacity
            style={{
              backgroundColor: "#ef4444",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={handleSignOut}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}