# addons.mozilla.org listing texts

Copy these texts into the AMO Developer Hub when you submit the add-on.

- **Name:** Chat Exporter for Claude
- **Add-on URL slug:** `chat-exporter-for-claude`
- **Categories (Firefox):** Download Management, Other
- **Tags:** export, html, chat, archive, backup, claude, ai
- **License:** MIT
- **Homepage:** https://github.com/brokoskokoli/chat-exporter-for-claude
- **Support site:** https://github.com/brokoskokoli/chat-exporter-for-claude/issues
- **Privacy policy:** not required (the add-on collects no data)
- **Icon:** `extension/icons/icon-128.png`

---

## English (default locale)

### Summary (max. 250 characters)

Export your Claude chats from claude.ai as one self-contained HTML file that looks exactly like the conversation, with fonts, formatting and code highlighting. Works offline. Unofficial, not affiliated with Anthropic.

### Description

Save any Claude conversation as a single HTML file that looks just like it does on claude.ai.

**Features**
- Same look as the chat: message bubbles, typography, Markdown, tables and code blocks with syntax highlighting
- One self-contained file: styles, fonts and images are embedded, so it works offline
- Exports complete conversations, including very long chats
- Removes copy, retry and rating buttons for clean output
- Keeps your light or dark theme
- Print-friendly, so you can use "Save as PDF"
- No data collection: everything runs locally in your browser

**How to use**
Open a chat on claude.ai and click the toolbar icon, or press Alt+Shift+E. The add-on scrolls through the chat once, collects all messages and asks where to save the HTML file.

Open source: https://github.com/brokoskokoli/chat-exporter-for-claude

This is an unofficial project. It is not affiliated with, endorsed by or sponsored by Anthropic. "Claude" is a trademark of Anthropic, PBC.

---

## Deutsch

### Zusammenfassung (max. 250 Zeichen)

Exportiert Claude-Chats von claude.ai als eine eigenständige HTML-Datei, die genau wie der Chat aussieht: mit Schriften, Formatierung und Code-Highlighting. Funktioniert offline. Inoffiziell, nicht mit Anthropic verbunden.

### Beschreibung

Speichere jede Claude-Unterhaltung als eine einzige HTML-Datei, die genauso aussieht wie auf claude.ai.

**Funktionen**
- Gleiches Aussehen wie im Chat: Nachrichten-Bubbles, Typografie, Markdown, Tabellen und Codeblöcke mit Syntax-Highlighting
- Eine eigenständige Datei: Styles, Schriften und Bilder sind eingebettet, die Datei funktioniert also offline
- Exportiert komplette Unterhaltungen, auch sehr lange Chats
- Entfernt die Buttons für Kopieren, Wiederholen und Bewerten
- Übernimmt das helle oder dunkle Design
- Druckfreundlich, also auch als PDF speicherbar
- Keine Datensammlung: Alles läuft lokal im Browser

**Benutzung**
Einen Chat auf claude.ai öffnen und auf das Symbol in der Toolbar klicken oder Alt+Shift+E drücken. Das Add-on scrollt einmal durch den Chat, sammelt alle Nachrichten und fragt dann nach dem Speicherort für die HTML-Datei.

Open Source: https://github.com/brokoskokoli/chat-exporter-for-claude

Inoffizielles Projekt. Es ist nicht mit Anthropic verbunden und wird von Anthropic weder unterstützt noch gesponsert. „Claude“ ist eine Marke von Anthropic, PBC.

---

## Notes to Reviewer

The extension exports the currently open claude.ai conversation as an HTML file. No code is minified or bundled, and there is no build step besides zipping the `extension/` folder.

Permissions:
- `https://claude.ai/*`: the content script reads the open conversation's DOM and stylesheets.
- `https://assets-proxy.anthropic.com/*`: claude.ai's web fonts are hosted there. They are fetched and embedded as data URLs so the exported file works offline.
- `downloads`: saves the generated HTML file (with a "Save as" dialog).

No data is sent anywhere else, and nothing is collected or stored.

To test: open any conversation on https://claude.ai while logged in, then click the toolbar button.
