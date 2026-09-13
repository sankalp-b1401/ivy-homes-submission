## API Documentation Alignment Logs

### Approach:

I am comfortable with interacting with the API via terminal so I started with cleansing `API_REFERENCE.md` first. My plan is to align the `API_REFERENCE.md` with the actual API (the only source of truth) and then use that contract to build the frontend.

Read the documentation at every step -> Test the claim ? If VALID move on : If INVALID plan my hypothesis -> Run my hypothesis by the LLM -> Test the hypothesis -> Update the documentation

### Findings:

**1. Description of attaching API Key with every request was wrong**

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

**2. **
