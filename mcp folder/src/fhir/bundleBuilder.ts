/**
 * BundleBuilder — maps a clinical scenario to a FHIR R4 referral Bundle
 * conformant to the PH eReferral Implementation Guide.
 *
 * Profile URLs are placeholders based on the PH eReferral IG conventions.
 * Update them once the final canonical IG base URL is confirmed.
 */

import { v4 as uuidv4 } from "uuid";
import type {
  FHIRBundle,
  FHIRBundleEntry,
  FHIRPatient,
  FHIRPractitioner,
  FHIROrganization,
  FHIRCondition,
  FHIRServiceRequest,
  FHIRComposition,
  FHIRHumanName,
  FHIRAddress,
  FHIRContactPoint,
  FHIRCodeableConcept,
} from "./types.js";

// ── PH eReferral IG canonical base ──────────────────────────────────────────
const IG_BASE = "https://fhir.health.gov.ph/ImplementationGuide/ph-ereferral";
const PROFILES = {
  bundle: `${IG_BASE}/StructureDefinition/PHReferralBundle`,
  composition: `${IG_BASE}/StructureDefinition/PHReferralComposition`,
  patient: `${IG_BASE}/StructureDefinition/PHPatient`,
  practitioner: `${IG_BASE}/StructureDefinition/PHPractitioner`,
  organization: `${IG_BASE}/StructureDefinition/PHOrganization`,
  serviceRequest: `${IG_BASE}/StructureDefinition/PHReferralServiceRequest`,
  condition: `${IG_BASE}/StructureDefinition/PHCondition`,
};

// ── Code systems ─────────────────────────────────────────────────────────────
const LOINC = "http://loinc.org";
const SNOMED = "http://snomed.info/sct";
const HL7_ACT_CODE = "http://terminology.hl7.org/CodeSystem/v3-ActCode";
const CLINICAL_STATUS = "http://terminology.hl7.org/CodeSystem/condition-clinical";
const VERIFICATION_STATUS = "http://terminology.hl7.org/CodeSystem/condition-ver-status";
const SERVICE_REQUEST_CATEGORY = "http://snomed.info/sct";
const PH_ID_SYSTEM = "https://philsys.gov.ph";
const PH_FACILITY_SYSTEM = "https://hfr.doh.gov.ph";
const PH_LICENSE_SYSTEM = "https://prc.gov.ph";

// ── Scenario input shape ─────────────────────────────────────────────────────

export interface ReferralScenario {
  // Patient demographics
  patient: {
    id?: string;
    philsysId?: string;
    givenName: string;
    familyName: string;
    gender: "male" | "female" | "other" | "unknown";
    birthDate: string; // YYYY-MM-DD
    address?: string;
    city?: string;
    province?: string;
    phone?: string;
  };

  // Referring provider / facility
  referringProvider: {
    id?: string;
    givenName: string;
    familyName: string;
    prcLicense?: string;
    phone?: string;
  };
  referringFacility: {
    id?: string;
    hfrCode?: string;
    name: string;
    address?: string;
    city?: string;
    province?: string;
    phone?: string;
  };

  // Receiving / referred-to facility
  receivingFacility: {
    id?: string;
    hfrCode?: string;
    name: string;
    address?: string;
    city?: string;
    province?: string;
    phone?: string;
  };

  // Clinical information
  reason: string;                // free-text chief complaint / reason for referral
  diagnosis?: {
    snomedCode?: string;
    icd10Code?: string;
    display: string;
  };
  priority?: "routine" | "urgent" | "asap" | "stat";
  additionalNotes?: string;
  urgencyNarrative?: string;

  // Optional service being requested
  requestedService?: {
    snomedCode?: string;
    display: string;
  };
}

// ── Helper utilities ─────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function urn(id: string): string {
  return `urn:uuid:${id}`;
}

function ref(id: string, resourceType: string): string {
  return `${resourceType}/${id}`;
}

function codeable(
  system: string,
  code: string,
  display?: string,
  text?: string
): FHIRCodeableConcept {
  return {
    coding: [{ system, code, display }],
    ...(text ? { text } : {}),
  };
}

function humanName(given: string, family: string): FHIRHumanName {
  return {
    use: "official",
    family,
    given: [given],
    text: `${given} ${family}`,
  };
}

function address(
  line?: string,
  city?: string,
  state?: string
): FHIRAddress {
  return {
    use: "home",
    ...(line ? { line: [line] } : {}),
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    country: "PH",
  };
}

function phone(value: string): FHIRContactPoint {
  return { system: "phone", value, use: "work" };
}

// ── Resource builders ────────────────────────────────────────────────────────

function buildPatient(s: ReferralScenario): { id: string; resource: FHIRPatient } {
  const id = s.patient.id ?? uuidv4();
  const resource: FHIRPatient = {
    resourceType: "Patient",
    id,
    meta: { profile: [PROFILES.patient] },
    ...(s.patient.philsysId
      ? {
          identifier: [
            { system: PH_ID_SYSTEM, value: s.patient.philsysId },
          ],
        }
      : {}),
    name: [humanName(s.patient.givenName, s.patient.familyName)],
    gender: s.patient.gender,
    birthDate: s.patient.birthDate,
    ...(s.patient.address || s.patient.city
      ? {
          address: [address(s.patient.address, s.patient.city, s.patient.province)],
        }
      : {}),
    ...(s.patient.phone
      ? { telecom: [{ system: "phone", value: s.patient.phone, use: "home" as const }] }
      : {}),
  };
  return { id, resource };
}

function buildReferringPractitioner(
  s: ReferralScenario
): { id: string; resource: FHIRPractitioner } {
  const id = s.referringProvider.id ?? uuidv4();
  const resource: FHIRPractitioner = {
    resourceType: "Practitioner",
    id,
    meta: { profile: [PROFILES.practitioner] },
    name: [humanName(s.referringProvider.givenName, s.referringProvider.familyName)],
    ...(s.referringProvider.prcLicense
      ? {
          identifier: [
            { system: PH_LICENSE_SYSTEM, value: s.referringProvider.prcLicense },
          ],
          qualification: [
            {
              code: codeable(
                "http://terminology.hl7.org/CodeSystem/v2-0360",
                "MD",
                "Doctor of Medicine"
              ),
              identifier: [
                { system: PH_LICENSE_SYSTEM, value: s.referringProvider.prcLicense },
              ],
            },
          ],
        }
      : {}),
    ...(s.referringProvider.phone
      ? { telecom: [phone(s.referringProvider.phone)] }
      : {}),
  };
  return { id, resource };
}

function buildFacility(
  facilityInput: ReferralScenario["referringFacility"] | ReferralScenario["receivingFacility"],
  id?: string
): { id: string; resource: FHIROrganization } {
  const orgId = id ?? uuidv4();
  const resource: FHIROrganization = {
    resourceType: "Organization",
    id: orgId,
    meta: { profile: [PROFILES.organization] },
    name: facilityInput.name,
    ...(facilityInput.hfrCode
      ? { identifier: [{ system: PH_FACILITY_SYSTEM, value: facilityInput.hfrCode }] }
      : {}),
    type: [
      codeable(
        "http://terminology.hl7.org/CodeSystem/organization-type",
        "prov",
        "Healthcare Provider"
      ),
    ],
    ...(facilityInput.phone
      ? { telecom: [phone(facilityInput.phone)] }
      : {}),
    ...(facilityInput.address || facilityInput.city
      ? {
          address: [
            address(facilityInput.address, facilityInput.city, facilityInput.province),
          ],
        }
      : {}),
  };
  return { id: orgId, resource };
}

function buildCondition(
  s: ReferralScenario,
  patientId: string
): { id: string; resource: FHIRCondition } | null {
  if (!s.diagnosis) return null;
  const id = uuidv4();
  const codeObj: FHIRCodeableConcept = {
    coding: [],
    text: s.diagnosis.display,
  };
  if (s.diagnosis.snomedCode) {
    codeObj.coding!.push({
      system: SNOMED,
      code: s.diagnosis.snomedCode,
      display: s.diagnosis.display,
    });
  }
  if (s.diagnosis.icd10Code) {
    codeObj.coding!.push({
      system: "http://hl7.org/fhir/sid/icd-10",
      code: s.diagnosis.icd10Code,
      display: s.diagnosis.display,
    });
  }
  const resource: FHIRCondition = {
    resourceType: "Condition",
    id,
    meta: { profile: [PROFILES.condition] },
    clinicalStatus: codeable(CLINICAL_STATUS, "active", "Active"),
    verificationStatus: codeable(VERIFICATION_STATUS, "confirmed", "Confirmed"),
    category: [codeable(SNOMED, "55607006", "Problem")],
    code: codeObj,
    subject: { reference: ref(patientId, "Patient") },
    onsetDateTime: now(),
  };
  return { id, resource };
}

function buildServiceRequest(
  s: ReferralScenario,
  patientId: string,
  practitionerId: string,
  receivingOrgId: string,
  conditionId?: string
): { id: string; resource: FHIRServiceRequest } {
  const id = uuidv4();

  const serviceCode: FHIRCodeableConcept = s.requestedService
    ? {
        coding: s.requestedService.snomedCode
          ? [
              {
                system: SNOMED,
                code: s.requestedService.snomedCode,
                display: s.requestedService.display,
              },
            ]
          : [],
        text: s.requestedService.display,
      }
    : { text: "Referral for specialist consultation", coding: [] };

  const resource: FHIRServiceRequest = {
    resourceType: "ServiceRequest",
    id,
    meta: { profile: [PROFILES.serviceRequest] },
    status: "active",
    intent: "order",
    category: [
      codeable(SERVICE_REQUEST_CATEGORY, "306206005", "Referral to service"),
    ],
    priority: s.priority ?? "routine",
    code: serviceCode,
    subject: { reference: ref(patientId, "Patient") },
    requester: { reference: ref(practitionerId, "Practitioner") },
    performer: [
      {
        reference: ref(receivingOrgId, "Organization"),
        display: s.receivingFacility.name,
      },
    ],
    reasonCode: [{ text: s.reason }],
    ...(conditionId
      ? { reasonReference: [{ reference: ref(conditionId, "Condition") }] }
      : {}),
    ...(s.additionalNotes
      ? { note: [{ text: s.additionalNotes }] }
      : {}),
    authoredOn: now(),
  };
  return { id, resource };
}

function buildComposition(
  s: ReferralScenario,
  patientId: string,
  practitionerId: string,
  referringOrgId: string,
  serviceRequestId: string,
  conditionId?: string
): { id: string; resource: FHIRComposition } {
  const id = uuidv4();
  const sections = [
    {
      title: "Referral Request",
      code: codeable(LOINC, "57133-1", "Referral note"),
      entry: [{ reference: ref(serviceRequestId, "ServiceRequest") }],
    },
    ...(conditionId
      ? [
          {
            title: "Reason for Referral",
            code: codeable(LOINC, "42349-1", "Reason for referral"),
            entry: [{ reference: ref(conditionId, "Condition") }],
          },
        ]
      : []),
  ];

  const resource: FHIRComposition = {
    resourceType: "Composition",
    id,
    meta: { profile: [PROFILES.composition] },
    status: "final",
    type: codeable(LOINC, "57133-1", "Referral note"),
    subject: { reference: ref(patientId, "Patient") },
    date: now(),
    author: [{ reference: ref(practitionerId, "Practitioner") }],
    title: `Referral – ${s.patient.givenName} ${s.patient.familyName}`,
    custodian: { reference: ref(referringOrgId, "Organization") },
    attester: [
      {
        mode: "legal",
        time: now(),
        party: { reference: ref(practitionerId, "Practitioner") },
      },
    ],
    section: sections,
  };
  return { id, resource };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildReferralBundle(scenario: ReferralScenario): FHIRBundle {
  const bundleId = uuidv4();
  const timestamp = now();

  // Build constituent resources
  const patient = buildPatient(scenario);
  const practitioner = buildReferringPractitioner(scenario);
  const referringOrg = buildFacility(scenario.referringFacility);
  const receivingOrg = buildFacility(scenario.receivingFacility);
  const condition = buildCondition(scenario, patient.id);
  const serviceRequest = buildServiceRequest(
    scenario,
    patient.id,
    practitioner.id,
    receivingOrg.id,
    condition?.id
  );
  const composition = buildComposition(
    scenario,
    patient.id,
    practitioner.id,
    referringOrg.id,
    serviceRequest.id,
    condition?.id
  );

  // Compose entries — Composition must be first per FHIR document bundle rules
  const entries: FHIRBundleEntry[] = [
    {
      fullUrl: urn(composition.id),
      resource: composition.resource,
    },
    {
      fullUrl: urn(patient.id),
      resource: patient.resource,
    },
    {
      fullUrl: urn(practitioner.id),
      resource: practitioner.resource,
    },
    {
      fullUrl: urn(referringOrg.id),
      resource: referringOrg.resource,
    },
    {
      fullUrl: urn(receivingOrg.id),
      resource: receivingOrg.resource,
    },
    {
      fullUrl: urn(serviceRequest.id),
      resource: serviceRequest.resource,
    },
  ];

  if (condition) {
    entries.push({
      fullUrl: urn(condition.id),
      resource: condition.resource,
    });
  }

  const bundle: FHIRBundle = {
    resourceType: "Bundle",
    id: bundleId,
    meta: {
      profile: [PROFILES.bundle],
      lastUpdated: timestamp,
    },
    identifier: {
      system: "https://ereferral.doh.gov.ph/bundle-id",
      value: bundleId,
    },
    type: "document",
    timestamp,
    entry: entries,
  };

  return bundle;
}

/**
 * Returns a description of all scenario fields with types and descriptions.
 * Used by the `list_scenario_fields` MCP tool.
 */
export function getScenarioFieldDescriptions(): object {
  return {
    description:
      "Clinical scenario input shape for generating a PH eReferral FHIR Bundle",
    fields: {
      patient: {
        required: true,
        fields: {
          givenName: { type: "string", required: true, example: "Juan" },
          familyName: { type: "string", required: true, example: "dela Cruz" },
          gender: {
            type: "enum",
            required: true,
            values: ["male", "female", "other", "unknown"],
          },
          birthDate: {
            type: "string",
            required: true,
            format: "YYYY-MM-DD",
            example: "1985-04-15",
          },
          philsysId: { type: "string", required: false, example: "1234-5678-9012" },
          address: { type: "string", required: false, example: "123 Rizal St." },
          city: { type: "string", required: false, example: "Quezon City" },
          province: { type: "string", required: false, example: "Metro Manila" },
          phone: { type: "string", required: false, example: "+639171234567" },
        },
      },
      referringProvider: {
        required: true,
        fields: {
          givenName: { type: "string", required: true, example: "Maria" },
          familyName: { type: "string", required: true, example: "Santos" },
          prcLicense: { type: "string", required: false, example: "0123456" },
          phone: { type: "string", required: false, example: "+63271234567" },
        },
      },
      referringFacility: {
        required: true,
        fields: {
          name: { type: "string", required: true, example: "Barangay Health Center Tondo" },
          hfrCode: { type: "string", required: false, example: "PH-NCR-MNL-001" },
          address: { type: "string", required: false },
          city: { type: "string", required: false },
          province: { type: "string", required: false },
          phone: { type: "string", required: false },
        },
      },
      receivingFacility: {
        required: true,
        fields: {
          name: { type: "string", required: true, example: "Philippine General Hospital" },
          hfrCode: { type: "string", required: false, example: "PH-NCR-MNL-PGH" },
          address: { type: "string", required: false },
          city: { type: "string", required: false },
          province: { type: "string", required: false },
          phone: { type: "string", required: false },
        },
      },
      reason: {
        type: "string",
        required: true,
        example: "Severe hypertension uncontrolled on 2 medications — specialist evaluation needed",
      },
      diagnosis: {
        required: false,
        fields: {
          display: { type: "string", required: true, example: "Essential hypertension" },
          snomedCode: { type: "string", required: false, example: "59621000" },
          icd10Code: { type: "string", required: false, example: "I10" },
        },
      },
      priority: {
        type: "enum",
        required: false,
        default: "routine",
        values: ["routine", "urgent", "asap", "stat"],
      },
      requestedService: {
        required: false,
        fields: {
          display: { type: "string", required: true, example: "Cardiology consultation" },
          snomedCode: { type: "string", required: false, example: "397799006" },
        },
      },
      additionalNotes: { type: "string", required: false },
      urgencyNarrative: { type: "string", required: false },
    },
  };
}
