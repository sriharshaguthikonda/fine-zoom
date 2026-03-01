# Fine Zoom Step

Fine-grained tab zoom for Chromium browsers using keyboard commands and optional Ctrl/Cmd plus Wheel control.

## Features
- Customizable zoom step size (default 1%).
- Keyboard shortcuts for zoom in, zoom out, and reset.
- Optional Ctrl/Cmd plus Wheel to zoom, or block browser zoom while keeping scroll.
- Adjustable scroll threshold, delay, and direction.

## Quick Start (Chrome or Edge)
1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Click Load unpacked and select this folder.
4. Click the extension icon to open the popup.
5. Use the shortcuts or Ctrl/Cmd plus Wheel to zoom.

## How to Use
### Popup settings
- Step size (%): how much each zoom action changes the current zoom.
- Ctrl/Cmd plus Wheel:
  - Off: do nothing.
  - Zoom using step size: uses the same step size as the shortcuts.
  - Block browser zoom: prevents browser zoom and keeps normal scroll.
- Scroll threshold (px): minimum wheel delta before a zoom action fires.
- Min delay (ms): minimum time between wheel zoom actions.
- Reverse wheel direction: flip zoom direction for the wheel.
- Smooth scroll when blocking browser zoom: keep scrolling fluid when zoom is blocked.

### Shortcuts
Default keys (change in `chrome://extensions/shortcuts`):
- Zoom in: Ctrl+Shift+Up
- Zoom out: Ctrl+Shift+Down
- Reset: Ctrl+Shift+0

## Troubleshooting
- Ctrl/Cmd plus Wheel not working: some pages (like Chrome Web Store or browser internal pages) cannot be scripted. Try a normal web page.
- Shortcuts not firing: check `chrome://extensions/shortcuts` for conflicts and reassign.
- Zoom stops changing: zoom is clamped between 25% and 500% for safety.

## Maintain / Release
1. Update the version in `manifest.json`.
2. Zip the folder contents (exclude `.git` and `.gitignore`).
   - PowerShell: `Compress-Archive -Path * -DestinationPath fine-zoom.zip`
3. Upload the zip to the Chrome Web Store or Microsoft Edge Add-ons.

## Notes
- Browser-reserved Ctrl/Command plus plus/minus shortcuts cannot be reliably overridden; use the extension commands instead.
