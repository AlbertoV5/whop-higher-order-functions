# AGENTS

## Commands
- bun install; bun run dev; bun run build; bun run typecheck
- bun test (run all tests)
- bun test <file> or bun test -t '<pattern>' (run single test)
- make upgrade-whop; make publish; make changelog

## Code Style
- ESM imports only; 2-space indent; omit semicolons
- Strict TypeScript: annotate public APIs; use .ts/.tsx files
- camelCase for variables/functions; PascalCase for types/components
- Throw Errors for failures; use async/await; no silent catches

## Cursor Rules
- .cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc
- packages/*/.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc