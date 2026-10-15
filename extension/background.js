"use strict";

// Toolbar-Button: Export im aktiven Tab anstoßen.
browser.browserAction.onClicked.addListener(async (tab) => {
  // Nur auf claude.ai aktiv.
  if (!tab.url || !/^https:\/\/claude\.ai\//.test(tab.url)) return;
  try {
    await browser.tabs.sendMessage(tab.id, { type: "claude-export:start" });
  } catch (e) {
    // Content-Script noch nicht geladen (z. B. Tab war schon vor der Installation offen).
    await browser.tabs.executeScript(tab.id, { file: "content.js" });
    await browser.tabs.sendMessage(tab.id, { type: "claude-export:start" });
  }
});

// Download der fertigen HTML-Datei.
browser.runtime.onMessage.addListener(async (msg) => {
  if (msg?.type !== "claude-export:download") return;
  const blob = new Blob([msg.html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    await browser.downloads.download({ url, filename: msg.filename, saveAs: true });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  return { ok: true };
});
