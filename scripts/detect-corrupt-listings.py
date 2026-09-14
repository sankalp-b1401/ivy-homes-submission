import json


AUDIT_FILE = "./data/listing_audit.json"
LISTINGS_FILE = "./data/listings.json"
OUTPUT_FILE = "./data/flagged_listing.json"


def main():
    # -----------------------------
    # 1. Load audit results
    # -----------------------------
    with open(AUDIT_FILE, "r", encoding="utf-8") as f:
        audit = json.load(f)

    flagged_listings = audit["flagged_listings"]

    # -----------------------------
    # 2. Load all listings
    # -----------------------------
    with open(LISTINGS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Support either:
    #   [...]
    # or
    #   {"results": [...]}
    if isinstance(data, dict):
        all_listings = data["results"]
    else:
        all_listings = data

    # Index by listing_id for fast lookup
    listings_by_id = {
        listing["listing_id"]: listing
        for listing in all_listings
    }

    # -----------------------------
    # 3. Match flagged IDs
    #    and attach suspicion info
    # -----------------------------
    results = []
    missing = []

    for flagged in flagged_listings:
        listing_id = flagged["listing_id"]

        listing = listings_by_id.get(listing_id)

        if listing is None:
            missing.append(listing_id)
            continue

        # Copy original listing
        result = dict(listing)

        # Attach audit information
        result["suspicion"] = {
            "score": flagged.get("score"),
            "categories": flagged.get("categories", []),
            "reasons": flagged.get("reasons", [])
        }

        results.append(result)

    # -----------------------------
    # 4. Build output
    # -----------------------------
    output = {
        "total_count": len(flagged_listings),
        "matched_count": len(results),
        "missing_count": len(missing),
        "missing_listing_ids": missing,
        "listings": results
    }

    # -----------------------------
    # 5. Save
    # -----------------------------
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Flagged listings : {len(flagged_listings)}")
    print(f"Matched          : {len(results)}")
    print(f"Missing          : {len(missing)}")
    print(f"Output           : {OUTPUT_FILE}")


if __name__ == "__main__":
    main()