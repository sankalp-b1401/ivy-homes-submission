import json
import math
from pathlib import Path
from collections import defaultdict
from statistics import median

INPUT_FILE = Path('./data/listings.json')
OUTPUT_FILE = Path('./data/fake_listing_analysis.json')

# Comparable-property parameters
AREA_TOLERANCE = 0.05          # 5% for carpet and super-built-up area
MIN_PEERS = 10                 # minimum comparable listings excluding candidate/corrupt records
MIN_MAD = 0.05                 # floor for log-price MAD to avoid zero dispersion
MODIFIED_Z_THRESHOLD = 3.5     # robust outlier threshold
EXTREME_PRICE_RATIO = 0.50     # <50% or >200% of comparable median => strong signal

# Q4 corrupt listings supplied by the audit.
CORRUPT_LISTING_IDS = {
    "SQU-1001894","DWE-1000934","MAG-1000452","MAG-1003078","MAG-1004552","SQU-1002491","ZER-1001070","100-1000372","100-1000686","100-1000718","100-1000972","100-1000989","100-1001039","100-1001077","100-1001114","100-1001204","100-1001300","100-1001447","100-1001493","100-1001581","100-1001789","100-1002016","100-1002081","100-1002092","100-1002118","100-1002301","100-1002346","100-1002382","100-1002442","100-1002527","100-1002817","100-1002884","100-1002914","100-1003117","100-1003155","100-1003205","100-1003529","100-1003666","100-1003708","100-1004038","100-1004130","100-1004495","DWE-1000018","DWE-1000099","DWE-1000114","DWE-1000379","DWE-1000470","DWE-1000486","DWE-1000696","DWE-1001036","DWE-1001165","DWE-1001183","DWE-1001499","DWE-1001524","DWE-1001553","DWE-1001749","DWE-1001824","DWE-1001909","DWE-1001967","DWE-1002125","DWE-1002315","DWE-1002381","DWE-1002938","DWE-1002955","DWE-1002999","DWE-1003045","DWE-1003339","DWE-1003402","DWE-1003480","DWE-1003664","DWE-1003673","DWE-1003892","DWE-1004331","DWE-1004618","DWE-1004632","MAG-1000179","MAG-1000331","MAG-1000431","MAG-1000885","MAG-1000892","MAG-1001118","MAG-1001374","MAG-1001430","MAG-1001458","MAG-1001676","MAG-1002699","MAG-1002723","MAG-1003137","MAG-1003269","MAG-1003323","MAG-1003336","MAG-1003409","MAG-1003428","MAG-1003510","MAG-1004036","MAG-1004042","MAG-1004094","MAG-1004115","MAG-1004213","MAG-1004449","MAG-1004647","SQU-1000283","SQU-1000522","SQU-1000537","SQU-1000551","SQU-1000598","SQU-1000623","SQU-1000979","SQU-1000980","SQU-1001090","SQU-1001404","SQU-1001413","SQU-1001879","SQU-1001921","SQU-1002059","SQU-1002538","SQU-1002634","SQU-1002843","SQU-1003177","SQU-1003551","SQU-1003694","SQU-1004357","SQU-1004422","ZER-1000172","ZER-1000500","ZER-1000520","ZER-1001014","ZER-1001207","ZER-1001218","ZER-1001249","ZER-1001282","ZER-1001320","ZER-1001334","ZER-1001702","ZER-1001809","ZER-1002121","ZER-1002283","ZER-1002378","ZER-1002632","ZER-1002667","ZER-1002686","ZER-1002911","ZER-1003173","ZER-1003191","ZER-1003237","ZER-1003313","ZER-1003426","ZER-1003462","ZER-1003528","ZER-1003797","ZER-1003802","ZER-1003805","ZER-1003857","ZER-1004167","ZER-1004317","ZER-1004612","100-1000753","100-1002512","100-1003624","DWE-1000614","MAG-1002362","ZER-1000260","ZER-1002586","ZER-1003603"
}


def valid_number(value):
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def normalize_text(value):
    if not isinstance(value, str):
        return ''
    return ' '.join(value.lower().split())


def relative_diff(a, b):
    return abs(a - b) / max(a, b)


def comparable(a, b):
    """
    A pair is comparable when locality, bedroom count, property type,
    and furnishing match exactly, while both area measures are within 5%.
    """
    if normalize_text(a.get('locality')) != normalize_text(b.get('locality')):
        return False
    if a.get('bedroom') != b.get('bedroom'):
        return False
    if normalize_text(a.get('property_type')) != normalize_text(b.get('property_type')):
        return False
    if normalize_text(a.get('furnishing')) != normalize_text(b.get('furnishing')):
        return False

    ca, cb = a.get('carpet_area'), b.get('carpet_area')
    sa, sb = a.get('super_built_up_area'), b.get('super_built_up_area')

    if not all(valid_number(v) and v > 0 for v in (ca, cb, sa, sb)):
        return False

    return (
        relative_diff(ca, cb) <= AREA_TOLERANCE
        and relative_diff(sa, sb) <= AREA_TOLERANCE
    )


def modified_z_score(log_price, med, mad):
    return 0.6745 * (log_price - med) / max(mad, MIN_MAD)


def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f'Input file not found: {INPUT_FILE.resolve()}')

    with INPUT_FILE.open('r', encoding='utf-8') as f:
        listings = json.load(f)

    if not isinstance(listings, list):
        raise ValueError('Expected a top-level JSON array.')

    # Corrupt records must not influence the benchmark and must not be
    # classified as fake in this analysis.
    analysis_pool = [
        x for x in listings
        if x.get('listing_id') not in CORRUPT_LISTING_IDS
    ]

    usable = [
        x for x in analysis_pool
        if valid_number(x.get('price')) and x['price'] > 0
        and valid_number(x.get('carpet_area')) and x['carpet_area'] > 0
        and valid_number(x.get('super_built_up_area')) and x['super_built_up_area'] > 0
        and isinstance(x.get('locality'), str) and x.get('locality').strip()
        and valid_number(x.get('bedroom'))
        and isinstance(x.get('property_type'), str) and x.get('property_type').strip()
        and isinstance(x.get('furnishing'), str) and x.get('furnishing').strip()
    ]

    # Block on categorical attributes. Area matching is done inside each block.
    blocks = defaultdict(list)
    for idx, listing in enumerate(usable):
        key = (
            normalize_text(listing['locality']),
            listing['bedroom'],
            normalize_text(listing['property_type']),
            normalize_text(listing['furnishing']),
        )
        blocks[key].append(idx)

    candidates = []

    for idx, listing in enumerate(usable):
        key = (
            normalize_text(listing['locality']),
            listing['bedroom'],
            normalize_text(listing['property_type']),
            normalize_text(listing['furnishing']),
        )

        peers = []
        for peer_idx in blocks[key]:
            if peer_idx == idx:
                continue
            peer = usable[peer_idx]
            if comparable(listing, peer):
                peers.append(peer)

        if len(peers) < MIN_PEERS:
            continue

        log_prices = [math.log(p['price']) for p in peers]
        med = median(log_prices)
        mad = median(abs(x - med) for x in log_prices)

        candidate_log = math.log(listing['price'])
        z = modified_z_score(candidate_log, med, mad)
        comparable_median = math.exp(med)
        price_ratio = listing['price'] / comparable_median

        is_statistical_outlier = abs(z) >= MODIFIED_Z_THRESHOLD
        is_extreme_price = (
            price_ratio < EXTREME_PRICE_RATIO
            or price_ratio > 1 / EXTREME_PRICE_RATIO
        )

        if not (is_statistical_outlier or is_extreme_price):
            continue

        reasons = []
        if is_statistical_outlier:
            reasons.append(
                f'absolute modified z-score {abs(z):.4f} >= {MODIFIED_Z_THRESHOLD}'
            )
        if is_extreme_price:
            if price_ratio < EXTREME_PRICE_RATIO:
                reasons.append(
                    f'price is only {price_ratio:.4f}x comparable median '
                    f'(< {EXTREME_PRICE_RATIO:.2f}x)'
                )
            else:
                reasons.append(
                    f'price is {price_ratio:.4f}x comparable median '
                    f'(> {1 / EXTREME_PRICE_RATIO:.2f}x)'
                )

        candidates.append({
            'listing_id': listing.get('listing_id'),
            'listing': listing,
            'peer_count': len(peers),
            'comparable_median_price': round(comparable_median, 2),
            'price': listing['price'],
            'price_ratio_to_median': round(price_ratio, 6),
            'modified_z_score': round(z, 6),
            'mad_log_price': round(mad, 6),
            'classification': (
                'extreme_price_anomaly'
                if is_statistical_outlier and is_extreme_price
                else 'statistical_price_anomaly'
            ),
            'reason': '; '.join(reasons),
            'benchmark_definition': {
                'locality': listing['locality'],
                'bedroom': listing['bedroom'],
                'property_type': listing['property_type'],
                'furnishing': listing['furnishing'],
                'carpet_area_tolerance_percent': AREA_TOLERANCE * 100,
                'super_built_up_area_tolerance_percent': AREA_TOLERANCE * 100,
                'min_peer_count': MIN_PEERS,
            },
        })

    candidates.sort(
        key=lambda x: (
            -abs(x['modified_z_score']),
            -abs(math.log(x['price_ratio_to_median'])),
            x['listing_id'] or '',
        )
    )

    summary = {
        'total_records': len(listings),
        'corrupt_records_excluded': len(CORRUPT_LISTING_IDS),
        'non_corrupt_records_analyzed': len(analysis_pool),
        'usable_records': len(usable),
        'parameters': {
            'grouping_fields': [
                'locality',
                'bedroom',
                'property_type',
                'furnishing',
            ],
            'area_fields': [
                'carpet_area',
                'super_built_up_area',
            ],
            'area_tolerance_percent': AREA_TOLERANCE * 100,
            'minimum_comparable_peers': MIN_PEERS,
            'outlier_space': 'log(price)',
            'modified_z_threshold': MODIFIED_Z_THRESHOLD,
            'extreme_price_ratio_threshold': EXTREME_PRICE_RATIO,
            'leave_one_out': True,
            'corrupt_records_excluded_from_benchmark': True,
            'corrupt_records_excluded_from_candidate_analysis': True,
        },
        'candidate_count': len(candidates),
        'candidates': candidates,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open('w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print(f'Total records: {len(listings)}')
    print(f'Corrupt records excluded: {len(CORRUPT_LISTING_IDS)}')
    print(f'Usable records analyzed: {len(usable)}')
    print(f'Fake candidates / extreme price anomalies: {len(candidates)}')
    print(f'Output: {OUTPUT_FILE}')
    print('\nTop candidates:')
    for row in candidates[:20]:
        print(
            f"{row['listing_id']}: price={row['price']}, "
            f"median={row['comparable_median_price']}, "
            f"ratio={row['price_ratio_to_median']}, "
            f"mz={row['modified_z_score']}, "
            f"peers={row['peer_count']} -- {row['reason']}"
        )


if __name__ == '__main__':
    main()
