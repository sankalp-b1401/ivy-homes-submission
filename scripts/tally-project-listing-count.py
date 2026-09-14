import json

PROJECTS_FILE = "./data/projects.json"
LISTINGS_FILE = "./data/listings.json"

with open(PROJECTS_FILE, "r", encoding="utf-8") as f:
    projects = json.load(f)

with open(LISTINGS_FILE, "r", encoding="utf-8") as f:
    listings = json.load(f)

# map[project_id] = [actual_listing_count, reported_total_listings]
project_map = {
    project["project_id"]: [0, project["total_listings"]]
    for project in projects
}

for listing in listings:
    project_id = listing.get("project_id")
    if project_id in project_map:
        project_map[project_id][0] += 1

wrong_projects = {
    project_id: counts
    for project_id, counts in project_map.items()
    if counts[0] != counts[1]
}

print(f"Total projects: {len(project_map)}")
print(f"Projects with wrong listing count: {len(wrong_projects)}")

for project_id in sorted(wrong_projects):
    actual_count, reported_count = wrong_projects[project_id]
    print(f"{project_id}: actual={actual_count}, reported={reported_count}")
