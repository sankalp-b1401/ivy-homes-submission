## API Documentation Alignment Logs

### Approach:

I am comfortable with interacting with the API via terminal so I started with cleansing `API_REFERENCE.md` first. My plan is to align the `API_REFERENCE.md` with the actual API (the only source of truth) and then use that contract to build the frontend.

Read the documentation at every step -> Test the claim ? If VALID move on : If INVALID plan my hypothesis -> Run my hypothesis by the LLM -> Test the hypothesis -> Update the documentation

### Findings:

**1. Description of attaching API Key with every request was wrong:**

Sending the key as a query parameter (`?api_key=...`) does **not** work. The API returns an error:

```
{"detail": "send your key in the X-API-Key request header, not as a query parameter"}
```

I tested the suggestion from the above error:

```bash
curl.exe -X POST -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" -d '{\"email\": \"demo1@ivy.homes\", \"password\": \"$MY_PASSWORD\"}' https://solve.ivy.homes/auth/login
```

Response

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

**2. Invalid `/auth/login` response structure and description:**

The document claims:

(i) The expected response structure is as follows:

```json
{
  "token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": { "email": "demo1@ivy.homes", "name": "Demo User" }
}
```

But after authentication, this was the actual response I recieved:

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

(ii) It also says that tokens are valid for **24 hours** but as it can observed from the actual response, the token `"expires_in": 900` which is only **15 minutes**.

(iii)) It also claims **there is no refresh flow** but the response does contain a `response_token` implying the refresh flow does exist and the token refreshes after every 15 minutes. I also verified that the `/auth/refresh` to ensure it is working as expected:

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

(iv) Lastly the `user` field only contains `email` parameter (no `name` parameter).

**3. `/auth/logout` does not invalidate token on server-side:**

This one was little complicated. When I acceseed the `/auth/logout` endpoint via:

```bash
 curl.exe -X POST -H "X-API-Key: $API_KEY" -H "Authorization: Bearer eyJleHAiOjE3ODkzMDcwMjksImlhdCI6MTc4OTMwNjEyOSwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.yVIzzPN4rn1rv2SPjX_PuZyhvkEOwLRVbAOfg8HGKD0" https://solve.ivy.homes/auth/logout
```

I received the error message that revealed that tokens have to be discarded the client side.

```json
{ "ok": true, "note": "tokens are stateless; discard them client side" }
```

So the claim documentation makes about token being discarded at server-side is wrong.

There's one more thing I checked before moving forward and it was how is the server responding to expired tokens. Because even if the frontend code handles the tokens from client-side, there's a possibility that I can copy the token before discarding it. Discarding from client-side simply means browser stops storing the `access_token` in it's local storage. I had two observations:

(i) The server continues to support the discarded `access_token` as long as they are not expired.
(ii) The behavior is same for the `refresh_token`. But because an expired `refresh_token` is still usable, it can be used to generate new `access_tokens` even if the current one expires.

This ends when the `refresh_token` is expired itself. The tokens here are in form: PAYLOAD.SIGNATURE so I decoded the payload part for a `refresh_token`:

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

> $$1789926361 - 1789321561 = 604800 seconds = 7 days$$

Therefore, the `refresh_token` expires **after 7 days** so until then even if a token is discarded from client side. I reached this hypothesis by testing the endpoints with the following procedure:

(i) POST `/auth/login` to generate a new `acess_token` and `refresh_token`.
(ii) POST `/auth/logout` to discard token from client side. (I do this step before the `access_token` expires)
(iii) GET `/v1/listings` and use the discarded `access_token` (not yet expired) in the `Authorization` header. As I stated above, the token successfully authorized me and fetched the data.
(iv) Repeat step 3 after 15 minutes (when the `access_token` has expired). In this case the request failed and I received the message: `{"detail":"access token expired - POST /auth/refresh with your refresh_token"}`
(v) Once the `access_token` expires, it can not be used again, but the `refresh_token` is still not expired (7 days age) even though we discarded the tokens. So, POST `/auth/refresh` with `refresh_token` in the request body. I was able to generate a new `access_token`:

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

(vi) Repeat Step 3 with the new `access_token`. As suspected, I was able to fetch data from the endpoint.

**4. The `listing` object in `/v1/listings` also has a `is_live` field:**

The `listing` object structure defined in the documentation does not contain the `is_live` field. My hypothesis is that earlier they may have been only fetching the active listings (also claimed in the documentation), but the current API fetches all listings and the `is_live` field tells us whether this listing is active or not.

```json
    {
      "listing_id": "MAG-1002627",
      "listing_url": "https://www.magichomes.com/property/1002627",
      ...
      "posted_at": "2026-06-14T21:03:00Z",
      "is_live": true
    },
```

As per the documentation `v1/listings` return only the **active** listings and is thus safe to show the results directly to the user. But based on my hypothesis the API response says otherwise and we would therefore have to filter the listing on client-side to only display the `is_live: true` listings.
