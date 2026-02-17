$url = "https://dev-api.tikko.mx/swagger/v1/swagger.json"
$outputFile = "openapi.json"

Invoke-WebRequest -Uri $url -OutFile $outputFile

Write-Host "OpenAPI specification downloaded successfully to $outputFile"

Write-Host "Generating TypeScript client code from OpenAPI specification..."
npx openapi-typescript-codegen --input openapi.json --output client/api --client axios
Write-Host "TypeScript client code generated successfully in client/api"