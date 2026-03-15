const DEFAULTS = {
  stepPercent: 1,
  shiftWheelStepPercent: 5,
  shiftWheelMode: "zoom", // off | zoom
  minZoom: 0.25,
  maxZoom: 5,
  ctrlWheelMode: "zoom", // off | zoom | block
  scrollThreshold: 40,
  minDelayMs: 80,
  directionReversed: false,
  smoothScroll: true,
  shortcuts: {
    zoomIn: "Ctrl+Shift+ArrowUp",
    zoomOut: "Ctrl+Shift+ArrowDown",
    zoomReset: "Ctrl+Shift+0"
  }
};

let settings = { ...DEFAULTS };
let lastWheelTime = 0;

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    settings = {
      ...DEFAULTS,
      ...items,
      shortcuts: {
        ...DEFAULTS.shortcuts,
        ...(items.shortcuts || {})
      }
    };
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  for (const [key, change] of Object.entries(changes)) {
    if (key === "shortcuts") {
      settings.shortcuts = {
        ...DEFAULTS.shortcuts,
        ...(change.newValue || {})
      };
      continue;
    }
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

function shouldHandleShiftWheel(event) {
  if (!event.cancelable) return false;
  if (settings.shiftWheelMode === "off") return false;
  if (!event.shiftKey) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
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
  if (shouldHandleShiftWheel(event)) {
    const deltaY = event.deltaY || 0;
    if (!canTrigger(deltaY)) return;
    event.preventDefault();

    const direction = deltaY < 0 ? 1 : -1;
    const adjusted = settings.directionReversed ? -direction : direction;

    chrome.runtime.sendMessage({
      type: "wheelZoom",
      direction: adjusted,
      stepPercent: settings.shiftWheelStepPercent
    });
    return;
  }

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

function normalizeShortcutKey(key) {
  if (!key) return "";
  if (key === " ") return "Space";
  if (key === "Esc") return "Escape";
  if (key === "Spacebar") return "Space";

  const modifiers = new Set(["Shift", "Control", "Alt", "Meta"]);
  if (modifiers.has(key)) return "";

  return key.length === 1 ? key.toUpperCase() : key;
}

function buildShortcut(event) {
  const key = normalizeShortcutKey(event.key);
  if (!key) return "";

  const parts = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push("Meta");
  parts.push(key);
  return parts.join("+");
}

function shortcutEquals(a, b) {
  return String(a || "").toLowerCase() === String(b || "").toLowerCase();
}

function isEditableTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.isContentEditable) return true;
  if (target.closest("[contenteditable='true']")) return true;

  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

function handleKeydown(event) {
  if (event.defaultPrevented || event.repeat) return;
  if (isEditableTarget(event.target)) return;

  const shortcut = buildShortcut(event);
  if (!shortcut) return;

  const shortcuts = settings.shortcuts || DEFAULTS.shortcuts;
  let command = "";
  if (shortcutEquals(shortcut, shortcuts.zoomIn)) {
    command = "zoom_in";
  } else if (shortcutEquals(shortcut, shortcuts.zoomOut)) {
    command = "zoom_out";
  } else if (shortcutEquals(shortcut, shortcuts.zoomReset)) {
    command = "zoom_reset";
  }

  if (!command) return;

  event.preventDefault();
  event.stopPropagation();
  chrome.runtime.sendMessage({
    type: "shortcutCommand",
    command
  });
}

document.addEventListener("wheel", handleWheel, { passive: false });
document.addEventListener("keydown", handleKeydown, true);
