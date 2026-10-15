"use strict";

(() => {
  if (window.__claudeHtmlExportLoaded) return;
  window.__claudeHtmlExportLoaded = true;

  const ROW_SEL = '[data-testid="transcript-row"]';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Texte je nach Browsersprache (Deutsch oder Englisch).
  const DE = /^de\b/i.test(navigator.language || "");
  const MSG = DE ? {
    start: "Starte Export …",
    collecting: (n) => `Sammle Nachrichten … ${n}`,
    fonts: (i, n) => `Bette Schriften ein … ${i}/${n}`,
    images: (n) => `Bette ${n} Bild(er) ein …`,
    styles: "Sammle Styles …",
    building: "Erzeuge HTML …",
    done: (n) => `Export fertig: ${n} Nachrichten.`,
    doneMissing: (n, m) => `Export fertig (${n} Nachrichten, ${m} fehlen).`,
    failed: (e) => `Export fehlgeschlagen: ${e}`,
    empty: "Kein Chat-Inhalt gefunden.",
    exportedAt: "Exportiert am",
    missingWarn: (m) => `Hinweis: ${m} Nachricht(en) konnten nicht erfasst werden.`
  } : {
    start: "Starting export …",
    collecting: (n) => `Collecting messages … ${n}`,
    fonts: (i, n) => `Embedding fonts … ${i}/${n}`,
    images: (n) => `Embedding ${n} image(s) …`,
    styles: "Collecting styles …",
    building: "Building HTML …",
    done: (n) => `Export finished: ${n} messages.`,
    doneMissing: (n, m) => `Export finished (${n} messages, ${m} missing).`,
    failed: (e) => `Export failed: ${e}`,
    empty: "No chat content found.",
    exportedAt: "Exported on",
    missingWarn: (m) => `Note: ${m} message(s) could not be captured.`
  };

  // Elemente, die im Export nichts verloren haben (Aktionsleisten, Kopieren-/Retry-Buttons …).
  const REMOVE_SELECTORS = [
    "script",
    "noscript",
    '[data-testid="message-actions"]',
    '[data-testid^="action-bar"]',
    '[data-testid="failed-send-status-region"]',
    'button[aria-label^="Show message actions"]',
    'button[aria-label="Copy"]',
    'button[aria-label="Copy to clipboard"]',
    'button[aria-label="Edit"]',
    'button[aria-label="Retry"]',
    'button[aria-label="Read aloud"]',
    'button[aria-label="Good response"]',
    'button[aria-label="Bad response"]',
    "textarea",
    '[contenteditable="true"]'
  ];

  // Seitenkontext-fetch (schickt Cookies mit) für claude.ai-URLs, sonst normaler fetch.
  const pageFetch =
    typeof content !== "undefined" && content.fetch ? content.fetch.bind(content) : fetch.bind(window);

  async function toDataUrl(url) {
    const sameOrigin = new URL(url, location.href).origin === location.origin;
    const res = await (sameOrigin ? pageFetch(url, { credentials: "include" }) : fetch(url));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  // ---------- UI: kleiner Status-Toast ----------
  let toastEl = null;
  function toast(text, { error = false, done = false } = {}) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      Object.assign(toastEl.style, {
        position: "fixed", right: "16px", bottom: "16px", zIndex: 2147483647,
        padding: "10px 14px", borderRadius: "10px", font: "13px/1.4 system-ui, sans-serif",
        boxShadow: "0 4px 18px rgba(0,0,0,.25)", maxWidth: "360px", pointerEvents: "none"
      });
      document.documentElement.appendChild(toastEl);
    }
    toastEl.style.background = error ? "#b42318" : "#1f1e1d";
    toastEl.style.color = "#fff";
    toastEl.textContent = text;
    if (done || error) {
      const el = toastEl;
      setTimeout(() => { if (toastEl === el) { el.remove(); toastEl = null; } }, error ? 6000 : 3000);
    }
  }

  // ---------- 1. Alle Nachrichten einsammeln (Liste ist virtualisiert) ----------
  function findScroller(start) {
    let el = start;
    while (el && el !== document.documentElement) {
      const oy = getComputedStyle(el).overflowY;
      if (/(auto|scroll)/.test(oy) && el.scrollHeight > el.clientHeight + 1) return el;
      el = el.parentElement;
    }
    return document.scrollingElement;
  }

  function scrollToY(sc, y) {
    sc.scrollTo({ top: y, behavior: "instant" });
  }

  function collectFonts(root, fonts) {
    for (const el of root.querySelectorAll("*")) {
      const ff = getComputedStyle(el).fontFamily;
      if (ff) ff.split(",").forEach((f) => fonts.add(f.trim().replace(/^["']|["']$/g, "").toLowerCase()));
    }
  }

  async function captureRows(progress) {
    const first = document.querySelector(ROW_SEL);
    if (!first) return null;
    const sc = findScroller(first.parentElement);
    const originalTop = sc.scrollTop;
    const captured = new Map(); // data-index -> geklonte Zeile
    const fonts = new Set();

    const grab = () => {
      for (const row of document.querySelectorAll(ROW_SEL)) {
        const idx = Number(row.getAttribute("data-index"));
        if (Number.isNaN(idx)) continue;
        // Nur Zeilen mit Inhalt übernehmen (beim Vorrendern sind sie kurz leer).
        if (!row.textContent.trim() && !row.querySelector("img,svg")) continue;
        const wasNew = !captured.has(idx);
        captured.set(idx, row.cloneNode(true));
        if (wasNew) collectFonts(row, fonts);
      }
    };

    // Ganz nach oben, bis nichts mehr nachgeladen wird.
    let lastH = -1;
    for (let i = 0; i < 40; i++) {
      scrollToY(sc, 0);
      await sleep(250);
      if (sc.scrollTop === 0 && sc.scrollHeight === lastH) break;
      lastH = sc.scrollHeight;
    }
    grab();

    const pass = async (stepFactor, wait) => {
      let atBottomCount = 0;
      for (let i = 0; i < 5000; i++) {
        scrollToY(sc, sc.scrollTop + Math.max(80, sc.clientHeight * stepFactor));
        await sleep(wait);
        grab();
        progress(MSG.collecting(captured.size));
        if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) {
          if (++atBottomCount >= 3) break;
          await sleep(wait);
        } else {
          atBottomCount = 0;
        }
      }
    };

    const missing = () => {
      const keys = [...captured.keys()];
      if (!keys.length) return [];
      const max = Math.max(...keys);
      const out = [];
      for (let i = 0; i <= max; i++) if (!captured.has(i)) out.push(i);
      return out;
    };

    await pass(0.45, 220);
    // Falls Lücken: langsamer nochmal durchgehen.
    for (let attempt = 0; attempt < 2 && missing().length; attempt++) {
      scrollToY(sc, 0);
      await sleep(400);
      grab();
      await pass(0.25, 400);
    }

    const width = first.getBoundingClientRect().width;
    scrollToY(sc, originalTop);

    const rows = [...captured.entries()].sort((a, b) => a[0] - b[0]).map(([, el]) => el);
    return { rows, width, fonts, missing: missing() };
  }

  // Fallback für unbekanntes Layout: Inhalt von <main> verwenden.
  function captureFallback() {
    const main = document.querySelector("main") || document.body;
    const fonts = new Set();
    collectFonts(main, fonts);
    return { rows: [main.cloneNode(true)], width: Math.min(main.getBoundingClientRect().width, 900), fonts, missing: [] };
  }

  // ---------- 2. CSS einsammeln ----------
  function absolutizeCssUrls(cssText, baseHref) {
    return cssText.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => {
      if (/^(data:|#|blob:)/i.test(u)) return m;
      try { return `url("${new URL(u, baseHref).href}")`; } catch { return m; }
    });
  }

  function collectCss() {
    const parts = [];
    for (const sheet of document.styleSheets) {
      if (sheet.ownerNode && sheet.ownerNode.id === "__claude-export-ignore") continue;
      const base = sheet.href || location.href;
      try {
        const rules = [...sheet.cssRules].map((r) => r.cssText).join("\n");
        parts.push(absolutizeCssUrls(rules, base));
      } catch {
        // Nicht lesbares Fremd-Stylesheet: per @import einbinden.
        if (sheet.href) parts.push(`@import url("${sheet.href}");`);
      }
    }
    for (const sheet of document.adoptedStyleSheets || []) {
      try { parts.push([...sheet.cssRules].map((r) => r.cssText).join("\n")); } catch {}
    }
    return parts.join("\n");
  }

  // Webfonts, die im Chat tatsächlich benutzt werden, als data:-URL einbetten (Offline-tauglich).
  async function embedFonts(css, usedFamilies, progress) {
    const faceRe = /@font-face\s*{[^}]*}/g;
    const faces = css.match(faceRe) || [];
    const urlMap = new Map();
    for (const face of faces) {
      const fam = (face.match(/font-family:\s*(['"]?)([^;'"]+)\1/) || [])[2];
      if (!fam || !usedFamilies.has(fam.trim().toLowerCase())) continue;
      for (const m of face.matchAll(/url\("([^"]+)"\)/g)) {
        if (!m[1].startsWith("data:")) urlMap.set(m[1], null);
      }
    }
    let n = 0;
    await Promise.all([...urlMap.keys()].map(async (u) => {
      try { urlMap.set(u, await toDataUrl(u)); } catch { /* bleibt absolute URL */ }
      progress(MSG.fonts(++n, urlMap.size));
    }));
    return css.replace(/url\("([^"]+)"\)/g, (m, u) => (urlMap.get(u) ? `url("${urlMap.get(u)}")` : m));
  }

  // ---------- 3. Geklonte Nachrichten aufräumen ----------
  async function cleanRows(rows, progress) {
    const imgJobs = [];
    for (const row of rows) {
      row.querySelectorAll(REMOVE_SELECTORS.join(",")).forEach((el) => el.remove());
      row.removeAttribute("style");
      row.querySelectorAll("[data-perf-row],[data-rs-index]").forEach((el) => {
        el.removeAttribute("data-perf-row");
        el.removeAttribute("data-rs-index");
      });
      // Links absolut machen und in neuem Tab öffnen.
      row.querySelectorAll("a[href]").forEach((a) => {
        try { a.setAttribute("href", new URL(a.getAttribute("href"), location.href).href); } catch {}
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });
      // Bilder einbetten.
      row.querySelectorAll("img").forEach((img) => {
        const src = img.currentSrc || img.getAttribute("src");
        img.removeAttribute("srcset");
        img.removeAttribute("loading");
        if (!src || src.startsWith("data:")) return;
        const abs = new URL(src, location.href).href;
        img.setAttribute("src", abs);
        imgJobs.push(toDataUrl(abs).then((d) => img.setAttribute("src", d)).catch(() => {}));
      });
      // Animationen/Streaming-Zustände entfernen.
      row.querySelectorAll("[data-is-streaming]").forEach((el) => el.setAttribute("data-is-streaming", "false"));
    }
    if (imgJobs.length) {
      progress(MSG.images(imgJobs.length));
      await Promise.all(imgJobs);
    }
  }

  // ---------- 4. HTML-Dokument bauen ----------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function chatTitle() {
    const t = document.title.replace(/\s*[-–|]\s*Claude\s*$/i, "").trim();
    return t || "Claude Chat";
  }

  function buildHtml({ rows, width, css, missing }) {
    const html = document.documentElement;
    const htmlAttrs = [...html.attributes]
      .filter((a) => !/^data-(build|git|env|boot|entry|top-level)/.test(a.name))
      .map((a) => `${a.name}="${escapeHtml(a.value)}"`)
      .join(" ");
    const bodyClass = escapeHtml(document.body.className);
    const title = chatTitle();
    const exportedAt = new Date().toLocaleString();
    const wrapWidth = Math.round(Math.max(480, width || 768));

    const exportCss = `
      html, body { height: auto !important; min-height: 100% !important; overflow: visible !important; }
      .claude-export-wrap { max-width: ${wrapWidth}px; margin: 0 auto; padding: 32px 16px 64px; }
      .claude-export-head { margin: 0 0 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(127,127,127,.25); }
      .claude-export-head h1 { font-size: 1.5rem; font-weight: 600; margin: 0 0 4px; }
      .claude-export-head p { margin: 0; opacity: .65; font-size: .85rem; }
      .claude-export-head a { text-decoration: underline; }
      .claude-export-warn { margin-top: 8px; color: #b42318; opacity: 1 !important; }
      .claude-export-wrap [data-testid="transcript-row"] { position: relative; display: flow-root; }
      @media print { .claude-export-wrap { padding: 0; max-width: none; } }
    `;

    const warn = missing.length
      ? `<p class="claude-export-warn">${escapeHtml(MSG.missingWarn(missing.length))}</p>`
      : "";

    return `<!DOCTYPE html>
<html ${htmlAttrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
${css}
</style>
<style>${exportCss}</style>
</head>
<body class="${bodyClass}">
<div class="claude-export-wrap">
  <header class="claude-export-head">
    <h1>${escapeHtml(title)}</h1>
    <p>${MSG.exportedAt} ${escapeHtml(exportedAt)} · <a href="${escapeHtml(location.href)}">${escapeHtml(location.href)}</a></p>
    ${warn}
  </header>
  <div class="claude-export-transcript">
${rows.map((r) => r.outerHTML).join("\n")}
  </div>
</div>
</body>
</html>`;
  }

  function filenameFor(title) {
    const safe = title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 100);
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return `${safe || "Claude Chat"} (${stamp}).html`;
  }

  // ---------- Hauptablauf ----------
  let running = false;
  async function exportChat(progress = toast) {
    const captured = (await captureRows(progress)) || captureFallback();
    if (!captured.rows.length) throw new Error(MSG.empty);
    progress(MSG.styles);
    let css = collectCss();
    css = await embedFonts(css, captured.fonts, progress);
    await cleanRows(captured.rows, progress);
    progress(MSG.building);
    const html = buildHtml({ ...captured, css });
    return { html, filename: filenameFor(chatTitle()), count: captured.rows.length, missing: captured.missing };
  }

  // Für Tests im Browser direkt aufrufbar.
  window.__claudeHtmlExport = exportChat;

  const IS_ANDROID = /Android/i.test(navigator.userAgent);

  // Download direkt aus der Seite heraus (wie ein normaler Website-Download).
  // Wird auf Android genutzt, weil downloads.download() dort nicht zuverlässig startet.
  function pageDownload(html, filename) {
    const w = window.wrappedJSObject || window;
    const clone = typeof cloneInto === "function" ? (v) => cloneInto(v, w) : (v) => v;
    const blob = new w.Blob(clone([html]), clone({ type: "text/html;charset=utf-8" }));
    const url = w.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => w.URL.revokeObjectURL(url), 60_000);
  }

  async function saveFile(html, filename) {
    if (IS_ANDROID) return pageDownload(html, filename);
    try {
      await browser.runtime.sendMessage({ type: "claude-export:download", html, filename });
    } catch (e) {
      console.warn("[Chat Exporter for Claude] downloads API failed, falling back", e);
      pageDownload(html, filename);
    }
  }

  async function run() {
    if (running) return;
    running = true;
    try {
      toast(MSG.start);
      const { html, filename, count, missing } = await exportChat(toast);
      await saveFile(html, filename);
      toast(
        missing.length ? MSG.doneMissing(count, missing.length) : MSG.done(count),
        { done: true }
      );
    } catch (e) {
      console.error("[Chat Exporter for Claude]", e);
      toast(MSG.failed(e.message || e), { error: true });
    } finally {
      running = false;
    }
  }

  if (typeof browser !== "undefined" && browser.runtime?.onMessage) {
    browser.runtime.onMessage.addListener((msg) => {
      if (msg?.type === "claude-export:start") run();
    });
  }
})();
