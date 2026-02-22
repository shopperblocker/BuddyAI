param(
  [string]$BaseBranch = "main"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host "[1/6] Ensure git is available" -ForegroundColor Cyan
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git command not found"
}

Write-Host "[2/6] Verify we're inside a git repo" -ForegroundColor Cyan
git rev-parse --is-inside-work-tree | Out-Null

$currentBranch = git branch --show-current
if (-not $currentBranch) {
  throw "Could not determine current branch"
}

if ($currentBranch -eq $BaseBranch) {
  throw "You're on '$BaseBranch'. Checkout your feature branch first."
}

Write-Host "[3/6] Fetch latest refs" -ForegroundColor Cyan
git fetch --all --prune

Write-Host "[4/6] Merge base branch '$BaseBranch' into '$currentBranch'" -ForegroundColor Cyan
try {
  git merge "origin/$BaseBranch"
} catch {
  Write-Host "Merge reported conflicts. Proceeding with deterministic resolution..." -ForegroundColor Yellow
}

# Files we intentionally keep from the feature branch (ours) to preserve upgraded runtime behavior.
$preferOurs = @(
  "backend/main.py",
  "frontend/components/DiagnosticApp.jsx",
  "frontend/app/clinician/dashboard/page.tsx"
)

Write-Host "[5/6] Resolve known high-churn conflicts by preferring feature branch versions" -ForegroundColor Cyan
foreach ($file in $preferOurs) {
  $conflicted = git diff --name-only --diff-filter=U -- "$file"
  if ($conflicted) {
    git checkout --ours -- "$file"
    git add "$file"
    Write-Host "Resolved: $file" -ForegroundColor Green
  }
}

# If any unresolved conflicts remain, fail fast with clear output.
$remaining = git diff --name-only --diff-filter=U
if ($remaining) {
  Write-Host "Unresolved conflicts remain:" -ForegroundColor Red
  $remaining
  throw "Please resolve remaining files manually, then run: git add <files> ; git commit"
}

Write-Host "[6/6] Finalize merge commit" -ForegroundColor Cyan
git commit -m "Resolve PR merge conflicts against $BaseBranch (preserve upgraded runtime files)"

Write-Host "Done. Push your branch:" -ForegroundColor Green
Write-Host "  git push"
