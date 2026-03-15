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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundZoom(value) {
  return Number(value.toFixed(3));
}

async function getSettings() {
  const items = await chrome.storage.sync.get(DEFAULTS);
  return {
    ...DEFAULTS,
    ...items,
    shortcuts: {
      ...DEFAULTS.shortcuts,
      ...(items.shortcuts || {})
    }
  };
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
  await applyCommand(tabId, command);
}

async function applyCommand(tabId, command) {
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
  if (!message) return;
  const tabId = sender?.tab?.id;
  if (!tabId) return;

  if (message.type === "shortcutCommand") {
    applyCommand(tabId, message.command).catch(() => {});
    return;
  }

  if (message.type === "wheelZoom") {
    const direction = message.direction === 1 ? 1 : -1;
    getSettings()
      .then((settings) => {
        const requestedStep = Number(message.stepPercent);
        const stepPercent =
          Number.isFinite(requestedStep) && requestedStep > 0
            ? requestedStep
            : settings.stepPercent;
        return applyZoomDelta(tabId, direction * stepPercent, settings);
      })
      .catch(() => {});
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(null, (items) => {
    chrome.storage.sync.set({
      ...DEFAULTS,
      ...items,
      shortcuts: {
        ...DEFAULTS.shortcuts,
        ...(items.shortcuts || {})
      }
    });
  });
});
