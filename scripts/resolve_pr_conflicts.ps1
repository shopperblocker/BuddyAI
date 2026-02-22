param(
  [string]$BaseBranch = "main",
  [string]$Remote = "origin",
  [string]$CommitMessage = "Resolve PR merge conflicts (preserve upgraded runtime files)"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Step($msg) {
  Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

Step "1/8 Ensure git is available"
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git command not found"
}

git rev-parse --is-inside-work-tree | Out-Null

$currentBranch = git branch --show-current
if (-not $currentBranch) {
  throw "Could not determine current branch"
}
if ($currentBranch -eq $BaseBranch) {
  throw "You're on '$BaseBranch'. Checkout your feature branch first."
}

Step "2/8 Verify remote/base refs"
$remoteUrl = git remote get-url $Remote 2>$null
if (-not $remoteUrl) {
  throw "Remote '$Remote' not found. Add it first, e.g. git remote add origin <url>"
}
Write-Host "Using remote: $Remote ($remoteUrl)"

Step "3/8 Fetch latest refs"
git fetch $Remote --prune

# Handle already-in-progress merge state (common when command was interrupted)
$mergeHead = git rev-parse -q --verify MERGE_HEAD 2>$null
if ($mergeHead) {
  Step "4/8 Existing merge detected; continuing conflict resolution"
} else {
  Step "4/8 Merge $Remote/$BaseBranch into $currentBranch"
  try {
    git merge "$Remote/$BaseBranch"
  } catch {
    Write-Host "Merge reported conflicts. Proceeding with deterministic resolution..." -ForegroundColor Yellow
  }
}

# Files we intentionally keep from the feature branch (ours/current) to preserve upgraded runtime behavior.
$preferCurrentBranch = @(
  "backend/main.py",
  "frontend/components/DiagnosticApp.jsx",
  "frontend/app/clinician/dashboard/page.tsx"
)

Step "5/8 Resolve known high-churn conflicts by keeping current branch version"
foreach ($file in $preferCurrentBranch) {
  $conflicted = git diff --name-only --diff-filter=U -- "$file"
  if ($conflicted) {
    # In a merge, --ours means current branch checked out before merge.
    git checkout --ours -- "$file"
    git add "$file"
    Write-Host "Resolved: $file (kept current branch)" -ForegroundColor Green
  }
}

Step "6/8 Verify no conflict markers remain"
$remaining = git diff --name-only --diff-filter=U
if ($remaining) {
  Write-Host "Unresolved conflicts remain:" -ForegroundColor Red
  $remaining
  throw "Resolve remaining files manually, then run: git add <files> ; git commit"
}

# Safety check for accidental marker remnants
$markers = git grep -n "^<<<<<<<\|^=======\|^>>>>>>>" -- backend/main.py frontend/components/DiagnosticApp.jsx frontend/app/clinician/dashboard/page.tsx 2>$null
if ($markers) {
  Write-Host "Conflict markers detected in resolved files:" -ForegroundColor Red
  $markers
  throw "Remove conflict markers, then git add + git commit"
}

Step "7/8 Commit merge resolution"
$pending = git status --porcelain
if (-not $pending) {
  Write-Host "No pending changes. If merge already completed, push branch now." -ForegroundColor Yellow
} else {
  git commit -m $CommitMessage
}

Step "8/8 Done"
Write-Host "Push branch:" -ForegroundColor Green
Write-Host "  git push $Remote $currentBranch"
Write-Host "Then refresh the PR conflict page on GitHub." -ForegroundColor Green
