// Elysia + Bun API server — entry point placeholder
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import * as dotenv from "dotenv";

dotenv.config();

const app = new Elysia()
  .use(cors())
  .get("/health", () => ({ status: "ok", ts: Date.now() }))
  .listen(3000);

console.log(`🦊 API running at http://localhost:3000`);
export default app;
