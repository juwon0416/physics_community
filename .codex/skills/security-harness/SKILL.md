---
name: security-harness
description: Use when checking, changing, or documenting repository security rules, secret handling, environment variables, deployment credentials, Git-tracked secret risks, or security validation gates.
id: skill:security-harness
type: codex-skill
allowed_agents:
  - agent:orchestrator
  - agent:frontend-builder
  - agent:graph-steward
  - agent:harness-keeper
related_workflows:
  - workflow:security-check
  - workflow:secure-deployment
inputs:
  - git tracked file list
  - .gitignore
  - environment variable names
  - build and deployment configuration
outputs:
  - security validation result
  - docs/harness/security.md updates
  - secret exposure warnings without secret values
verification:
  - check:secret-file-tracking
  - check:secret-pattern-scan
  - check:env-example-safety
---

# Security Harness

## Overview

Protect secrets by keeping credentials out of Git, avoiding value disclosure in logs, and making security checks part of the normal verification and deployment loop.

## Workflow

1. List tracked files with `git ls-files`.
2. Confirm no tracked `.env*` files exist except `.env.example`.
3. Confirm `.env.example` uses placeholders only.
4. Scan tracked text files for high-signal secret literals and hard-coded secret assignments.
5. Confirm frontend code reads public values through `import.meta.env`.
6. Confirm MCP/server code reads privileged values through `process.env`.
7. Run `npm.cmd run security:check`.
8. If an exposure is found, report only file path, line, variable name, and remediation. Never print the value.
9. If a credential was committed, remove it from the current tree and tell the user to rotate or revoke it.
10. Commit and push the security fix after validation passes.

## Commands

```powershell
npm.cmd run security:check
git ls-files .env*
```

## Hard Rules

- Never print secret values.
- Never commit `.env`, `.env.local`, `.env.vercel`, deployment pull files, private keys, or provider tokens.
- Keep service role credentials server-side only.
- Do not expose service role keys through Vite `VITE_*` variables.
- Do not deploy if `npm.cmd run security:check` fails.
- Treat any previously committed secret-like value as compromised until rotated or revoked.
