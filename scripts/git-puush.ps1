<#
Simple helper to push to the Da-Mizu repo using a Personal Access Token (PAT).

Usage:
  - Set environment variable GIT_DAMIZU_PAT to your PAT (recommended):
      $env:GIT_DAMIZU_PAT = 'your_token_here'
    or set it permanently in Windows environment variables.

  - Run from repo root:
      powershell -ExecutionPolicy Bypass -File .\scripts\git-puush.ps1

  - Optional: pass branch and repo (default branch 'main', default repo 'Da-Mizu/QR-reservation'):
      powershell -File .\scripts\git-puush.ps1 -branch dev -repo "Da-Mizu/other-repo"

Notes:
  - The script reads PAT from environment variable `GIT_DAMIZU_PAT` or prompts securely.
  - Storing a PAT in an env var is safer than hardcoding it into scripts/aliases.
#>

param(
    [string]$branch = 'main',
    [string]$repo = 'Da-Mizu/QR-reservation'
)

function Get-Pat {
    if ($env:GIT_DAMIZU_PAT) { return $env:GIT_DAMIZU_PAT }
    Write-Host "Enter PAT for Da-Mizu (input hidden):"
    $secure = Read-Host -AsSecureString
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

# ensure we are in a git repo
if (-not (Test-Path .git)) {
    Write-Host "Warning: not in a git repo root. Change directory to the repo root and retry." -ForegroundColor Yellow
    exit 1
}

$pat = Get-Pat
if (-not $pat) { Write-Host "No PAT provided." -ForegroundColor Red; exit 1 }

$remoteUrl = "https://Da-Mizu:$pat@github.com/$repo.git"

Write-Host "Pushing branch '$branch' to $remoteUrl (using token from env)."

# run the push
git push $remoteUrl $branch
