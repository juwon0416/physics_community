# Security Harness

Security is part of the harness, not a separate afterthought. The repository should make it hard for agents to leak credentials, commit local environment files, or deploy from an unverified state.

## Protected Material

- Supabase service role keys
- Vercel, GitHub, OpenAI, Anthropic, and other provider tokens
- OIDC, access, refresh, and auth tokens
- Database URLs with credentials
- Private keys and certificates
- `.env`, `.env.*`, `.env.local`, `.env.vercel`, and deployment pull files

## Rules

- Never print secret values from environment variables, `.env*` files, logs, or CI output.
- Do not commit `.env*` files except `.env.example`, and `.env.example` must contain placeholders only.
- Frontend code may reference public `VITE_*` variables through `import.meta.env`, but must not hard-code real values.
- Server and MCP code must read secret values from `process.env`.
- Service role keys must stay server-side only. They must never be exposed to React code or generated client bundles.
- If a secret-like file has ever been committed, remove it from the current tree and rotate or revoke the exposed credential.
- Before deployment, run the security validation together with the build checks.

## Command

```powershell
npm.cmd run security:check
```

This command intentionally reports file paths, line numbers, and variable names only. It never prints detected values.

## Incident Response

1. Stop using the exposed credential.
2. Rotate or revoke it in the provider dashboard.
3. Remove the file or literal from the current Git tree.
4. Add or update a validation rule if the exposure pattern was not already covered.
5. Consider history rewriting only after an explicit decision, because it requires coordinated force-push handling.
