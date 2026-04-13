/**
 * Lean FHIR R4 type interfaces for PH eReferral bundle generation.
 * Based on the PH eReferral Implementation Guide profiles.
 */

export interface FHIRCoding {
  system: string;
  code: string;
  display?: string;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIRIdentifier {
  system?: string;
  value: string;
}

export interface FHIRReference {
  reference: string;
  display?: string;
}

export interface FHIRHumanName {
  use?: "official" | "usual" | "temp" | "nickname" | "anonymous" | "old" | "maiden";
  family?: string;
  given?: string[];
  text?: string;
}

export interface FHIRAddress {
  use?: "home" | "work" | "temp" | "old" | "billing";
  type?: "postal" | "physical" | "both";
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FHIRContactPoint {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
}

export interface FHIRMeta {
  profile?: string[];
  lastUpdated?: string;
}

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: FHIRMeta;
  [key: string]: unknown;
}

export interface FHIRPatient extends FHIRResource {
  resourceType: "Patient";
  identifier?: FHIRIdentifier[];
  name?: FHIRHumanName[];
  telecom?: FHIRContactPoint[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  address?: FHIRAddress[];
  maritalStatus?: FHIRCodeableConcept;
  extension?: FHIRExtension[];
}

export interface FHIRPractitioner extends FHIRResource {
  resourceType: "Practitioner";
  identifier?: FHIRIdentifier[];
  name?: FHIRHumanName[];
  telecom?: FHIRContactPoint[];
  address?: FHIRAddress[];
  qualification?: Array<{
    identifier?: FHIRIdentifier[];
    code: FHIRCodeableConcept;
    issuer?: FHIRReference;
  }>;
}

export interface FHIROrganization extends FHIRResource {
  resourceType: "Organization";
  identifier?: FHIRIdentifier[];
  name?: string;
  telecom?: FHIRContactPoint[];
  address?: FHIRAddress[];
  type?: FHIRCodeableConcept[];
}

export interface FHIRCondition extends FHIRResource {
  resourceType: "Condition";
  clinicalStatus: FHIRCodeableConcept;
  verificationStatus?: FHIRCodeableConcept;
  category?: FHIRCodeableConcept[];
  code?: FHIRCodeableConcept;
  subject: FHIRReference;
  onsetDateTime?: string;
  note?: Array<{ text: string }>;
}

export interface FHIRServiceRequest extends FHIRResource {
  resourceType: "ServiceRequest";
  status: "draft" | "active" | "on-hold" | "revoked" | "completed" | "entered-in-error" | "unknown";
  intent: "proposal" | "plan" | "directive" | "order" | "original-order" | "reflex-order" | "filler-order" | "instance-order" | "option";
  category?: FHIRCodeableConcept[];
  priority?: "routine" | "urgent" | "asap" | "stat";
  code?: FHIRCodeableConcept;
  subject: FHIRReference;
  requester?: FHIRReference;
  performer?: FHIRReference[];
  reasonCode?: FHIRCodeableConcept[];
  reasonReference?: FHIRReference[];
  note?: Array<{ text: string }>;
  occurrenceDateTime?: string;
  authoredOn?: string;
}

export interface FHIRComposition extends FHIRResource {
  resourceType: "Composition";
  status: "preliminary" | "final" | "amended" | "entered-in-error";
  type: FHIRCodeableConcept;
  subject?: FHIRReference;
  date: string;
  author: FHIRReference[];
  title: string;
  confidentiality?: string;
  attester?: Array<{
    mode: string;
    time?: string;
    party?: FHIRReference;
  }>;
  custodian?: FHIRReference;
  section?: FHIRCompositionSection[];
}

export interface FHIRCompositionSection {
  title?: string;
  code?: FHIRCodeableConcept;
  entry?: FHIRReference[];
  text?: { status: string; div: string };
}

export interface FHIRExtension {
  url: string;
  valueString?: string;
  valueCode?: string;
  valueCodeableConcept?: FHIRCodeableConcept;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueReference?: FHIRReference;
}

export interface FHIRBundleEntry {
  fullUrl: string;
  resource: FHIRResource;
  request?: {
    method: "POST" | "PUT" | "GET" | "DELETE" | "PATCH";
    url: string;
  };
}

export interface FHIRBundle extends FHIRResource {
  resourceType: "Bundle";
  identifier?: FHIRIdentifier;
  type: "document" | "message" | "transaction" | "transaction-response" | "batch" | "batch-response" | "history" | "searchset" | "collection";
  timestamp?: string;
  entry?: FHIRBundleEntry[];
}
