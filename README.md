## API Documentation Alignment Logs

### Approach:

I am comfortable with interacting with the API via terminal so I started with cleansing `API_REFERENCE.md` first. My plan is to align the `API_REFERENCE.md` with the actual API (the only source of truth) and then use that contract to build the frontend.

Read the documentation at every step -> Test the claim ? If VALID move on : If INVALID plan my hypothesis -> Run my hypothesis by the LLM -> Test the hypothesis -> Update the documentation

### Findings:

**1. Description of attaching API Key with every request was wrong: **

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

**2. Invalid `/auth/login` response structure and description: **

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
