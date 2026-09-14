$API_KEY = "IVY26-CA27404EE7C9"
$TOKEN = "eyJleHAiOjE3ODkzNzQyMzMsImlhdCI6MTc4OTM3MzMzMywia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.3q0iygP8IWkjOsc7ZOCWkMiAYAQtE8JM4u1NHPPHPvE"

$baseUrl = "https://solve.ivy.homes/v1/projects"
$limit = 50
$offset = 0

$allResults = @()
#$total = 519

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

$allResults | ConvertTo-Json -Depth 20 | Set-Content -Path "./data/projects.json"

Write-Host "Done. Saved $($allResults.Count) records to projects.json"