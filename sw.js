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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundZoom(value) {
  return Number(value.toFixed(3));
}

async function getSettings() {
  return await chrome.storage.sync.get(DEFAULTS);
}

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs[0]?.id;
}

async function applyZoomDelta(tabId, deltaPercent, settingsOverride) {
  const settings = settingsOverride || (await getSettings());
  const current = await chrome.tabs.getZoom(tabId);
  const next = clamp(
    roundZoom(current + deltaPercent / 100),
    settings.minZoom,
    settings.maxZoom
  );
  await chrome.tabs.setZoom(tabId, next);
}

async function handleCommand(command) {
  const tabId = await getActiveTabId();
  if (!tabId) return;

  if (command === "zoom_reset") {
    await chrome.tabs.setZoom(tabId, 0);
    return;
  }

  const settings = await getSettings();
  if (command === "zoom_in") {
    await applyZoomDelta(tabId, settings.stepPercent, settings);
  } else if (command === "zoom_out") {
    await applyZoomDelta(tabId, -settings.stepPercent, settings);
  }
}

chrome.commands.onCommand.addListener((command) => {
  handleCommand(command).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || message.type !== "wheelZoom") return;
  const tabId = sender?.tab?.id;
  if (!tabId) return;

  const direction = message.direction === 1 ? 1 : -1;
  getSettings()
    .then((settings) => applyZoomDelta(tabId, direction * settings.stepPercent, settings))
    .catch(() => {});
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    chrome.storage.sync.set(items);
  });
});
