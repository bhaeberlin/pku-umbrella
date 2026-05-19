@AGENTS.md

## Verify and deploy workflow

After making code changes, always follow these steps in order:

1. **TypeScript check** — `npx tsc --noEmit` from the `pku-umbrella/` directory. Fix any errors before proceeding.
2. **Commit** — stage the changed files by name, write a clear commit message.
3. **Push** — `git push` to `origin/main`. Vercel deploys automatically on every push — no manual deploy step needed.

Do NOT start a local dev server (`npm run dev`) to verify UI changes. TypeScript clean + visual inspection of the code is sufficient.
