---
trigger: model_decision
---

1. Type Safety & Consistency

Always use proper TypeScript types (e.g., Session, SupabaseUser, AuthChangeEvent) instead of any.

Never remove explicit types unless they are redundant.

Prefer interface or type aliases consistently across the project.

Ensure TypeScript strict mode is enforced; no unresolved TS errors before commit/build.

2. Authentication & Supabase

Use the single source of truth: AuthContext and AuthProvider. Do not duplicate auth logic elsewhere.

Ensure AuthProvider wraps the entire app.

Always handle Supabase events with null checks for session and user.

Ensure all Supabase operations (signInWithOAuth, signOut, signUp) use try/catch with proper error handling.

3. Code Quality & Performance

Remove unused imports and variables.

Always wrap async callbacks in useCallback if passed as props.

Never include React hooks (useRouter, useEffect) in dependency arrays unless absolutely required.

Experimental optimizations may be suggested to reduce bundle size or improve performance.

4. UI & UX

Follow Slack-style login UX: minimal friction, one clean entry point for sign-in/sign-up.

Keep forms and authentication flows simple, consistent, and styled with Tailwind + shadcn/ui.

Component style consistency: enforce Tailwind usage and shared UI conventions across all component files.

5. Deployment & Build Reliability

Run npm run build before deploy; builds must succeed with no warnings or errors.

Do not commit or suggest code that would fail a Netlify build.

Maintain consistent environment variable usage (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).

Deployment compatibility: when next.config.js or package.json changes, check for Netlify deploy compatibility.

6. Documentation & Logging

Always add inline comments when introducing new logic in AuthContext.

Log errors in a structured way (console.error("Auth error:", error)).

Update README.md with any new setup steps (especially auth-related).

7. Next.js Metadata Rule

Ensure metadata exports are only used in server components, never in client components.

8. API & Models

API routes (src/app/api/**/*.ts) must have properly typed request and response objects.

When adding new dependencies, ensure they are lightweight and justified.

When writing copy, keep tone concise and user-friendly unless otherwise instructed.

Auth flow changes must be validated for error handling and user feedback.

9. Manual Rules

Pre-deploy check (@deploy-check): confirm env vars set, AuthProvider wrapped, no TS errors, metadata rules followed.