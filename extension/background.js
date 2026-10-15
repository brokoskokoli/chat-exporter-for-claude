"use strict";

// Nur einzelne Chats lassen sich exportieren: https://claude.ai/chat/<id>
const CHAT_URL = /^https:\/\/claude\.ai\/chat\/[0-9a-f-]{8,}/i;
const isChat = (url) => !!url && CHAT_URL.test(url);

const DE = /^de\b/i.test(browser.i18n.getUILanguage());
const TITLE_ENABLED = DE ? "Claude-Chat als HTML exportieren" : "Export Claude chat as HTML";
const TITLE_DISABLED = DE ? "Öffne einen Claude-Chat, um ihn zu exportieren" : "Open a Claude chat to export it";

// Button pro Tab aktivieren bzw. ausgrauen.
function updateButton(tabId, url) {
  const chat = isChat(url);
  (chat ? browser.browserAction.enable(tabId) : browser.browserAction.disable(tabId)).catch(() => {});
  browser.browserAction.setTitle({ tabId, title: chat ? TITLE_ENABLED : TITLE_DISABLED }).catch(() => {});
}

// Standard: ausgegraut. tab.url ist ohnehin nur für claude.ai-Tabs sichtbar (Host-Berechtigung).
browser.browserAction.disable();
browser.browserAction.setTitle({ title: TITLE_DISABLED });

// claude.ai ist eine Single-Page-App: URL-Wechsel kommen über tabs.onUpdated.
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") updateButton(tabId, tab.url);
});
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  try { updateButton(tabId, (await browser.tabs.get(tabId)).url); } catch {}
});
browser.tabs.query({}).then((tabs) => tabs.forEach((t) => updateButton(t.id, t.url)));

// Toolbar-Button: Export im aktiven Tab anstoßen.
browser.browserAction.onClicked.addListener(async (tab) => {
  if (!isChat(tab.url)) return;
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
    // Firefox für Android kennt die Option "saveAs" nicht.
    const { os } = await browser.runtime.getPlatformInfo();
    const options = { url, filename: msg.filename };
    if (os !== "android") options.saveAs = true;
    await browser.downloads.download(options);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  return { ok: true };
});
