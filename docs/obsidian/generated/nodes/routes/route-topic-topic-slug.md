---
id: route:topic-topic-slug
type: route
status: active
source_path: src/App.tsx
source_kind: route-definition
generated_from:
  - git-ls-files
  - route-definition
relations:
  outgoing:
    - page:topic-page
  incoming:
    - none
evidence:
  - kind: route-definition
    source_path: src/App.tsx
    detail: "<Route path=\"topic/:topicSlug\" element={<TopicPage />"
confidence: high
---

# route:topic-topic-slug

> GENERATED FILE. Do not edit directly. Add human notes under docs/obsidian/overlays/.

- Type: `route`
- Status: `active`
- Source path: `src/App.tsx`
- Source kind: `route-definition`

## Relations

| Direction | Type | Node | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| out | renders | [[page-topic-page]] | high | route-definition @ src/App.tsx |
