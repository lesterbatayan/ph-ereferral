// TDG Mappings:
// - REF-5: Initiating Facility Name (Organization.name)
// - REF-6: Initiating Facility NHFR Code (Organization.identifier[NHFR])
// - REF-7: Initiating Facility Address (Organization.address)
// - REF-8: Initiating Facility Contact Number (Organization.telecom)
Instance: ExampleERefReferringFacility
InstanceOf: PHCoreOrganization
Usage: #example
Title: "Example Referring Facility"
Description: "Example referring healthcare facility for the Philippines eReferral workflow."

// REF-6: Initiating Facility NHFR Code
* identifier[0].system = "https://nhfr.doh.gov.ph/facility"
* identifier[0].value = "DOH000000000001234"
* identifier[0].type = $v2-0203#FI "Facility ID"
* active = true
// REF-5: Initiating Facility Name
* name = "Manila General Hospital - Barangay 143 Health Center"
* type = $v3-roleCode#HOSP "Hospital"
// REF-8: Initiating Facility Contact Number
* telecom[0].system = #phone
* telecom[0].value = "+63 2 8123 4567"
* telecom[0].use = #work
* telecom[1].system = #email
* telecom[1].value = "contact@manilagenhosp.ph"
* telecom[1].use = #work
// REF-7: Initiating Facility Address
* address.use = #work
* address.type = #both
* address.text = "123 Rizal Avenue, Barangay 143, Manila, Philippines"
* address.line = "123 Rizal Avenue"
* address.city = "Manila"
* address.district = "Barangay 143"
* address.state = "Metro Manila"
* address.postalCode = "1000"
* address.country = "PH"
