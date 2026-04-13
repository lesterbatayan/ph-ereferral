# PH eReferral MCP Server

A **Model Context Protocol (MCP) server** that generates **FHIR R4 referral document Bundles** from plain clinical scenarios, conformant to the **Philippine eReferral Implementation Guide**.

## Tools Exposed

| Tool | Description |
|------|-------------|
| `generate_referral_bundle` | Feed a clinical scenario → get a complete FHIR R4 Bundle (Composition + Patient + Practitioner + Organizations + ServiceRequest + Condition) |
| `list_scenario_fields` | Returns the full input schema with field types, required flags, and example values |

## Quick Start

### 1. Install dependencies & build

```powershell
cd "d:\projects\ph-ereferral\mcp folder"
npm install
npm run build
```

### 2. Test with MCP Inspector

```powershell
npm run inspector
```

### 3. Use in VS Code (GitHub Copilot Agent Mode)

The `.vscode/mcp.json` file is already configured. After building:

1. Open the Command Palette → **MCP: List Servers** — you should see `ph-ereferral`.
2. In Copilot Chat (Agent mode), type `#generate_referral_bundle` and paste in a scenario.

### 4. Use in Claude Desktop

Add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ph-ereferral": {
      "command": "node",
      "args": ["d:\\projects\\ph-ereferral\\mcp folder\\build\\index.js"]
    }
  }
}
```

## Example Usage

Use the scenario in `samples/example-scenario.json` as input to `generate_referral_bundle`.

**Minimal scenario:**

```json
{
  "patient": {
    "givenName": "Juan",
    "familyName": "dela Cruz",
    "gender": "male",
    "birthDate": "1972-08-20"
  },
  "referringProvider": {
    "givenName": "Maria",
    "familyName": "Santos"
  },
  "referringFacility": { "name": "Barangay Health Center 12 – Tondo" },
  "receivingFacility": { "name": "Philippine General Hospital" },
  "reason": "Uncontrolled hypertension — specialist evaluation needed",
  "priority": "urgent"
}
```

The server returns a complete FHIR R4 document Bundle with:
- `Bundle` (type: document)
- `Composition` (referral note — first entry)
- `Patient`
- `Practitioner` (referring)
- `Organization` × 2 (referring facility + receiving facility)
- `ServiceRequest` (the referral order)
- `Condition` (if `diagnosis` provided)

## Project Structure

```
src/
  index.ts              ← MCP server entry (tool registration)
  fhir/
    types.ts            ← FHIR R4 TypeScript interfaces
    bundleBuilder.ts    ← Scenario → Bundle mapping logic
samples/
  example-scenario.json ← Full sample scenario
.vscode/
  mcp.json              ← VS Code MCP server config
.github/
  copilot-instructions.md
```

## Development

```powershell
# Watch mode (recompile on save)
npm run dev

# Rebuild
npm run build

# Run directly
npm start
```

## Extending

To add more resources (e.g., `AllergyIntolerance`, `MedicationStatement`, `Observation`):
1. Add a FHIR interface to `src/fhir/types.ts`
2. Add a builder function in `src/fhir/bundleBuilder.ts`
3. Add the built entry to `entries[]` in `buildReferralBundle()`
4. Add the corresponding input fields to `ReferralScenarioSchema` in `src/index.ts`
