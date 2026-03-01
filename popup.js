const DEFAULTS = {
  stepPercent: 1,
  minZoom: 0.25,
  maxZoom: 5,
  ctrlWheelMode: "zoom",
  scrollThreshold: 40,
  minDelayMs: 80,
  directionReversed: false,
  smoothScroll: true
};

const fields = {
  stepPercent: document.getElementById("stepPercent"),
  ctrlWheelMode: document.getElementById("ctrlWheelMode"),
  scrollThreshold: document.getElementById("scrollThreshold"),
  minDelayMs: document.getElementById("minDelayMs"),
  directionReversed: document.getElementById("directionReversed"),
  smoothScroll: document.getElementById("smoothScroll")
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
    ctrlWheelMode: fields.ctrlWheelMode.value,
    scrollThreshold: clampNumber(parseInt(fields.scrollThreshold.value, 10), 1, 200, DEFAULTS.scrollThreshold),
    minDelayMs: clampNumber(parseInt(fields.minDelayMs.value, 10), 0, 1000, DEFAULTS.minDelayMs),
    directionReversed: fields.directionReversed.checked,
    smoothScroll: fields.smoothScroll.checked
  };
}

function writeForm(values) {
  fields.stepPercent.value = values.stepPercent;
  fields.ctrlWheelMode.value = values.ctrlWheelMode;
  fields.scrollThreshold.value = values.scrollThreshold;
  fields.minDelayMs.value = values.minDelayMs;
  fields.directionReversed.checked = values.directionReversed;
  fields.smoothScroll.checked = values.smoothScroll;
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

Object.values(fields).forEach((field) => {
  field.addEventListener("input", scheduleSave);
  field.addEventListener("change", scheduleSave);
});

resetBtn.addEventListener("click", () => {
  chrome.storage.sync.set(DEFAULTS, () => {
    loadSettings();
    showStatus("Defaults restored");
  });
});

loadSettings();
