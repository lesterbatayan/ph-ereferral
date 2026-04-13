# PH eReferral MCP Server — Copilot Instructions

## Project Overview
This is a **Model Context Protocol (MCP) server** written in **TypeScript (Node.js)** that
generates **FHIR R4 referral Bundles** conformant to the **Philippine eReferral
Implementation Guide (PH eReferral IG)**.

## SDK Reference
- MCP TypeScript SDK (v1.x stable): https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x
- Full MCP docs: https://modelcontextprotocol.io/llms-full.txt

## Key Design Rules
1. **stdio transport only** — never write to `console.log` (corrupts JSON-RPC). Use `console.error` for all logging.
2. FHIR R4 document Bundle: the **first entry MUST be the Composition resource**.
3. All resources must carry `meta.profile` pointing to the PH eReferral IG StructureDefinition URLs.
4. UUIDs are generated fresh per bundle via `uuid` v4.
5. Zod schemas in `src/index.ts` are the source of truth for input validation.

## File Structure
```
src/
  index.ts              ← MCP server entry point (tools registered here)
  fhir/
    types.ts            ← Lean FHIR R4 TypeScript interfaces
    bundleBuilder.ts    ← Maps ReferralScenario → FHIRBundle
samples/
  example-scenario.json ← Sample input for testing
.vscode/
  mcp.json              ← VS Code MCP server config (stdio)
```

## Adding a New Tool
1. Define a Zod schema for inputs.
2. Call `server.registerTool(name, { title, description, inputSchema }, handler)`.
3. Handler returns `{ content: [{ type: "text", text: "..." }] }`.
4. Rebuild with `npm run build`.

## Adding New FHIR Resources
1. Add interface to `src/fhir/types.ts`.
2. Add builder function in `src/fhir/bundleBuilder.ts`.
3. Push the entry into `entries[]` in `buildReferralBundle()`.
4. Reference it from the Composition sections if needed.

## PH eReferral IG Profile Base URL
`https://fhir.health.gov.ph/ImplementationGuide/ph-ereferral`
Update the `IG_BASE` constant in `bundleBuilder.ts` when the canonical URL is finalised.
