---
trigger: always_on
---

TypeScript Strictness → Ensure TypeScript errors are resolved before commit/build. Strict mode must be enforced.

Auth Provider Consistency → Verify that AuthProvider wraps the entire app and that AuthContext usage matches the provider.

Next.js Metadata Rule → Ensure metadata exports are only used in server components, never in client components.

Search for existing files before creating new ones.

Maintain Supabase authentication as the single source of truth for login + user data.

Follow MVP scope only: auth, digest preview (HTML + audio), scheduling, and deployment.

Ensure error handling and logging is present for all API endpoints.

Keep code minimal, clean, and production-ready.