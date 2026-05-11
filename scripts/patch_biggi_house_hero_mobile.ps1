$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\Deredz\Documents\Web Apps\Biggi-House\frontend"
$path = Join-Path $repoRoot "src\pages\Home.jsx"

if (-not (Test-Path $path)) {
  throw "Home.jsx not found at $path"
}

$c = Get-Content $path -Raw

function Replace-Once {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [Parameter(Mandatory = $true)][string]$Pattern,
    [Parameter(Mandatory = $true)][string]$Replacement,
    [Parameter(Mandatory = $false)][System.Text.RegularExpressions.RegexOptions]$Options = [System.Text.RegularExpressions.RegexOptions]::None
  )
  $r = [regex]::new($Pattern, $Options)
  return $r.Replace($Text, $Replacement, 1)
}

# HeroGrid: add grid-template-areas on <=900px so image is first, then copy.
$c = Replace-Once `
  -Text $c `
  -Pattern '(@media \(max-width: 900px\) \{\s*\r?\n\s*grid-template-columns: 1fr;\s*\r?\n\s*gap: 22px;)(\s*\r?\n\s*\})' `
  -Replacement "`$1`r`n    grid-template-areas:`r`n      `"image`"`r`n      `"copy`"`;`$2" `
  -Options ([System.Text.RegularExpressions.RegexOptions]::Singleline)

# HeroCopy: add grid-area on <=900px.
$c = Replace-Once `
  -Text $c `
  -Pattern 'const HeroCopy = styled\.div`\s*\r?\n\s*min-width: 0;\s*\r?\n`;' `
  -Replacement @"
const HeroCopy = styled.div`
  min-width: 0;

  @media (max-width: 900px) {
    grid-area: copy;
  }
`;
"@ `
  -Options ([System.Text.RegularExpressions.RegexOptions]::Singleline)

# HeroCard: add grid-area on <=900px and make it edge-to-edge on mobile (image looks like a block).
$c = Replace-Once `
  -Text $c `
  -Pattern 'const HeroCard = styled\.div`([\s\S]*?)@media \(max-width: 640px\) \{\s*\r?\n\s*padding: 16px;\s*\r?\n\s*border-radius: 18px;\s*\r?\n\s*\}\s*\r?\n`;' `
  -Replacement @"
const HeroCard = styled.div`$1
  @media (max-width: 900px) {
    grid-area: image;
  }

  @media (max-width: 640px) {
    padding: 0;
    border-radius: 18px;
    border: none;
    box-shadow: none;
    background: transparent;
  }
`;
"@ `
  -Options ([System.Text.RegularExpressions.RegexOptions]::Singleline)

# Mockup: force block-level image and tune radius on mobile.
if ($c -notmatch 'const Mockup = styled\.img`[\s\S]*?display:\s*block;') {
  $c = Replace-Once `
    -Text $c `
    -Pattern 'const Mockup = styled\.img`\s*\r?\n\s*width: 100%;' `
    -Replacement "const Mockup = styled.img`r`n  width: 100%;`r`n  display: block;`r`n  height: auto;" `
    -Options ([System.Text.RegularExpressions.RegexOptions]::Singleline)
}

if ($c -notmatch '@media \(max-width: 640px\)\s*\{\s*\r?\n\s*border-radius: 18px;') {
  $c = Replace-Once `
    -Text $c `
    -Pattern 'const Mockup = styled\.img`([\s\S]*?)`;' `
    -Replacement @"
const Mockup = styled.img`$1

  @media (max-width: 640px) {
    border-radius: 18px;
  }
`;
"@ `
    -Options ([System.Text.RegularExpressions.RegexOptions]::Singleline)
}

Set-Content -Path $path -Value $c -Encoding UTF8

Write-Host "Patched hero mobile layout in: $path"
