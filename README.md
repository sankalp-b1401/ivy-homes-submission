# Ivy Homes — Property Portal & API Audit

## How to Run the App

The web application is deployed on Vercel: 


1. **Visit the website at this URL**: https://sankalp-ivy-homes.vercel.app/
2. **Enter user name and password**:
   - **User Name**: `demo1@ivy.homes` (or `demo2@ivy.homes` / `demo3@ivy.homes`)
   - **Password**: `70086d1d16`

*(To run locally)*:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## API Documentation Alignment Logs

### Approach

I am comfortable with interacting with the API via terminal so I started with cleansing `API_REFERENCE.md` first. My plan is to align the `API_REFERENCE.md` with the actual API (the only source of truth) and then use that contract to build the frontend.

```
Read the documentation at every step -> Test the claim ? If VALID move on : If INVALID plan my hypothesis -> Run my hypothesis by the LLM -> Test the hypothesis -> Update the documentation
```

---

### Findings

#### 1. Description of attaching API Key with every request was wrong

Sending the key as a query parameter (`?api_key=...`) does **not** work. The API returns an error:

```json
{
  "detail": "send your key in the X-API-Key request header, not as a query parameter"
}
```

I tested the suggestion from the above error:

```bash
curl.exe -X POST -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" -d '{\"email\": \"demo1@ivy.homes\", \"password\": \"$MY_PASSWORD\"}' https://solve.ivy.homes/auth/login
```

**Response:**

```json
{
  "access_token": "eyJleHAiOjE3ODkzMTIzNjAsImlhdCI6MTc4OTMxMTQ2MCwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzJAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.o9WLERU0aahybG9Pe2ov5NKz3jr9UlxmUkDRZNUUvPQ",
  "refresh_token": "eyJleHAiOjE3ODk5MTYyNjAsImlhdCI6MTc4OTMxMTQ2MCwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzJAaXZ5LmhvbWVzIiwidHlwIjoicmVmcmVzaCJ9.sTZZUHnMDs4FJPuojOq8erVvfK_N1Ssbdgkl59yNng4",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_url": "/auth/refresh",
  "user": { "email": "demo1@ivy.homes" }
}
```

---

#### 2. Invalid `/auth/login` response structure and description

The document claims:

**(i)** The expected response structure is as follows:

```json
{
  "token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": { "email": "demo1@ivy.homes", "name": "Demo User" }
}
```

But after authentication, this was the actual response I received:

```json
{
  "access_token": "eyJleHAiOjE3ODkzMTIzNjAsImlhdCI6MTc4OTMxMTQ2MCwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzJAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.o9WLERU0aahybG9Pe2ov5NKz3jr9UlxmUkDRZNUUvPQ",
  "refresh_token": "eyJleHAiOjE3ODk5MTYyNjAsImlhdCI6MTc4OTMxMTQ2MCwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzJAaXZ5LmhvbWVzIiwidHlwIjoicmVmcmVzaCJ9.sTZZUHnMDs4FJPuojOq8erVvfK_N1Ssbdgkl59yNng4",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_url": "/auth/refresh",
  "user": { "email": "demo1@ivy.homes" }
}
```

**(ii)** It also says that tokens are valid for **24 hours** but as it can be observed from the actual response, the token `"expires_in": 900` which is only **15 minutes**.

**(iii)** It also claims **there is no refresh flow** but the response does contain a `refresh_token` implying the refresh flow does exist and the token refreshes after every 15 minutes. I also verified that `/auth/refresh` works as expected:

```bash
curl.exe -X POST -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" -d '{\"refresh_token\": \"eyJleHAiOjE3ODk5MTYyNjAsImlhdCI6MTc4OTMxMTQ2MCwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzJAaXZ5LmhvbWVzIiwidHlwIjoicmVmcmVzaCJ9.sTZZUHnMDs4FJPuojOq8erVvfK_N1Ssbdgkl59yNng4\"}' https://solve.ivy.homes/auth/refresh
```

```json
{
  "access_token": "eyJleHAiOjE3ODkzMTQ3NjAsImlhdCI6MTc4OTMxMzg2MCwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzJAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.IvJ1Tpd9j7sknPQ7vPNGdkJaPgin22E-O_GCARw85rA",
  "refresh_token": "eyJleHAiOjE3ODk5MTg2NjAsImlhdCI6MTc4OTMxMzg2MCwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzJAaXZ5LmhvbWVzIiwidHlwIjoicmVmcmVzaCJ9.sFxRZwi9V7hqMZBSKcoMLpKHuYVLpASAFFsDVCACvVM",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_url": "/auth/refresh",
  "user": { "email": "demo1@ivy.homes" }
}
```

**(iv)** Lastly the `user` field only contains `email` parameter (no `name` parameter).

---

#### 3. `/auth/logout` does not invalidate token on server-side

This one was a little complicated. When I accessed the `/auth/logout` endpoint via:

```bash
curl.exe -X POST -H "X-API-Key: $API_KEY" -H "Authorization: Bearer eyJleHAiOjE3ODkzMDcwMjksImlhdCI6MTc4OTMwNjEyOSwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.yVIzzPN4rn1rv2SPjX_PuZyhvkEOwLRVbAOfg8HGKD0" https://solve.ivy.homes/auth/logout
```

I received the message that revealed that tokens have to be discarded on the client side:

```json
{ "ok": true, "note": "tokens are stateless; discard them client side" }
```

So the claim documentation makes about token being discarded at server-side is wrong.

There's one more thing I checked before moving forward and it was how the server responds to expired tokens. Because even if the frontend code handles the tokens from client-side, there's a possibility that I can copy the token before discarding it. Discarding from client-side simply means browser stops storing the `access_token` in its local storage. I had two observations:

1. The server continues to support the discarded `access_token` as long as they are not expired.
2. The behavior is the same for the `refresh_token`. But because an expired `refresh_token` is still usable, it can be used to generate new `access_tokens` even if the current one expires.

This ends when the `refresh_token` is expired itself. The tokens here are in form: `PAYLOAD.SIGNATURE` so I decoded the payload part for a `refresh_token`:

```json
"refresh_token":"eyJleHAiOjE3ODk5MjYzNjEsImlhdCI6MTc4OTMyMTU2MSwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoicmVmcmVzaCJ9.CPEcF1GEsUINpAY53SNx2VfLo0o6wMVK-zRuGkTlhsg"
```

Here:

```json
PAYLOAD = "eyJleHAiOjE3ODk5MjYzNjEsImlhdCI6MTc4OTMyMTU2MSwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoicmVmcmVzaCJ9"
SIGNATURE = "CPEcF1GEsUINpAY53SNx2VfLo0o6wMVK-zRuGkTlhsg"
```

On decoding the payload, I got:

```json
{
  "exp": 1789926361,
  "iat": 1789321561,
  "key": "IVY26-CA27404EE7C9",
  "sub": "demo1@ivy.homes",
  "typ": "refresh"
}
```

> $$1789926361 - 1789321561 = 604800 \text{ seconds} = 7 \text{ days}$$

Therefore, the `refresh_token` expires **after 7 days** so until then even if a token is discarded from client side. I reached this hypothesis by testing the endpoints with the following procedure:

1. POST `/auth/login` to generate a new `access_token` and `refresh_token`.
2. POST `/auth/logout` to discard token from client side (I do this step before the `access_token` expires).
3. GET `/v1/listings` and use the discarded `access_token` (not yet expired) in the `Authorization` header. As stated above, the token successfully authorized me and fetched the data.
4. Repeat step 3 after 15 minutes (when the `access_token` has expired). In this case the request failed and I received the message: `{"detail":"access token expired - POST /auth/refresh with your refresh_token"}`
5. Once the `access_token` expires, it can not be used again, but the `refresh_token` is still not expired (7 days age) even though we discarded the tokens. So, POST `/auth/refresh` with `refresh_token` in the request body. I was able to generate a new `access_token`:

```bash
curl.exe -X POST -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" -d '{\"refresh_token\": \"eyJleHAiOjE3ODk5MjYzNjEsImlhdCI6MTc4OTMyMTU2MSwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoicmVmcmVzaCJ9.CPEcF1GEsUINpAY53SNx2VfLo0o6wMVK-zRuGkTlhsg\"}' https://solve.ivy.homes/auth/refresh
```

```json
{
  "access_token": "eyJleHAiOjE3ODkzMjUwODIsImlhdCI6MTc4OTMyNDE4Miwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.8CiBJ6tnwGjiGMeQaSg_Qwi8DcHlj3ASE7d2Zk-NZHg",
  "refresh_token": "eyJleHAiOjE3ODk5Mjg5ODIsImlhdCI6MTc4OTMyNDE4Miwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoicmVmcmVzaCJ9.BhU70o0XXiRc_HJMqiOa1SRb8wZisgoeR0CExprvDps",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_url": "/auth/refresh",
  "user": { "email": "demo1@ivy.homes" }
}
```

6. Repeat Step 3 with the new `access_token`. As suspected, I was able to fetch data from the endpoint.

---

#### 4. The `listing` object in `/v1/listings` also has an `is_live` field

The `listing` object structure defined in the documentation does not contain the `is_live` field. My hypothesis is that earlier they may have been only fetching the active listings (also claimed in the documentation), but the current API fetches all listings and the `is_live` field tells us whether this listing is active or not.

```json
{
  "listing_id": "MAG-1002627",
  "listing_url": "https://www.magichomes.com/property/1002627",
  "posted_at": "2026-06-14T21:03:00Z",
  "is_live": true
}
```

As per the documentation `v1/listings` returns only the **active** listings and is thus safe to show the results directly to the user. But based on my hypothesis the API response says otherwise and we would therefore have to filter the listing on client-side to only display the `is_live: true` listings.

---

#### 5. Incorrect pagination mechanism

The actual response from `/v1/listings` looks like this:

```json
{
  "limit": 20,
  "offset": 0,
  "count": 20,
  "total": 4354,
  "has_more": true,
  "results": [...]
}
```

- **(i)** The `limit` field's default value is 20 and I tested setting it to 200 but it saturated at 50. So the maximum value is 50.
- **(ii)** There is no `page` field. The pagination behaviour can be achieved via `offset`. An `offset=X` fetches the listing starting from index X (the listing object list is 0-indexed that is why offset = 0 is the default value). So to fetch all the data (which I did using a bash script), set `?limit=50` and increment `offset` by multiples of 50 after each request.
- **(iii)** The `count` field tells us the number of entries fetched in the request.

---

#### 6. Incorrect Query Parameters in listing

I tested all the query parameters mentioned in the documentation as well as the fields in the listing object. Only the following query parameters work: `limit, offset, locality, bhk, property_type, sort_by, order`. `furnishing, min_price, max_price` did not work.

---

#### 7. Incorrect routes in `/v1/listings`

> `GET /v1/listing/{listing_id}`

returns `{"detail":"Not Found"}`

The correct endpoint is:

> `GET /v1/listings/{listing_id}`

which fetches the listing based on the unique ID.

> `GET /v1/listings/{listing_id}/similar`

I tried reaching this endpoint and some alternate endpoints but this route does not exist and neither are any alternate routes present for this functionality. It has to be accomplished from client-side.

---

#### 8. Incomplete `/v1/rentals` Filter Descriptions

The documentation mentions the filters but does not describe them properly. They behave almost like the `v1/listings` filters but have some differences:

- **(i)** This endpoint supports: `limit, offset, locality, bhk, furnishing, sort_by, order`. There is no `page` filter.
- **(ii)** `sort_by` can filter based on `price, deposit, posted_at, bedroom, carpet_area`.

---

#### 9. Rentals Listing Object misses the `is_live` field in the description

This is identical to finding 4. Here's the actual rental object:

```json
{
  "listing_id": "R1000001",
  "listing_url": "https://www.dwelling.com/rent/1000001",
  "website": "dwelling",
  "city_id": 1,
  "title": "3 BHK for rent in Bellandur",
  "apartment_name": "Sobha Meadows",
  "locality": "whitefield",
  "property_type": "apartment",
  "bedroom": 3,
  "bathroom": 3,
  "floor": 3,
  "total_floors": 12,
  "furnishing": "unfurnished",
  "facing_direction": "north-east",
  "price": 62400,
  "deposit": 624000,
  "maintenance": 2500,
  "carpet_area": 1090,
  "super_builtup_area": 1401,
  "latitude": 12.87119,
  "longitude": 77.47282,
  "posted_by": "owner",
  "posted_by_name": "Shreya Bhat",
  "posted_by_contact": "+912002924979",
  "description": "3 BHK, unfurnished, in Sobha Meadows, Whitefield. Gated society with security.",
  "posted_at": "2026-07-09T05:00:00Z",
  "is_live": true
}
```

---

#### 10. Incorrect and Incomplete Description of Filters in `/v1/projects`

- **(i)** Under the `v1/projects` documentation, it is claimed `total_listing` stays in sync with the response from `GET /v1/listings?project_id=...` but `project_id` filter fails silently and does not return the expected results.
- **(ii)** `page` filter does not exist. `offset` and `limit` are used together for pagination. Other parameters are correct.

---

#### 11. No `/v1/favourites` endpoint exists

I tried probing `/v1/favourites` but it kept on returning: `{"detail": "Not Found"}`. So I tried: `favourite, favorite, favorites` but none of them worked. I intuitively tried `saved` because that is the closest naming convention to what this endpoint is meant to do and it worked.

Instead `v1/saved` endpoint exists and supports GET, POST and DELETE actions.

POST `/v1/saved` requires:

```json
{
  "listing_id": "..."
}
```

The response structure is same as described in `/v1/favourites`.

---

#### 12. `/v1/analytics/summary` does not exist

After some exhaustive trial-and-error, I concluded that this endpoint does not exist. I tried the following keywords before concluding:

- `/v1/insights`
- `/v1/dashboard`
- `/v1/stats`
- `/v1/metrics`
- `/v1/summary`

Above endpoints layered with: `/v1/*/summary`, `/v1/*/overview`

All combinations returned `{"detail": "Not Found"}`. So, the insights have to be calculated on client-side only.

---

### Discrepancies in Listing Data

#### 1. `/v1/listings`

##### (A) Spotting Corrupt Entries

According to the API response there are `total=4354` listings but when I fetched the listings it turns out there are **4700** listings in total. But as `statement.md` suggested, the API is not buggy and is the only source of truth. That means there are some fake listings in the dataset. I stored all the listings in `listings.json` and ran an audit script (written using AI) to flag suspicious entries. I used the following rules to decide whether an entry is fake or not:

- **Structural:** all required fields are present; numeric fields contain valid numbers; no missing or duplicate `listing_id`.
- **Value constraints:** bedrooms, bathrooms, balconies, parking, and floor are non-negative; price and area values are positive.
- **Property type:** `property_type` must be one of `apartment`, `villa`, `independent house`, `plot`, or `builder floor`.
- **Furnishing:** `furnishing` must be one of `unfurnished`, `semi-furnished`, or `fully-furnished`.
- **Plot consistency:** plots must have `floor = 0`, `total_floors = 0`, and `furnishing = "unfurnished"`.
- **Residential floor consistency:** residential properties must have `total_floors > 0` and `floor <= total_floors`.
- **Bedroom/bathroom consistency:** zero bedrooms or bathrooms are allowed for plots but are suspicious for residential properties.
- **Area consistency:** `carpet_area` must not exceed `super_built_up_area`.
- **Coordinate validity:** latitude must be within `[-90, 90]` and longitude within `[-180, 180]`.
- **Website/listing ID consistency:** each website must use its corresponding listing ID prefix:
  - `magichomes` → `MAG-`
  - `dwelling` → `DWE-`
  - `squarelane` → `SQU-`
  - `zerobroker` → `ZER-`
  - `100acres` → `100-`
- **Description consistency:** BHK values mentioned in the description are compared against the structured `bedroom` value.
- **Suspicious text:** descriptions containing known AI/instructional/non-property text are flagged.
- **Repetition:** repeated descriptions and unusually repeated contact numbers are reported.

> **Note:** In my opinion, `property_type: plot` shouldn't have any `furnishing` value, but amongst the given choices I assumed it would be best to only accept `furnishing: unfurnished` for plots, even though this also does not make any sense for a plot type property.

> The script flagged **164** listings that I verified are correctly flagged. That leaves us with **4536** (4700 - 164) listings.

---

##### (B) Identifying Duplicate Listings

To find duplicates I used: apartment name, coordinates, carpet area, bedroom as the key and used DSU for grouping. This was my framework to detect duplicates:

1. Normalize `apartment_name` and group by: `apartment_name + locality + bedroom + floor`.
2. Within each group, compare every pair.
3. Mark as **Type 1 duplicate** only when:
   - coordinates are within **100 m**, and
   - `carpet_area` differs by at most **3%**.
4. Group all matched listings together and output their complete objects.

I found out that there were **413** groups with **846** listings.

---

##### (C) Detecting Fake Listings

I used an LLM to analyse the data and find outliers (similar to anomaly detection).

To identify the fake listings we need to do data analysis on the same type of data and find outliers. This was my prompt:

```text
We should categorize the data like this:

1. locality
2. bedroom count
3. carpet area
4. super_built_up_area
5. property_type
6. furnishing
7. price

f(locality, bedroom, carpet_area, super_built_up_area, property_type, furnishing) = price

1 -> 5 can be used to collect the data related to similar type of properties and price can be the output column. We analyze the prices and find a range of price based on the statistical calculations of the data. That way we can run each entry and compare it with out range, if it is outside that expected range (with a considerable error difference) it implies it is a fake entry. Skip the corrupt entries.

For example: Villas with 4 bedroom, in whitefield area, 500sqft carpet area, 700 sqft super_built_up area ranges from 20Cr - 50Cr but there's a villa that costs only 50000 is definitely a fake entry. If you understand the idea than create a theoretical framework to identify fake listings.
```

Here's the framework the LLM and I agreed upon:

```markdown
### Fake Listing Detection Framework

1. **Exclude corrupt listings** before analysis.
2. **Group comparable listings** by:
   `locality + bedroom + property_type + furnishing + carpet_area + super_built_up_area`
   using reasonable area tolerances.
3. **Require enough peers** (e.g. ≥10) to form a reliable price distribution.
4. **Estimate expected price** using robust statistics on `log(price)` — median and MAD.
5. **Use leave-one-out statistics** so the listing being tested does not affect its own benchmark.
6. **Calculate anomaly measures** such as modified z-score and `price / group-median-price`.
7. **Flag only extreme price outliers** as fake candidates, not merely moderate deviations.
8. **Record the evidence** for every flagged listing: peer count, expected price, actual price, ratio, and anomaly score.
```

I found out that **59** listings were fake.

## What I Would Do With Another Two Days

If I had two additional days, I would focus on improving completeness, usability, and the relationships between the different types of data rather than introducing major new functionality.

1. **Complete the rentals experience**
   - Build dedicated rental listing and rental-detail pages.
   - Add the relevant rental filters, sorting, and navigation.
   - Make the rental experience consistent with the existing property browsing experience.

2. **Improve project ↔ listing relationships**
   - Make project pages link more naturally to their associated listings.
   - Allow users to move from a project to the relevant properties/listings and back.
   - Improve the presentation of the relationship between a project and its available listings.

3. **Improve search, filtering, and discovery**
   - Refine the existing search and filtering experience.
   - Make filter combinations easier to understand and use.
   - Improve empty states and feedback when no matching properties are available.

4. **Improve performance and API data handling**
   - Reduce unnecessary API requests and improve caching where appropriate.
   - Optimize fetching and pagination for pages that work with larger datasets.
   - Make loading states feel smoother, particularly for analytics and large listing collections.

5. **Add more thorough production testing**
   - Test all six required functionalities across different edge cases.
   - Verify invalid, inactive, and unavailable listings cannot leak into user-facing results.
   - Test the deployed Vercel application across common screen sizes and directly accessed routes.