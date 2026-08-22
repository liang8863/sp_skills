$roots = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
    Where-Object { $_.CommandLine -match 'playwright_chromiumdev_profile-' -and $_.CommandLine -notmatch '(?:^|\s)--type=' }

foreach ($root in $roots) {
    & taskkill.exe /PID $root.ProcessId /T /F | Out-Null
}
