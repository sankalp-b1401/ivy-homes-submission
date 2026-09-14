$API_KEY = "IVY26-CA27404EE7C9"
$TOKEN = "eyJleHAiOjE3ODkzOTA2OTUsImlhdCI6MTc4OTM4OTc5NSwia2V5IjoiSVZZMjYtQ0EyNzQwNEVFN0M5Iiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.Zjs2DGECeipCg3FPjfOIA7jDkAYxUfj2IWjprxtfPLQ"

$baseUrl = "https://solve.ivy.homes/v1/rentals"
$limit = 50
$offset = 0
$locality = "Yelahanka"

$totalRent = [long]0
$has_more = $true

while ($has_more) {
    $url = "${baseUrl}?locality=$locality&limit=$limit&offset=$offset"

    Write-Host "Fetching offset=$offset ..."

    $response = curl.exe `
        -s `
        -X GET `
        -H "X-API-Key: $API_KEY" `
        -H "Authorization: Bearer $TOKEN" `
        $url | ConvertFrom-Json

    $pageSum = ($response.results | Measure-Object -Property price -Sum).Sum
    $totalRent += [long]$pageSum

    Write-Host "Page rent: $pageSum"
    Write-Host "Running total: $totalRent"

    $offset += $limit
    $has_more = $response.has_more
}