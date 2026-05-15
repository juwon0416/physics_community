# Physics Community MCP Server

This MCP server lets an AI client such as Codex manage the Physics Community site data directly through tools.

## What it can do

- list and read topics
- append or replace topic editor content
- create or update topic sections
- create concept nodes
- add or remove graph edges
- inspect the raw graph snapshot

## Required environment variables

Use a Supabase key that can write to the project tables.

```bash
MCP_SUPABASE_URL=...
MCP_SUPABASE_SERVICE_ROLE_KEY=...
```

Fallbacks are also supported:

- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MCP_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_ANON_KEY`

## Install

```bash
cd mcp-server
npm install
npm run build
```

## Run

```bash
cd mcp-server
node build/index.js
```

## Claude Desktop / Codex-style config example

```json
{
  "mcpServers": {
    "physics-community": {
      "command": "node",
      "args": [
        "C:/Users/user/Desktop/physics_community/mcp-server/build/index.js"
      ],
      "env": {
        "MCP_SUPABASE_URL": "YOUR_SUPABASE_URL",
        "MCP_SUPABASE_SERVICE_ROLE_KEY": "YOUR_SERVICE_ROLE_KEY"
      }
    }
  }
}
```

## Primary tools

- `list_topics`
- `get_topic`
- `upsert_topic`
- `write_topic_draft`
- `upsert_section`
- `create_concept_node`
- `upsert_graph_edge`
- `delete_graph_edge`
- `get_graph_snapshot`
