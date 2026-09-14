$API_KEY = "IVY26-CA27404EE7C9"
$TOKEN = "eyJleHAiOjE3ODkzNjkzOTEsImlhdCI6MTc4OTM2ODQ5MSwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.DcCVVyhklZpr5c07fPZLkwLmsnFGUEDa-vwkyCdr8cU"

$baseUrl = "https://solve.ivy.homes/v1/rentals"
$limit = 50
$offset = 0

$allResults = @()
#$total = 1899

$has_more = $true

while ($has_more) {
    $url = "${baseUrl}?limit=$limit&offset=$offset"

    Write-Host "Fetching offset=$offset ..."

    $response = curl.exe `
        -s `
        -X GET `
        -H "X-API-Key: $API_KEY" `
        -H "Authorization: Bearer $TOKEN" `
        $url | ConvertFrom-Json

    $allResults += $response.results

    Write-Host "Fetched $($response.count) records. Total collected: $($allResults.Count)"

    $offset += $limit

    $has_more = $response.has_more
}

$allResults | ConvertTo-Json -Depth 20 | Set-Content -Path "./data/rentals.json"

Write-Host "Done. Saved $($allResults.Count) records to rentals.json"