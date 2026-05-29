# bundle.ps1 — inline CSS + JS into networth-latest.html
$root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$html    = Get-Content "$root\index.html" -Raw -Encoding UTF8
$css     = Get-Content "$root\css\style.css" -Raw -Encoding UTF8
$html    = $html -replace '<link rel="stylesheet" href="css/style\.css">', "<style>`n$css`n</style>"

$jsFiles = @(
  "js\config.js","js\lang.js","js\state.js","js\format.js",
  "js\api.js","js\render.js","js\actions.js","js\export.js","js\init.js"
)
foreach ($f in $jsFiles) {
  $html = $html -replace [regex]::Escape("<script src=`"$($f -replace '\\','/')`"></script>`n"), ''
  $html = $html -replace [regex]::Escape("<script src=`"$($f -replace '\\','/')`"></script>"), ''
}

$jsParts    = $jsFiles | ForEach-Object { "// === $(Split-Path $_ -Leaf) ===`n" + (Get-Content "$root\$_" -Raw -Encoding UTF8) }
$combinedJS = $jsParts -join "`n`n"
$html       = [regex]::Replace($html, '\n<!-- Scripts.*?-->\n', "`n", [System.Text.RegularExpressions.RegexOptions]::Singleline)
$html       = $html -replace '</body>', "<script>`n$combinedJS`n</script>`n</body>"

Set-Content "$root\networth-latest.html" $html -Encoding UTF8
Write-Host "Bundled -> networth-latest.html ($([math]::Round($html.Length/1024)) KB)"
