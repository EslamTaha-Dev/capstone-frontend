@"

# GEMINI.md

Context and conventions for the AI assistant working in this repo.

## Project

Frontend capstone for the FlyRank Frontend AI Engineering track. The project idea is still being decided.

## Stack

- Language: TypeScript
- Framework: React (scaffolded with Vite)
- Package manager: npm
- Styling: Tailwind

## Conventions

- Commit messages follow Conventional Commits (feat, fix, docs, chore, refactor, test)
- Keep commits small, one logical change per commit
- Use functional components and hooks, no class components
- Name components in PascalCase and files to match
- Prefer clear names over comments, and comment only the why
- Never commit secrets, API keys, or .env files

## Working with the AI assistant

- Explain a change before making it
- Do not install new dependencies without asking
- Keep changes focused on what was requested
  "@ | Set-Content GEMINI.md
