import json
import math
import re
from collections import defaultdict
from pathlib import Path

INPUT_FILE = Path('./data/listings.json')
OUTPUT_FILE = Path('./data/duplicate_listings.json')
COORD_TOLERANCE_METERS = 100.0
AREA_TOLERANCE = 0.03


def normalize_text(value):
    if value is None:
        return ''
    value = str(value).lower().strip()
    value = re.sub(r'[^a-z0-9]+', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()


def haversine_m(lat1, lon1, lat2, lon2):
    r = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def coords_match(a, b):
    vals = [a.get('latitude'), a.get('longitude'), b.get('latitude'), b.get('longitude')]
    if not all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in vals):
        return False, None
    d = haversine_m(a['latitude'], a['longitude'], b['latitude'], b['longitude'])
    return d <= COORD_TOLERANCE_METERS, d


def area_match(a, b):
    x, y = a.get('carpet_area'), b.get('carpet_area')
    if not all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in (x, y)):
        return False
    if x <= 0 or y <= 0:
        return False
    return abs(x - y) / max(x, y) <= AREA_TOLERANCE


def main():
    with INPUT_FILE.open('r', encoding='utf-8') as f:
        listings = json.load(f)
    if not isinstance(listings, list):
        raise ValueError('Expected listings.json to contain a top-level JSON array.')

    # Block by the fields required to be identical before corroboration.
    blocks = defaultdict(list)
    for i, listing in enumerate(listings):
        key = (
            normalize_text(listing.get('apartment_name')),
            normalize_text(listing.get('locality')),
            listing.get('bedroom'),
            listing.get('floor'),
        )
        blocks[key].append(i)

    # Type 1 ONLY:
    # same block + coordinates within 100m + carpet area within 3%.
    # No type 2/3 matches are retained.
    type1_edges = []
    parent = list(range(len(listings)))
    rank = [0] * len(listings)

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        a, b = find(a), find(b)
        if a == b:
            return
        if rank[a] < rank[b]:
            a, b = b, a
        parent[b] = a
        if rank[a] == rank[b]:
            rank[a] += 1

    for indices in blocks.values():
        if len(indices) < 2:
            continue
        for pos, i in enumerate(indices):
            for j in indices[pos + 1:]:
                coord_ok, distance = coords_match(listings[i], listings[j])
                area_ok = area_match(listings[i], listings[j])
                if coord_ok and area_ok:
                    union(i, j)
                    type1_edges.append({
                        'a': i,
                        'b': j,
                        'coordinate_distance_m': round(distance, 3),
                        'carpet_area_a': listings[i].get('carpet_area'),
                        'carpet_area_b': listings[j].get('carpet_area'),
                        'different_websites': listings[i].get('website') != listings[j].get('website'),
                    })

    components = defaultdict(list)
    for i in range(len(listings)):
        components[find(i)].append(i)

    groups = []
    for members in components.values():
        if len(members) < 2:
            continue
        s = set(members)
        edges = [e for e in type1_edges if e['a'] in s and e['b'] in s]
        groups.append({
            'duplicate_type': 1,
            'confidence': 'high' if any(e['different_websites'] for e in edges) else 'lower',
            'size': len(members),
            'listing_ids': sorted(listings[i].get('listing_id') for i in members),
            'match_evidence': [
                {
                    'listing_id_a': listings[e['a']].get('listing_id'),
                    'listing_id_b': listings[e['b']].get('listing_id'),
                    **{k: v for k, v in e.items() if k not in ('a', 'b')},
                }
                for e in sorted(edges, key=lambda e: (listings[e['a']].get('listing_id'), listings[e['b']].get('listing_id')))
            ],
            'listings': [listings[i] for i in sorted(members, key=lambda i: listings[i].get('listing_id') or '')],
        })

    groups.sort(key=lambda g: g['listing_ids'])
    output = {
        'total_listings': len(listings),
        'duplicate_type': 1,
        'criteria': {
            'blocking_fields': ['normalized_apartment_name', 'locality', 'bedroom', 'floor'],
            'coordinate_tolerance_meters': COORD_TOLERANCE_METERS,
            'carpet_area_tolerance_percent': AREA_TOLERANCE * 100,
            'rule': 'same block AND coordinates within 100m AND carpet area within 3%',
        },
        'total_duplicate_groups': len(groups),
        'total_listings_in_duplicate_groups': sum(g['size'] for g in groups),
        'groups': groups,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open('w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f'Total listings: {len(listings)}')
    print(f'Type 1 duplicate groups: {len(groups)}')
    print(f'Listings in type 1 groups: {sum(g["size"] for g in groups)}')
    print(f'Saved to: {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
