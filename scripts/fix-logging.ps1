#!/usr/bin/env pwsh
# Deprecated script: historical ad hoc fixer, not a canonical entrypoint.
# Use package.json scripts and scripts/README.md instead.

# Logging Cleanup Script for Khedma.tn
# Replaces console.log/error/warn with logger.log/error/warn

$srcPath = "c:\Users\pc\Desktop\khedma-tn\src"
$files = Get-ChildItem -Path $srcPath -Include *.ts,*.tsx -Recurse -File

# Skip the logger.ts file itself
$skipFiles = @("logger.ts")

foreach ($file in $files) {
    if ($file.Name -in $skipFiles) {
        continue
    }
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $hasLogger = $false
    $needsImport = $false
    
    # Check if any console statements exist
    if ($content -match "console\.(log|error|warn)") {
        # Replace console.log with logger.log
        $content = $content -replace "console\.log\(", "logger.log("
        # Replace console.error with logger.error
        $content = $content -replace "console\.error\(", "logger.error("
        # Replace console.warn with logger.warn
        $content = $content -replace "console\.warn\(", "logger.warn("
        
        $needsImport = $true
    }
    
    # Check if logger import already exists
    if ($content -match "import.*logger.*from") {
        $hasLogger = $true
    }
    
    # Add import if needed and not already present
    if ($needsImport -and -not $hasLogger) {
        # Find first import line
        if ($content -match "^import") {
            $content = "import { logger } from '@/lib/logger';`r`n" + $content
        }
    }
    
    # Write if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "`n✅ Logging cleanup complete!"
