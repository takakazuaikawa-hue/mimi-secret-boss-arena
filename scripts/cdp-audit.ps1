param(
  [Parameter(Mandatory = $true)]
  [string]$Expression,
  [string]$ScreenshotPath,
  [int]$ViewportWidth,
  [int]$ViewportHeight
)

$tabs = @(Invoke-RestMethod -Uri "http://127.0.0.1:9333/json")
$tab = $tabs |
  Where-Object { $_.type -eq "page" -and $_.url -like "http://127.0.0.1:5175/*" } |
  Select-Object -First 1

if (-not $tab) {
  throw "No Chromium page is available on port 9333."
}

$socket = [System.Net.WebSockets.ClientWebSocket]::new()
$token = [Threading.CancellationToken]::None
$socket.ConnectAsync(
  [Uri]([string]$tab.webSocketDebuggerUrl),
  $token
).GetAwaiter().GetResult() | Out-Null
$nextId = 0

function Invoke-Cdp {
  param([string]$Method, [hashtable]$Params = @{})
  $script:nextId += 1
  $id = $script:nextId
  $payload = @{ id = $id; method = $Method; params = $Params } |
    ConvertTo-Json -Depth 20 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
  $socket.SendAsync(
    [ArraySegment[byte]]::new($bytes),
    [System.Net.WebSockets.WebSocketMessageType]::Text,
    $true,
    $token
  ).GetAwaiter().GetResult() | Out-Null

  do {
    $stream = [IO.MemoryStream]::new()
    do {
      $buffer = [byte[]]::new(65536)
      $result = $socket.ReceiveAsync(
        [ArraySegment[byte]]::new($buffer),
        $token
      ).GetAwaiter().GetResult()
      $stream.Write($buffer, 0, $result.Count)
    } until ($result.EndOfMessage)
    $message = [Text.Encoding]::UTF8.GetString($stream.ToArray()) |
      ConvertFrom-Json
  } until ($message.id -eq $id)

  if ($message.error) {
    throw ($message.error | ConvertTo-Json -Compress)
  }
  return $message.result
}

Invoke-Cdp "Runtime.enable" | Out-Null
if ($ViewportWidth -and $ViewportHeight) {
  Invoke-Cdp "Emulation.setDeviceMetricsOverride" @{
    width = $ViewportWidth
    height = $ViewportHeight
    deviceScaleFactor = 1
    mobile = $ViewportWidth -le 760
  } | Out-Null
}
$evaluation = Invoke-Cdp "Runtime.evaluate" @{
  expression = $Expression
  awaitPromise = $true
  returnByValue = $true
}

if ($ScreenshotPath) {
  Invoke-Cdp "Page.enable" | Out-Null
  $capture = Invoke-Cdp "Page.captureScreenshot" @{ format = "png" }
  [IO.File]::WriteAllBytes(
    $ScreenshotPath,
    [Convert]::FromBase64String($capture.data)
  )
}

$socket.Dispose()
$evaluation.result.value | ConvertTo-Json -Depth 20
