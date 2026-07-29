param(
  [string]$ProcessName = "chrome",
  [int]$X = 150,
  [int]$Y = 255
)
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class SafeChangeClick {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
}
"@
$target = Get-Process $ProcessName -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne 0 } |
  Sort-Object StartTime -Descending |
  Select-Object -First 1
if (-not $target) { throw "Browser window was not found." }
$rect = New-Object SafeChangeClick+RECT
[SafeChangeClick]::GetWindowRect($target.MainWindowHandle, [ref]$rect) | Out-Null
[SafeChangeClick]::SetForegroundWindow($target.MainWindowHandle) | Out-Null
[SafeChangeClick]::SetCursorPos($rect.Left + $X, $rect.Top + $Y) | Out-Null
[SafeChangeClick]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
[SafeChangeClick]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Seconds 2
