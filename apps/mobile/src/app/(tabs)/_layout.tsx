import { Ionicons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import { COLORS } from "../../lib/constants"

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          borderTopColor: COLORS.border,
        },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: "600",
          color: COLORS.textPrimary,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Library",
          tabBarLabel: "Library",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarLabel: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: "Words",
          tabBarLabel: "Words",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hide the old books tab -- it's merged into index */}
      <Tabs.Screen name="books" options={{ href: null }} />
    </Tabs>
  )
}
