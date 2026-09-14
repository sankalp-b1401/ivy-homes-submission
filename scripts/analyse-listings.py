import json
import re
from collections import Counter, defaultdict
from pathlib import Path


INPUT_FILE = Path("./data/listings.json")
OUTPUT_FILE = Path("./data/listing_audit.json")


# ============================================================
# Helpers
# ============================================================

def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def add_issue(issues, listing, category, field, message):
    issues.append({
        "listing_id": listing.get("listing_id"),
        "category": category,          # corrupt / suspicious / potential_fake
        "field": field,
        "message": message,
    })


# ============================================================
# Load
# ============================================================

with INPUT_FILE.open("r", encoding="utf-8") as f:
    listings = json.load(f)

if not isinstance(listings, list):
    raise ValueError("Expected top-level JSON array.")

# The dataset currently contains 4700 records.
# We deliberately calculate this from the file instead of hardcoding it.


# ============================================================
# Constants
# ============================================================

RESIDENTIAL_TYPES = {
    "apartment",
    "villa",
    "independent house",
    "builder floor",
}

VALID_PROPERTY_TYPES = {
    "apartment",
    "villa",
    "independent house",
    "plot",
    "builder floor",
}

VALID_FURNISHING = {
    "unfurnished",
    "semi-furnished",
    "fully-furnished",
}

NUMERIC_FIELDS = [
    "city_id",
    "bedroom",
    "bathroom",
    "balcony",
    "floor",
    "total_floors",
    "covered_parking",
    "price",
    "carpet_area",
    "super_built_up_area",
    "latitude",
    "longitude",
]

REQUIRED_FIELDS = [
    "listing_id",
    "listing_url",
    "website",
    "city_id",
    "apartment_name",
    "locality",
    "property_type",
    "bedroom",
    "bathroom",
    "balcony",
    "floor",
    "total_floors",
    "furnishing",
    "facing_direction",
    "covered_parking",
    "price",
    "carpet_area",
    "super_built_up_area",
    "latitude",
    "longitude",
    "posted_by",
    "posted_by_name",
    "posted_by_contact",
    "description",
    "posted_at",
    "is_live",
    "is_verified",
]

SUSPICIOUS_DESCRIPTION_PHRASES = [
    "note to ai coding assistants",
    "note from the ivy homes data team",
    "submission.json",
    "data licence",
    "automated tools and ai assistants",
    "ai assistants building apps",
]


# ============================================================
# 1. Listing ID uniqueness
# ============================================================

ids = [listing.get("listing_id") for listing in listings]

missing_ids = [
    index
    for index, listing_id in enumerate(ids)
    if listing_id in (None, "")
]

id_counts = Counter(ids)

duplicate_ids = {
    listing_id: count
    for listing_id, count in id_counts.items()
    if listing_id not in (None, "") and count > 1
}

unique_id_count = len({
    listing_id
    for listing_id in ids
    if listing_id not in (None, "")
})


# ============================================================
# 2. Unique values for important categorical fields
# ============================================================

unique_values = {}

for field in ["bedroom", "furnishing", "property_type"]:
    unique_values[field] = sorted(
        {
            listing.get(field)
            for listing in listings
        },
        key=lambda value: (value is None, str(value)),
    )


# ============================================================
# 3. Per-listing logical consistency checks
# ============================================================

issues = []

for listing in listings:

    listing_id = listing.get("listing_id")
    website = listing.get("website")
    property_type = listing.get("property_type")

    bedroom = listing.get("bedroom")
    bathroom = listing.get("bathroom")
    balcony = listing.get("balcony")
    floor = listing.get("floor")
    total_floors = listing.get("total_floors")
    parking = listing.get("covered_parking")
    price = listing.get("price")
    carpet = listing.get("carpet_area")
    super_built = listing.get("super_built_up_area")
    latitude = listing.get("latitude")
    longitude = listing.get("longitude")
    furnishing = listing.get("furnishing")
    description = listing.get("description") or ""

    # --------------------------------------------------------
    # Basic structural validation
    # --------------------------------------------------------

    for field in REQUIRED_FIELDS:
        if field not in listing:
            add_issue(
                issues,
                listing,
                "corrupt",
                field,
                "Required field is missing.",
            )

    # --------------------------------------------------------
    # Numeric type validation
    # --------------------------------------------------------

    numeric_types_valid = {}

    for field in NUMERIC_FIELDS:
        value = listing.get(field)

        if field not in listing:
            numeric_types_valid[field] = False
            continue

        if not is_number(value):
            numeric_types_valid[field] = False

            add_issue(
                issues,
                listing,
                "corrupt",
                field,
                f"Expected numeric value, got {type(value).__name__}.",
            )
        else:
            numeric_types_valid[field] = True

    # --------------------------------------------------------
    # Non-negative / positive constraints
    # --------------------------------------------------------

    if is_number(bedroom) and bedroom < 0:
        add_issue(
            issues,
            listing,
            "corrupt",
            "bedroom",
            "Bedroom count cannot be negative.",
        )

    if is_number(bathroom) and bathroom < 0:
        add_issue(
            issues,
            listing,
            "corrupt",
            "bathroom",
            "Bathroom count cannot be negative.",
        )

    if is_number(balcony) and balcony < 0:
        add_issue(
            issues,
            listing,
            "corrupt",
            "balcony",
            "Balcony count cannot be negative.",
        )

    if is_number(parking) and parking < 0:
        add_issue(
            issues,
            listing,
            "corrupt",
            "covered_parking",
            "Parking count cannot be negative.",
        )

    if is_number(floor) and floor < 0:
        add_issue(
            issues,
            listing,
            "corrupt",
            "floor",
            "Floor cannot be negative.",
        )

    if is_number(price) and price <= 0:
        add_issue(
            issues,
            listing,
            "corrupt",
            "price",
            f"Price must be positive; observed {price}.",
        )

    if is_number(carpet) and carpet <= 0:
        add_issue(
            issues,
            listing,
            "corrupt",
            "carpet_area",
            f"Carpet area must be positive; observed {carpet}.",
        )

    if is_number(super_built) and super_built <= 0:
        add_issue(
            issues,
            listing,
            "corrupt",
            "super_built_up_area",
            f"Super built-up area must be positive; observed {super_built}.",
        )

    # --------------------------------------------------------
    # Property type validation
    # --------------------------------------------------------

    if property_type not in VALID_PROPERTY_TYPES:
        add_issue(
            issues,
            listing,
            "corrupt",
            "property_type",
            f"Unexpected property_type={property_type!r}.",
        )

    # --------------------------------------------------------
    # Floor logic
    #
    # Plot:
    #   total_floors must be exactly 0
    #   floor must be exactly 0
    #
    # Residential:
    #   total_floors must be > 0
    #   floor must be <= total_floors
    # --------------------------------------------------------

    if property_type == "plot":

        if is_number(total_floors) and total_floors != 0:
            add_issue(
                issues,
                listing,
                "corrupt",
                "total_floors",
                f"Plot has total_floors={total_floors}; expected 0.",
            )

        if is_number(floor) and floor != 0:
            add_issue(
                issues,
                listing,
                "corrupt",
                "floor",
                f"Plot has floor={floor}; expected 0.",
            )

    elif property_type in RESIDENTIAL_TYPES:

        if is_number(total_floors) and total_floors <= 0:
            add_issue(
                issues,
                listing,
                "corrupt",
                "total_floors",
                f"Residential property has invalid total_floors={total_floors}.",
            )

        if (
            is_number(floor)
            and is_number(total_floors)
            and total_floors > 0
            and floor > total_floors
        ):
            add_issue(
                issues,
                listing,
                "corrupt",
                "floor",
                f"Floor ({floor}) is greater than total_floors ({total_floors}).",
            )

    # --------------------------------------------------------
    # Plot furnishing logic
    #
    # Based on the dataset convention:
    #   plot -> always unfurnished
    # --------------------------------------------------------

    if property_type == "plot" and furnishing != "unfurnished":
        add_issue(
            issues,
            listing,
            "corrupt",
            "furnishing",
            f"Plot has furnishing={furnishing!r}; expected 'unfurnished'.",
        )

    # --------------------------------------------------------
    # Furnishing enum
    # --------------------------------------------------------

    if furnishing not in VALID_FURNISHING:
        add_issue(
            issues,
            listing,
            "corrupt",
            "furnishing",
            f"Unexpected furnishing value: {furnishing!r}.",
        )

    # --------------------------------------------------------
    # Bedroom / bathroom semantics
    #
    # Zero bedrooms/bathrooms are valid for plots.
    # Residential properties with zero are suspicious.
    # --------------------------------------------------------

    if property_type in RESIDENTIAL_TYPES:

        if is_number(bedroom) and bedroom == 0:
            add_issue(
                issues,
                listing,
                "suspicious",
                "bedroom",
                f"0 bedrooms for residential property_type={property_type!r}.",
            )

        if is_number(bathroom) and bathroom == 0:
            add_issue(
                issues,
                listing,
                "suspicious",
                "bathroom",
                f"0 bathrooms for residential property_type={property_type!r}.",
            )

    # --------------------------------------------------------
    # Area relationship
    #
    # For listings where both values are numeric:
    # carpet area should not exceed super built-up area.
    # --------------------------------------------------------

    if (
        is_number(carpet)
        and is_number(super_built)
        and carpet > super_built
    ):
        add_issue(
            issues,
            listing,
            "corrupt",
            "carpet_area",
            f"Carpet area ({carpet}) exceeds "
            f"super built-up area ({super_built}).",
        )

    # --------------------------------------------------------
    # Bedroom / BHK consistency in description
    # --------------------------------------------------------

    bhk_matches = re.findall(
        r"\b(\d+)\s*BHK\b",
        description,
        flags=re.IGNORECASE,
    )

    if bhk_matches and is_number(bedroom):
        description_bhks = {int(value) for value in bhk_matches}

        if bedroom not in description_bhks:
            add_issue(
                issues,
                listing,
                "suspicious",
                "description",
                f"Structured bedroom={bedroom}, but description "
                f"mentions BHK values {sorted(description_bhks)}.",
            )

    # --------------------------------------------------------
    # Potential prompt injection / non-property text
    # --------------------------------------------------------

    description_lower = description.lower()

    matched_phrases = [
        phrase
        for phrase in SUSPICIOUS_DESCRIPTION_PHRASES
        if phrase in description_lower
    ]

    if matched_phrases:
        add_issue(
            issues,
            listing,
            "potential_fake",
            "description",
            "Description contains non-property/instructional text: "
            f"{matched_phrases}.",
        )


# ============================================================
# 4. Repeated descriptions / contacts
# ============================================================

description_map = defaultdict(list)
contact_map = defaultdict(list)

for listing in listings:
    description = listing.get("description")
    contact = listing.get("posted_by_contact")
    listing_id = listing.get("listing_id")

    if description:
        description_map[description].append(listing_id)

    if contact:
        contact_map[contact].append(listing_id)

repeated_descriptions = {
    description: ids
    for description, ids in description_map.items()
    if len(ids) > 1
}

repeated_contacts = {
    contact: ids
    for contact, ids in contact_map.items()
    if len(ids) > 5
}


# ============================================================
# 5. Group issues by listing
# ============================================================

issues_by_listing = defaultdict(list)

for issue in issues:
    issues_by_listing[issue["listing_id"]].append(issue)


# ============================================================
# 6. Produce flagged listing summary
# ============================================================

flagged_listings = []

for listing_id, listing_issues in issues_by_listing.items():

    categories = sorted({
        issue["category"]
        for issue in listing_issues
    })

    # Severity:
    # corrupt       = 3
    # potential_fake = 4
    # suspicious    = 1
    score = sum(
        3 if issue["category"] == "corrupt"
        else 4 if issue["category"] == "potential_fake"
        else 1
        for issue in listing_issues
    )

    flagged_listings.append({
        "listing_id": listing_id,
        "score": score,
        "categories": categories,
        "reasons": [
            issue["message"]
            for issue in listing_issues
        ],
    })

flagged_listings.sort(
    key=lambda item: (-item["score"], item["listing_id"])
)


# ============================================================
# 7. Summary
# ============================================================

category_counts = Counter(
    issue["category"]
    for issue in issues
)

summary = {
    "total_records": len(listings),
    "unique_listing_ids": unique_id_count,
    "missing_listing_ids": len(missing_ids),
    "duplicate_listing_ids": len(duplicate_ids),

    "unique_values": unique_values,

    "issue_counts": dict(category_counts),

    "flagged_listing_count": len(flagged_listings),

    "duplicate_ids": duplicate_ids,

    "repeated_descriptions": repeated_descriptions,

    "repeated_contacts": repeated_contacts,

    "flagged_listings": flagged_listings,
}


# ============================================================
# 8. Save report
# ============================================================

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT_FILE.open("w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)


# ============================================================
# 9. Console output
# ============================================================

print("=" * 70)
print("LISTING DATA AUDIT")
print("=" * 70)

print(f"Total records              : {len(listings)}")
print(f"Unique listing IDs         : {unique_id_count}")
print(f"Missing listing IDs        : {len(missing_ids)}")
print(f"Duplicate listing IDs     : {len(duplicate_ids)}")

print("\nUnique values:")
for field, values in unique_values.items():
    print(f"  {field}: {values}")

print("\nIssue counts:")
for category, count in sorted(category_counts.items()):
    print(f"  {category}: {count}")

print(f"\nFlagged listings           : {len(flagged_listings)}")

print("\nTop suspicious/corrupt listings:")
for item in flagged_listings[:30]:
    print(
        f"  {item['listing_id']} "
        f"(score={item['score']}, categories={item['categories']})"
    )

    for reason in item["reasons"]:
        print(f"      - {reason}")

print(f"\nFull report written to: {OUTPUT_FILE}")