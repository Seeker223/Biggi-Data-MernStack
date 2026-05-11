$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\Deredz\Documents\Web Apps\Biggi-House\frontend"
$path = Join-Path $repoRoot "src\pages\Home.jsx"

if (-not (Test-Path $path)) {
  throw "Home.jsx not found at $path"
}

$c = Get-Content $path -Raw

$heroCopy = @'
const HeroCopy = styled.div`
  min-width: 0;

  @media (max-width: 900px) {
    grid-area: copy;
  }
`;
'@

$heroCard = @'
const HeroCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 26px;
  box-shadow: ${({ theme }) => theme.shadows.soft};
  border: 1px solid ${({ theme }) => theme.colors.border};

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
'@

$mockup = @'
const Mockup = styled.img`
  width: 100%;
  display: block;
  height: auto;
  border-radius: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};

  @media (max-width: 640px) {
    border-radius: 18px;
  }
`;
'@

$c = [regex]::Replace($c, 'const HeroCopy = styled\.div[\s\S]*?;\s*\r?\n\s*\r?\nconst HeroCard', ($heroCopy + "`r`nconst HeroCard"), 1)
$c = [regex]::Replace($c, 'const HeroCard = styled\.div[\s\S]*?;\s*\r?\n\s*\r?\nconst Mockup', ($heroCard + "`r`nconst Mockup"), 1)
$c = [regex]::Replace($c, 'const Mockup = styled\.img[\s\S]*?;\s*\r?\n\s*\r?\nconst Title', ($mockup + "`r`nconst Title"), 1)

Set-Content -Path $path -Value $c -Encoding UTF8
Write-Host "Restored HeroCopy/HeroCard/Mockup template literals in: $path"

