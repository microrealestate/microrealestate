# zip-project.ps1
$projectName = "MicroRealEstate-AI-Context"
$exportDir = "$PSScriptRoot\ai-exports"
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$zipFile = "$exportDir\$projectName-$timestamp.zip"

# 1. Ensure export directory exists
if (!(Test-Path $exportDir)) { New-Item -ItemType Directory -Path $exportDir | Out-Null }

# 2. Define exclusions (Case-insensitive)
$excludeList = @(
    "node_modules", ".git", ".github", ".husky", 
    ".vscode", ".yarn", "backup", "data", "ai-exports",
    "yarn.lock"
)

Write-Host "--- Starting Fast Zip (using .NET) ---" -ForegroundColor Cyan

# Load the required .NET assembly
Add-Type -AssemblyName "System.IO.Compression.FileSystem"

# 3. Create/Open the Zip
$zipStream = [System.IO.Compression.ZipFile]::Open($zipFile, "Create")

try {
    # 4. Get all files, filtering out excluded directories
    $files = Get-ChildItem -Path $PSScriptRoot -Recurse -File | Where-Object {
        $filePath = $_.FullName
        $isExcluded = $false
        foreach ($exclude in $excludeList) {
            # Check if any part of the path contains an excluded folder name
            if ($filePath -like "*\$exclude\*" -or $filePath -like "*\$exclude") {
                $isExcluded = $true
                break
            }
        }
        $isExcluded -eq $false -and $filePath -notlike "*.zip" -and $filePath -notlike "*.env*"
    }

    # 5. Add files to Zip
    foreach ($file in $files) {
        $entryName = $file.FullName.Substring($PSScriptRoot.Length + 1)
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipStream, $file.FullName, $entryName)
    }
}
finally {
    $zipStream.Dispose()
}

Write-Host "Success! Fast zip complete at:" -ForegroundColor Green
Write-Host $zipFile