# Renders the three tab-effect screenshots in assets/ as PNGs.
# Reproduces the plugin's ring geometry at 128 px for readability: outer ring
# at radius 50 (inset 14), ring stroke 26, a fixed 34-degree trailing gap
# while running, and the palette #5686FE / #F59E0B / #22C55E. The ring-hole
# center shows a simplified whale silhouette standing in for the document's
# original favicon. Run: pwsh -File scripts/render-screenshots.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function New-RingPng {
  param([string]$Path, [string]$Hex, [int]$GapDeg, [string]$Label)
  $size = 128
  $bmp = [System.Drawing.Bitmap]::new($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($Hex))
  $pen = [System.Drawing.Pen]::new($brush, 26)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $rect = [System.Drawing.Rectangle]::new(14, 14, 100, 100)
  if ($GapDeg -gt 0) {
    # Trailing gap at 3 o'clock: the arc starts 17 degrees past it and sweeps
    # the remaining 326 degrees.
    $g.DrawArc($pen, $rect, 17, 360 - $GapDeg)
  } else {
    $g.DrawEllipse($pen, $rect)
  }
  # Simplified whale silhouette for the ring hole.
  $body = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235, 30, 41, 59))
  $g.FillEllipse($body, 44, 52, 30, 24)
  $tail = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235, 30, 41, 59))
  $g.FillEllipse($tail, 66, 58, 14, 12)
  $g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::White), 60, 40, 8, 6) # blowhole hint
  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "wrote $Path"
}

$out = Join-Path $PSScriptRoot '..\assets'
New-Item -ItemType Directory -Path $out -Force | Out-Null
New-RingPng -Path (Join-Path $out 'running.png') -Hex '#5686FE' -GapDeg 34
New-RingPng -Path (Join-Path $out 'pending.png') -Hex '#F59E0B' -GapDeg 0
New-RingPng -Path (Join-Path $out 'done.png') -Hex '#22C55E' -GapDeg 0
