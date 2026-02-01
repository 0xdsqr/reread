import React from "react";
import { View, Text } from "react-native";

export default function Profile() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Profile</Text>
      <Text style={{ fontSize: 16, marginTop: 8, color: "#6b7280" }}>
        Coming soon...
      </Text>
    </View>
  );
}