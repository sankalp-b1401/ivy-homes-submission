# PLAN.md — Complete Frontend API Integration

## Objective

Fully integrate the existing frontend with the Ivy Homes API.

The frontend UI already exists. Your responsibility is to make it functional by integrating the API according to:

- `API_REFERENCE_FIXED.md` — source of truth for all API behavior
- `statement.md` — source of truth for the 6 required functionalities
- Existing frontend code — preserve its design and structure where possible

Do not redesign the website unless integration requires a small UI adjustment.

---

# 1. First: Understand the Existing Project

Before changing code:

1. Inspect the complete frontend project.
2. Read `API_REFERENCE_FIXED.md` and `statement.md`.
3. Identify:
   - Framework and build setup
   - Routing
   - Authentication implementation
   - Existing pages
   - Existing API calls
   - Existing mock/static data
   - Existing TypeScript types
   - State management
4. Map every UI functionality to the corresponding API endpoint or client-side calculation.

Do not begin randomly editing files before understanding the project.

---

# 2. API Reference Is the Source of Truth

Follow `API_REFERENCE_FIXED.md` exactly.

Do not:

- Invent endpoints
- Invent request fields
- Invent response fields
- Invent query parameters
- Assume undocumented API behavior

If the existing frontend conflicts with the API reference, the API reference takes priority.

---

# 3. Environment Setup

Configure the API base URL using environment variables.

Example:

```env
VITE_API_BASE_URL=https://solve.ivy.homes
```

Do not hardcode the base URL throughout the application.

Create centralized configuration, for example:

```text
src/
└── config/
    └── api.ts
```

Create `.env.example` if useful.

Do not commit secrets.

---

# 4. Create a Central API Client

Create one centralized API client.

Suggested structure:

```text
src/
├── api/
│   ├── client.ts
│   ├── auth.ts
│   ├── listings.ts
│   ├── rentals.ts
│   ├── projects.ts
│   └── saved.ts
```

The API client should handle:

- Base URL
- API key
- Authorization
- Access token
- Request headers
- Response handling
- Authentication errors
- Token refresh if documented

Do not put raw API calls directly inside page components.

---

# 5. Authentication

Implement authentication exactly as documented in `API_REFERENCE_FIXED.md`.

Requirements:

- Correct HTTP method
- Correct headers
- Correct request body
- Correct response parsing
- Appropriate token storage

Authenticated requests must automatically include required headers through the centralized API client.

Implement logout by clearing authentication state and redirecting to `/login`.

If refresh tokens are documented and required:

1. Detect unauthorized/expired tokens.
2. Attempt refresh.
3. Store the new token.
4. Retry the original request once.
5. Prevent infinite retry loops.

If authentication cannot be restored, clear auth state and redirect to login.

---

# 6. TypeScript Types

Create proper types based on actual API response structures.

Suggested:

```text
src/
├── types/
│   ├── auth.ts
│   ├── listing.ts
│   ├── rental.ts
│   ├── project.ts
│   └── api.ts
```

Create types for:

- Listings
- Rentals
- Projects
- Paginated responses
- Authentication responses
- Saved listings

Avoid `any`.

---

# 7. Centralized Listing Validity Filtering

All relevant user-facing functionality must exclude:

1. Corrupt listings
2. Fake listings
3. Inactive listings

Create centralized filtering logic.

Suggested:

```text
src/
├── data/
│   └── invalidListingIds.ts
└── utils/
    └── listingFilters.ts
```

Store corrupt and fake IDs as `Set<string>`.

Create:

```ts
isValidListing(listing)
```

A listing is valid only when:

```text
listing.is_live === true
AND listing_id is not corrupt
AND listing_id is not fake
```

All listing-related functionality must use this centralized function.

Do not duplicate filtering logic.

---

# 8. Required Functionalities

Read `statement.md` and identify all 6 required functionalities.

Implement every functionality completely.

For each functionality:

1. Determine whether the API provides the required data directly.
2. If yes, integrate the documented endpoint.
3. If no, fetch the required raw data.
4. Perform the calculation client-side.
5. Apply invalid listing filtering before displaying or calculating results.

Do not use mock data.

---

# 9. Listings Integration

Integrate all documented listing endpoints.

Follow `API_REFERENCE_FIXED.md` exactly.

For listing results:

1. Receive the API response.
2. Extract results.
3. Filter using `isValidListing`.
4. Display only valid listings.

Never display corrupt, fake, or inactive listings.

---

# 10. Listings Pagination

Follow the documented pagination mechanism.

If the API uses:

```text
limit
offset
has_more
```

then use those fields.

Do not invent page numbers.

If complete data is required:

```text
offset = 0

while has_more:
    fetch(limit, offset)
    append results
    offset += limit
```

Stop only when `has_more === false`.

---

# 11. Listing Details

Integrate the documented listing details endpoint.

For the listing detail page:

1. Read the listing ID from the route.
2. Fetch the listing.
3. Validate using `isValidListing()`.

If invalid, do not display it. Show an appropriate unavailable/not-found state.

This prevents users from bypassing filtering through direct URLs.

---

# 12. Rentals Integration

Integrate all documented rental endpoints.

Support only filters and functionality documented in `API_REFERENCE_FIXED.md`.

Do not invent parameters.

Determine how rental records relate to fake/corrupt/inactive records based on the API documentation and assignment requirements.

Create a separate validation function if appropriate:

```ts
isValidRental(rental)
```

---

# 13. Projects Integration

Integrate all documented project endpoints.

Use the existing UI.

Handle:

- Loading
- Errors
- Missing projects
- Pagination where documented

Do not incorrectly reject projects because `price_min` and `price_max` appear inconsistent.

Project prices may not be normalized.

Do not invent arbitrary price normalization unless explicitly required by a functionality.

---

# 14. Saved Listings

Integrate all documented saved-listing functionality.

This may include:

- Fetch saved listings
- Save listing
- Remove saved listing

Use exact endpoints and request structures from `API_REFERENCE_FIXED.md`.

Before displaying saved listings, filter invalid listings.

Only valid listings should be saved through the UI.

After successful deletion, update UI state without requiring a full refresh.

---

# 15. Analytics and Insights

Check both the existing frontend and `statement.md`.

Do not call undocumented analytics endpoints.

If required metrics are not provided directly by the API:

1. Fetch all required raw data.
2. Complete pagination.
3. Filter invalid listings.
4. Calculate results client-side.

Before any calculation:

```ts
const validListings = allListings.filter(isValidListing);
```

Filtering must happen before calculations.

---

# 16. Search

Connect the existing search interface to real API data.

Requirements:

- Use documented API parameters.
- Handle loading.
- Handle empty results.
- Handle API errors.
- Debounce input when appropriate.

Do not implement fake search using mock data.

---

# 17. Error and Empty States

Every API request should handle:

- Loading
- Success
- Error
- Empty results

Examples:

- `Unable to load listings.`
- `Unable to load projects.`
- `Something went wrong. Please try again.`
- `No listings found.`

Do not leave blank pages.

---

# 18. Preserve Existing UI

Do not:

- Replace the design
- Rewrite the application unnecessarily
- Replace existing pages
- Change colors/layout unnecessarily
- Create a completely new component system

The UI already exists.

Your task is API integration.

Small adjustments for loading, error, empty states, and real API fields are allowed.

---

# 19. Remove Mock Data

Identify and replace:

- Mock listings
- Static listing arrays
- Placeholder projects
- Placeholder rentals
- Fake analytics

Do not leave mock data visible where real API integration is expected.

---

# 20. Avoid Duplicate Requests

Inspect the application for unnecessary duplicate API calls.

Avoid:

```text
Render
  ↓
Fetch
  ↓
State update
  ↓
Render
  ↓
Fetch again
```

Do not create infinite request loops.

Use the project's existing state-management and data-fetching approach where possible.

Do not introduce major dependencies unless necessary.

---

# 21. API Request Verification

For every endpoint integrated, verify:

1. HTTP method
2. URL
3. Query parameters
4. Headers
5. Authentication
6. Request body
7. Response parsing
8. TypeScript types
9. Error handling

Do not assume an endpoint works merely because the UI renders.

---

# 22. Testing

After integration, test locally:

- Login
- Logout
- Authenticated requests
- Listing search
- Listing details
- Rental functionality
- Project functionality
- Project details
- Saved listings
- Pagination
- Loading states
- Error states
- All six required functionalities

Check the browser console for significant errors.

---

# 23. Production Build

Before deployment, run:

```bash
npm run build
```

Fix:

- TypeScript errors
- Import errors
- Build errors

The production build must succeed.

---

# 24. Vercel Deployment

The frontend is deployed on Vercel.

Verify production deployment after integration.

Ensure:

- Environment variables are configured
- Production API requests work
- SPA routes work through direct navigation

Examples:

```text
/
/login
/listings/:id
/projects/:id
```

Inspect existing Vercel configuration before adding new configuration.

If required for SPA routing, configure rewrites appropriately.

Do not add configuration blindly.

---

# 25. Integration Order

## Phase 1 — Understand

Review:

```text
Existing frontend
+
API_REFERENCE_FIXED.md
+
statement.md
```

## Phase 2 — Foundation

Set up:

- Environment variables
- Central API client
- TypeScript types

## Phase 3 — Authentication

Implement and test:

- Login
- Authenticated requests
- Logout
- Token refresh if documented

## Phase 4 — Validity Filtering

Add:

- Corrupt listing IDs
- Fake listing IDs
- `isValidListing()`

Test independently.

## Phase 5 — Listings

Implement:

- Fetching
- Search
- Documented filters
- Pagination
- Invalid listing exclusion

## Phase 6 — Listing Details

Implement and verify invalid listings cannot be accessed directly.

## Phase 7 — Rentals

Integrate documented rental functionality.

## Phase 8 — Projects

Integrate documented project functionality.

## Phase 9 — Saved Listings

Integrate fetching, saving, and removal.

## Phase 10 — Six Required Functionalities

Complete every functionality in `statement.md`.

Do not consider the task complete until all six are implemented.

## Phase 11 — Analytics/Calculations

Implement required client-side calculations using fully paginated and filtered data.

## Phase 12 — Final Validation

Perform:

```text
Full testing
+
Production build
+
Vercel deployment verification
```

---

# 26. Final Validation Checklist

## Project

- [ ] Existing UI preserved
- [ ] Mock data removed
- [ ] No unnecessary redesign

## API

- [ ] API base URL uses environment variables
- [ ] API calls are centralized
- [ ] No undocumented endpoints
- [ ] No undocumented parameters
- [ ] Response structures follow `API_REFERENCE_FIXED.md`

## Authentication

- [ ] Login works
- [ ] Authenticated requests work
- [ ] Tokens are handled correctly
- [ ] Logout works
- [ ] Token refresh works if documented

## Listings

- [ ] Listings load
- [ ] Search works
- [ ] Documented filters work
- [ ] Pagination works
- [ ] Listing details work
- [ ] Corrupt listings are excluded
- [ ] Fake listings are excluded
- [ ] Inactive listings are excluded

## Rentals

- [ ] Rentals load
- [ ] Documented functionality works
- [ ] Pagination works where applicable
- [ ] Appropriate validity filtering is applied

## Projects

- [ ] Projects load
- [ ] Project details work
- [ ] Projects are not incorrectly rejected because of unnormalized prices

## Saved Listings

- [ ] Saved listings load
- [ ] Saving works
- [ ] Removing works
- [ ] Invalid listings are not displayed

## Required Functionalities

- [ ] Functionality 1 works
- [ ] Functionality 2 works
- [ ] Functionality 3 works
- [ ] Functionality 4 works
- [ ] Functionality 5 works
- [ ] Functionality 6 works

## Analytics

- [ ] No nonexistent analytics endpoints are called
- [ ] Required datasets are fully paginated
- [ ] Calculations use valid listings only
- [ ] Fake listings are excluded
- [ ] Corrupt listings are excluded
- [ ] Inactive listings are excluded

## Build

- [ ] TypeScript compiles successfully
- [ ] `npm run build` succeeds
- [ ] No major browser console errors

## Deployment

- [ ] Vercel deployment succeeds
- [ ] Homepage works
- [ ] `/login` works directly
- [ ] SPA routes work directly
- [ ] Production API requests work
- [ ] Environment variables are configured

---

# 27. Final Agent Instructions

You are responsible for the complete API integration.

Work through the project systematically.

Do not stop after integrating only the easiest endpoints.

Complete all six functionalities described in `statement.md`.

Use `API_REFERENCE_FIXED.md` as the authoritative API specification.

Preserve the existing UI.

Prioritize correctness over speed.

Before declaring the task complete:

1. Test every functionality.
2. Test every integrated endpoint.
3. Verify invalid listing filtering.
4. Run the production build.
5. Verify the deployed application.

Do not leave placeholder implementations.

Do not leave mock data for functionality that should use the API.

Do not silently skip a required functionality.

If the existing frontend implementation conflicts with the API reference, fix the integration rather than assuming the frontend is correct.

Complete the integration end-to-end.
