import json
from datetime import datetime, timezone, timedelta

LISTINGS_FILE = "./data/listings.json"

# Assignment reference: 2026-09-10T00:00:00+05:30
REFERENCE = datetime.fromisoformat("2026-09-10T00:00:00+05:30")
START = REFERENCE - timedelta(days=7)

with open(LISTINGS_FILE, "r", encoding="utf-8") as f:
    listings = json.load(f)

count = 0

for listing in listings:
    posted_at = listing.get("posted_at")

    if not posted_at:
        continue

    # Handle timestamps ending in Z (UTC)
    dt = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))

    # Convert to IST
    dt_ist = dt.astimezone(timezone(timedelta(hours=5, minutes=30)))

    # [START, REFERENCE)
    if START <= dt_ist < REFERENCE:
        count += 1

print(f"Listings posted in the 7 days before REFERENCE: {count}")