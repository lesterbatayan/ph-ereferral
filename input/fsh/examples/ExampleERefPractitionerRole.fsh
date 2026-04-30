// TDG Mappings:
// - REF-1: Name of Referring Practitioner (practitioner reference)
// - REF-2: Practitioner Role (code)
// - REF-5: Initiating Facility Name (organization reference)
// - REF-6: Initiating Facility NHFR Code (organization.identifier)
// - REF-7: Initiating Facility Address (organization.address)
// - REF-8: Initiating Facility Contact Number (organization.telecom)
Instance: ExampleERefPractitionerRole
InstanceOf: ERefPractitionerRole
Usage: #example
Title: "Example Referring Practitioner Role"
Description: "Example referring practitioner role linking practitioner to facility for the Philippines eReferral workflow."

// REF-1: Practitioner reference
* practitioner = Reference(ExampleERefPractitioner)
// REF-5: Organization reference
* organization = Reference(ExampleERefReferringFacility)

* identifier.system = "urn:oid:2.16.840.1.113883.2.9.4.3.3"
* identifier.value = "MD-98765"
* active = true
// REF-2: Practitioner Role
* code = $sct#158965000 "Medical practitioner"
* specialty = $sct#419192003 "Internal medicine"
* telecom.system = #phone
* telecom.value = "+63 2 8123 4567"
* telecom.use = #work
