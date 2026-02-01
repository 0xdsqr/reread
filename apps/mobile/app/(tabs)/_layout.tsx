import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarLabel: "Search",
        }}
      />
      <Tabs.Screen
        name="books"
        options={{
          title: "My Books",
          tabBarLabel: "Books",
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: "My Words",
          tabBarLabel: "Words",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile", 
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}