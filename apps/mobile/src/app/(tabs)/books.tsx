// This tab is hidden (href: null in _layout.tsx).
// Kept as a file because expo-router requires it to exist.
// All book browsing is handled by the Library tab (index.tsx).

import { Redirect } from "expo-router"

export default function Books() {
  return <Redirect href="/(tabs)" />
}
