# Re-Read

[![CI](https://img.shields.io/github/actions/workflow/status/0xdsqr/reread/test.yml?branch=master&label=ci)](https://github.com/0xdsqr/reread/actions/workflows/test.yml)
[![Expo](https://img.shields.io/badge/Expo-54-black?logo=expo)](https://expo.dev/)
[![Convex](https://img.shields.io/badge/Backend-Convex-EE342F)](https://www.convex.dev/)
[![Bun](https://img.shields.io/badge/Runtime-Bun-000000?logo=bun)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

📚 Re-Read is a mobile vocabulary companion for readers. Search books, track reading status, save words with definitions/context, and build your personal lexicon over time.

## Features

- Book search via Open Library
- Personal reading library (`reading`, `finished`, `want-to-read`)
- Save words with definition, context, page number, and notes
- Profile stats for books and words
- Convex backend with auth + real-time data
- Expo mobile app (iOS/Android)

## Tech Stack

- Mobile: Expo + React Native + Expo Router + NativeWind
- Backend: Convex
- Tooling: Bun + Nix

## Quick Start

```bash
bun install
bun run dev
```

Useful scripts:

- `bun run typecheck`
- `bun run test`
- `bun run convex:dev`
- `bun run dev:ios`
- `bun run dev:android`
