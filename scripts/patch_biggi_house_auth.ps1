$ErrorActionPreference = "Stop"

function Save-Lines([string]$path, [string[]]$lines) {
  Set-Content -Path $path -Value $lines -Encoding UTF8
}

$repoRoot = "C:\Users\Deredz\Documents\Web Apps\Biggi-House"

# ---- Login.jsx ----
$loginPath = Join-Path $repoRoot "frontend\src\pages\Login.jsx"
$lines = Get-Content $loginPath

$setErrIdx = [Array]::FindIndex($lines, [Predicate[string]]{ param($l) $l -eq '    setError("");' })
if ($setErrIdx -lt 0) { throw "Login.jsx: setError line not found" }

if ($lines -notcontains '    const identifier = String(form.identifier || "").trim();') {
  $insert = @(
    '    const identifier = String(form.identifier || "").trim();',
    '    const password = String(form.password || "");'
  )
  $lines = $lines[0..$setErrIdx] + $insert + $lines[($setErrIdx + 1)..($lines.Length - 1)]
}

$ifStart = [Array]::FindIndex($lines, [Predicate[string]]{ param($l) $l -eq '    if (!form.identifier || !form.password) {' })
if ($ifStart -lt 0) { throw "Login.jsx: old if block not found" }

$ifEnd = -1
for ($i = $ifStart; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -eq "    }") { $ifEnd = $i; break }
}
if ($ifEnd -lt 0) { throw "Login.jsx: old if block end not found" }

$newIf = @(
  '    if (!identifier) {',
  '      setError("Email or username is required.");',
  '      return;',
  '    }',
  '    if (!password) {',
  '      setError("Password is required.");',
  '      return;',
  '    }'
)

$lines = $lines[0..($ifStart - 1)] + $newIf + $lines[($ifEnd + 1)..($lines.Length - 1)]

for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i].Trim() -eq "email: form.identifier,") { $lines[$i] = "      email: identifier," }
  if ($lines[$i].Trim() -eq "password: form.password,") { $lines[$i] = "      password," }
}

Save-Lines $loginPath $lines

# ---- Signup.jsx ----
$signupPath = Join-Path $repoRoot "frontend\src\pages\Signup.jsx"
$lines = Get-Content $signupPath

$ninIdx = [Array]::FindIndex($lines, [Predicate[string]]{ param($l) $l -eq '    nin: "",' })
if ($ninIdx -lt 0) { throw "Signup.jsx: nin line not found" }

if ($lines -notcontains '    referralCode: "",') {
  $lines = $lines[0..$ninIdx] + @('    referralCode: "",') + $lines[($ninIdx + 1)..($lines.Length - 1)]
}

# Find the first "if (" block in handleSubmit and replace it (assumes it's the required-fields block)
$ifStart = [Array]::FindIndex($lines, [Predicate[string]]{ param($l) $l -eq "    if (" })
if ($ifStart -lt 0) { throw "Signup.jsx: if block start not found" }

$ifEnd = -1
for ($i = $ifStart; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -eq "    }") { $ifEnd = $i; break }
}
if ($ifEnd -lt 0) { throw "Signup.jsx: if block end not found" }

$newValidation = @(
  '    const username = String(form.username || "").trim();',
  '    const email = String(form.email || "").trim().toLowerCase();',
  '    const password = String(form.password || "");',
  '    const phoneNumber = String(form.phoneNumber || "").trim();',
  '    const birthDate = String(form.birthDate || "").trim();',
  '    const state = String(form.state || "").trim();',
  '    const ninDigits = String(form.nin || "").replace(/\\D/g, "");',
  '',
  '    if (!username) return setError("Username is required.");',
  '    if (!email) return setError("Email is required.");',
  '',
  '    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;',
  '    if (!emailRegex.test(email)) return setError("Please enter a valid email address.");',
  '',
  '    if (!phoneNumber) return setError("Phone number is required.");',
  '    if (!birthDate) return setError("Birth date is required.");',
  '    if (!state) return setError("State is required.");',
  '',
  '    if (!ninDigits) return setError("NIN is required.");',
  '    if (ninDigits.length !== 11) return setError("Please enter a valid 11-digit NIN.");',
  '',
  '    if (!password) return setError("Password is required.");',
  '    if (password.length < 6) return setError("Password must be at least 6 characters.");'
)

$lines = $lines[0..($ifStart - 1)] + $newValidation + $lines[($ifEnd + 1)..($lines.Length - 1)]

for ($i = 0; $i -lt $lines.Length; $i++) {
  switch ($lines[$i].Trim()) {
    "username: form.username," { $lines[$i] = "      username," }
    "email: form.email," { $lines[$i] = "      email," }
    "password: form.password," { $lines[$i] = "      password," }
    "phoneNumber: form.phoneNumber," { $lines[$i] = "      phoneNumber," }
    "birthDate: form.birthDate," { $lines[$i] = "      birthDate," }
    "state: form.state," { $lines[$i] = "      state," }
    "nin: form.nin," { $lines[$i] = "      nin: ninDigits," }
  }
}

Save-Lines $signupPath $lines

Write-Host "Patched Biggi-House Login/Signup validation successfully."

