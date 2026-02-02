import ratelimiter from "@convex-dev/ratelimiter/convex.config"
import { defineApp } from "convex/server"

const app = defineApp()
app.use(ratelimiter)

export default app
