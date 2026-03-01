const DEFAULTS = {
  stepPercent: 1,
  minZoom: 0.25,
  maxZoom: 5,
  ctrlWheelMode: "zoom", // off | zoom | block
  scrollThreshold: 40,
  minDelayMs: 80,
  directionReversed: false,
  smoothScroll: true
};

let settings = { ...DEFAULTS };
let lastWheelTime = 0;

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    settings = { ...items };
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  for (const [key, change] of Object.entries(changes)) {
    settings[key] = change.newValue;
  }
});

loadSettings();

function shouldHandleWheel(event) {
  if (!event.cancelable) return false;
  const ctrlOrCmd = event.ctrlKey || event.metaKey;
  if (!ctrlOrCmd) return false;
  if (settings.ctrlWheelMode === "off") return false;
  return true;
}

function canTrigger(deltaY) {
  const now = Date.now();
  if (Math.abs(deltaY) < settings.scrollThreshold) return false;
  if (now - lastWheelTime < settings.minDelayMs) return false;
  lastWheelTime = now;
  return true;
}

function handleWheel(event) {
  if (!shouldHandleWheel(event)) return;

  const deltaY = event.deltaY || 0;
  if (!canTrigger(deltaY)) return;

  event.preventDefault();

  if (settings.ctrlWheelMode === "block") {
    if (settings.smoothScroll) {
      window.scrollBy({ left: event.deltaX, top: deltaY, behavior: "smooth" });
    } else {
      window.scrollBy(event.deltaX, deltaY);
    }
    return;
  }

  const direction = deltaY < 0 ? 1 : -1;
  const adjusted = settings.directionReversed ? -direction : direction;

  chrome.runtime.sendMessage({
    type: "wheelZoom",
    direction: adjusted
  });
}

document.addEventListener("wheel", handleWheel, { passive: false });
