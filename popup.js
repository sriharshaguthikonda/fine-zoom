const DEFAULTS = {
  stepPercent: 1,
  shiftWheelStepPercent: 5,
  shiftWheelMode: "zoom",
  minZoom: 0.25,
  maxZoom: 5,
  ctrlWheelMode: "zoom",
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

const fields = {
  stepPercent: document.getElementById("stepPercent"),
  shiftWheelStepPercent: document.getElementById("shiftWheelStepPercent"),
  shiftWheelMode: document.getElementById("shiftWheelMode"),
  ctrlWheelMode: document.getElementById("ctrlWheelMode"),
  scrollThreshold: document.getElementById("scrollThreshold"),
  minDelayMs: document.getElementById("minDelayMs"),
  directionReversed: document.getElementById("directionReversed"),
  smoothScroll: document.getElementById("smoothScroll")
};

const shortcutFields = {
  zoomIn: document.getElementById("shortcutZoomIn"),
  zoomOut: document.getElementById("shortcutZoomOut"),
  zoomReset: document.getElementById("shortcutZoomReset")
};

const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset");

let saveTimer = null;
let statusTimer = null;

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function showStatus(text) {
  statusEl.textContent = text;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.textContent = "";
  }, 1200);
}

function readForm() {
  return {
    stepPercent: clampNumber(parseFloat(fields.stepPercent.value), 0.1, 10, DEFAULTS.stepPercent),
    shiftWheelStepPercent: clampNumber(parseFloat(fields.shiftWheelStepPercent.value), 0.1, 20, DEFAULTS.shiftWheelStepPercent),
    shiftWheelMode: fields.shiftWheelMode.value,
    ctrlWheelMode: fields.ctrlWheelMode.value,
    scrollThreshold: clampNumber(parseInt(fields.scrollThreshold.value, 10), 1, 200, DEFAULTS.scrollThreshold),
    minDelayMs: clampNumber(parseInt(fields.minDelayMs.value, 10), 0, 1000, DEFAULTS.minDelayMs),
    directionReversed: fields.directionReversed.checked,
    smoothScroll: fields.smoothScroll.checked,
    shortcuts: {
      zoomIn: shortcutFields.zoomIn.value.trim(),
      zoomOut: shortcutFields.zoomOut.value.trim(),
      zoomReset: shortcutFields.zoomReset.value.trim()
    }
  };
}

function writeForm(values) {
  const merged = {
    ...DEFAULTS,
    ...values,
    shortcuts: {
      ...DEFAULTS.shortcuts,
      ...(values.shortcuts || {})
    }
  };

  fields.stepPercent.value = merged.stepPercent;
  fields.shiftWheelStepPercent.value = merged.shiftWheelStepPercent;
  fields.shiftWheelMode.value = merged.shiftWheelMode;
  fields.ctrlWheelMode.value = merged.ctrlWheelMode;
  fields.scrollThreshold.value = merged.scrollThreshold;
  fields.minDelayMs.value = merged.minDelayMs;
  fields.directionReversed.checked = merged.directionReversed;
  fields.smoothScroll.checked = merged.smoothScroll;

  shortcutFields.zoomIn.value = merged.shortcuts.zoomIn;
  shortcutFields.zoomOut.value = merged.shortcuts.zoomOut;
  shortcutFields.zoomReset.value = merged.shortcuts.zoomReset;
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

function buildShortcutFromEvent(event) {
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

function bindShortcutCapture(field) {
  field.addEventListener("keydown", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === "Escape") {
      field.blur();
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      field.value = "";
      scheduleSave();
      showStatus("Shortcut cleared");
      return;
    }

    const shortcut = buildShortcutFromEvent(event);
    if (!shortcut) return;

    field.value = shortcut;
    scheduleSave();
    showStatus("Shortcut saved");
  });
}

function saveSettings() {
  const values = readForm();
  chrome.storage.sync.set(values, () => showStatus("Saved"));
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, 150);
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    writeForm(items);
  });
}

const normalFields = Object.values(fields);
normalFields.forEach((field) => {
  field.addEventListener("input", scheduleSave);
  field.addEventListener("change", scheduleSave);
});

Object.values(shortcutFields).forEach((field) => {
  bindShortcutCapture(field);
});

resetBtn.addEventListener("click", () => {
  chrome.storage.sync.set(DEFAULTS, () => {
    loadSettings();
    showStatus("Defaults restored");
  });
});

loadSettings();
