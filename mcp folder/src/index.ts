#!/usr/bin/env node
/**
 * PH eReferral MCP Server
 *
 * Exposes two tools to any MCP client (Claude Desktop, VS Code Copilot, etc.):
 *   1. generate_referral_bundle  – feed a clinical scenario, get a FHIR R4 Bundle
 *   2. list_scenario_fields      – describe the scenario schema
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildReferralBundle, getScenarioFieldDescriptions } from "./fhir/bundleBuilder.js";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const PatientSchema = z.object({
  id: z.string().optional().describe("Optional internal UUID for the patient resource"),
  philsysId: z.string().optional().describe("Philippine System ID (PhilSys)"),
  givenName: z.string().describe("Patient first / given name"),
  familyName: z.string().describe("Patient last / family name"),
  gender: z.enum(["male", "female", "other", "unknown"]).describe("Administrative gender"),
  birthDate: z.string().describe("Date of birth in YYYY-MM-DD format"),
  address: z.string().optional().describe("Street address line"),
  city: z.string().optional().describe("City or municipality"),
  province: z.string().optional().describe("Province or region"),
  phone: z.string().optional().describe("Contact phone number"),
});

const ProviderSchema = z.object({
  id: z.string().optional(),
  givenName: z.string().describe("Provider first name"),
  familyName: z.string().describe("Provider last name"),
  prcLicense: z.string().optional().describe("PRC license number"),
  phone: z.string().optional(),
});

const FacilitySchema = z.object({
  id: z.string().optional(),
  hfrCode: z.string().optional().describe("DOH Health Facility Registry code"),
  name: z.string().describe("Facility name"),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  phone: z.string().optional(),
});

const DiagnosisSchema = z.object({
  display: z.string().describe("Human-readable diagnosis name"),
  snomedCode: z.string().optional().describe("SNOMED CT code"),
  icd10Code: z.string().optional().describe("ICD-10 code"),
});

const RequestedServiceSchema = z.object({
  display: z.string().describe("Description of the requested service"),
  snomedCode: z.string().optional().describe("SNOMED CT code for the service"),
});

const ReferralScenarioSchema = z.object({
  patient: PatientSchema,
  referringProvider: ProviderSchema,
  referringFacility: FacilitySchema,
  receivingFacility: FacilitySchema,
  reason: z.string().describe("Chief complaint or reason for referral (free text)"),
  diagnosis: DiagnosisSchema.optional().describe("Primary diagnosis (optional)"),
  priority: z
    .enum(["routine", "urgent", "asap", "stat"])
    .optional()
    .default("routine")
    .describe("Referral priority"),
  requestedService: RequestedServiceSchema.optional().describe(
    "Specific service or specialty being requested"
  ),
  additionalNotes: z.string().optional().describe("Extra clinical notes"),
  urgencyNarrative: z.string().optional().describe("Narrative justification for urgency level"),
});

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "ph-ereferral",
  version: "1.0.0",
});

// Tool 1 – generate_referral_bundle
server.registerTool(
  "generate_referral_bundle",
  {
    title: "Generate PH eReferral FHIR Bundle",
    description:
      "Accepts a clinical referral scenario and returns a FHIR R4 document Bundle " +
      "conformant to the Philippine eReferral Implementation Guide. " +
      "Includes Composition, Patient, Practitioner (referring), " +
      "Organization (referring & receiving facilities), ServiceRequest, and Condition resources.",
    inputSchema: ReferralScenarioSchema,
  },
  async (scenario) => {
    try {
      const bundle = buildReferralBundle(scenario);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(bundle, null, 2),
          },
        ],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error generating bundle: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool 2 – list_scenario_fields
server.registerTool(
  "list_scenario_fields",
  {
    title: "List Referral Scenario Fields",
    description:
      "Returns the complete schema of the referral scenario input — " +
      "all available fields, their types, whether they are required, " +
      "and example values aligned with the PH eReferral IG.",
    inputSchema: z.object({}),
  },
  async () => {
    const schema = getScenarioFieldDescriptions();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(schema, null, 2),
        },
      ],
    };
  }
);

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PH eReferral MCP Server running on stdio ✓");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
