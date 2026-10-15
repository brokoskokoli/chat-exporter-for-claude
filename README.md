<div align="center">

<img src="assets/icon.svg" width="96" height="96" alt="Chat Exporter for Claude icon">

# Chat Exporter for Claude

**Export Claude chats from claude.ai as a single, self-contained HTML file that looks exactly like the original conversation.**

A free, open-source Firefox extension that saves a Claude conversation with the same layout, fonts, code highlighting and formatting you see in the browser. You can open the file offline, archive it, share it or print it.

[![Release](https://img.shields.io/github/v/release/brokoskokoli/chat-exporter-for-claude?label=release)](https://github.com/brokoskokoli/chat-exporter-for-claude/releases/latest)
[![Build](https://img.shields.io/github/actions/workflow/status/brokoskokoli/chat-exporter-for-claude/release.yml?label=build)](https://github.com/brokoskokoli/chat-exporter-for-claude/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Firefox 140+](https://img.shields.io/badge/Firefox-140%2B-FF7139?logo=firefoxbrowser&logoColor=white)

[Features](#features) · [Installation](#installation) · [Usage](#usage) · [How it works](#how-it-works) · [Privacy](#privacy) · [Development](#development) · [Deutsch](#deutsch)

</div>

---

> **Unofficial project.** It is not affiliated with, endorsed by or sponsored by Anthropic. "Claude" is a trademark of Anthropic, PBC.

## Features

- 💬 **Looks like the chat**: user bubbles, Claude's response typography, Markdown, tables, lists and code blocks with syntax highlighting, all rendered with claude.ai's own styles.
- 📦 **One self-contained file**: the CSS, the web fonts that are used and the images are embedded into one `.html` file. It needs no internet connection and no external assets.
- 📜 **Complete conversations**: claude.ai only renders the messages currently on screen, so the extension scrolls through the whole chat and collects every message, even in very long chats.
- 🧹 **Clean output**: copy, retry, rating and edit buttons are removed.
- 🌗 **Keeps your theme**: light or dark mode is exported the way you see it.
- 🖨️ **Print friendly**: open the file and use *Print → Save as PDF* if you need a PDF.
- 🔒 **Private**: everything happens locally in your browser. The extension collects no data and has no tracking.
- 🌍 **German and English** UI messages.

## Installation

### Option 1: Firefox Add-ons (AMO)

*Coming soon.* Once the add-on is published on addons.mozilla.org, it can be installed with one click and updates automatically.

### Option 2: From a GitHub release

1. Download the latest `chat-exporter-for-claude-x.y.z.xpi` from the [Releases page](https://github.com/brokoskokoli/chat-exporter-for-claude/releases/latest).
2. The release builds are **unsigned**. Regular Firefox only installs signed add-ons, so use one of these:
   - **Firefox Developer Edition, Nightly or ESR:** open `about:config`, set `xpinstall.signatures.required` to `false`, then go to `about:addons` → ⚙️ → *Install Add-on From File…* and choose the `.xpi`.
   - **Any Firefox, temporarily:** open `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on…* and choose the `.xpi`. The add-on stays installed until Firefox restarts.

### Option 3: From source

```bash
git clone https://github.com/brokoskokoli/chat-exporter-for-claude.git
```

Open `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on…* → choose `extension/manifest.json`.

## Usage

1. Open a conversation on [claude.ai](https://claude.ai).
2. Click the **Chat Exporter for Claude** icon in the toolbar, or press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd>.
   If you can't see the icon, open the 🧩 extensions menu and pin it. The icon is greyed out unless the current tab shows a Claude chat (`https://claude.ai/chat/…`).
   On **Firefox for Android** the button is in the ⋮ menu under *Extensions*.
3. Leave the page alone while the extension scrolls through the chat. A small status box in the bottom-right corner shows the progress.
4. Choose where to save the `.html` file. The file name is the chat title plus the date, for example `My chat (2026-10-15).html`.

The shortcut can be changed under `about:addons` → ⚙️ → *Manage Extension Shortcuts*.

## How it works

```
┌─────────────┐   click / Alt+Shift+E   ┌──────────────────────────────┐
│ Toolbar btn │ ──────────────────────▶ │ content.js (on claude.ai)    │
└─────────────┘                         │ 1. scroll through transcript │
                                        │    & clone every message     │
                                        │ 2. read all page stylesheets │
                                        │ 3. embed used fonts + images │
                                        │    as data: URLs             │
                                        │ 4. strip buttons, build HTML │
                                        └──────────────┬───────────────┘
                                                       │ HTML string
                                        ┌──────────────▼───────────────┐
                                        │ background.js                │
                                        │ downloads.download(…)        │
                                        └──────────────────────────────┘
```

| File | Purpose |
| --- | --- |
| [`extension/manifest.json`](extension/manifest.json) | Extension manifest (Manifest V2, Firefox 140+) |
| [`extension/content.js`](extension/content.js) | Captures messages, CSS, fonts and images and builds the HTML document |
| [`extension/background.js`](extension/background.js) | Handles the toolbar button and saves the file |
| [`.github/workflows/release.yml`](.github/workflows/release.yml) | Builds the `.xpi` and publishes a GitHub release on every `v*` tag |
| [`store/listing.md`](store/listing.md) | Texts for the addons.mozilla.org listing (EN/DE) |

### Permissions

| Permission | Why |
| --- | --- |
| `https://claude.ai/*` | To read the open conversation |
| `https://assets-proxy.anthropic.com/*` | To download claude.ai's web fonts and embed them in the file |
| `downloads` | To save the generated HTML file |

## Privacy

The extension does **not** collect, transmit or store any data. The whole export runs locally in your browser. The only network requests go to claude.ai and its asset server, to load fonts and images that are already shown on the page.

## Limitations

- **Collapsed sections:** thinking blocks and tool outputs are exported the way they are displayed. Expand them before exporting if you want them in the file.
- **Artifacts:** the content of the side panel is not included. The artifact card inside the chat is.
- **Layout changes:** the extension depends on claude.ai's current page structure. If Anthropic changes the layout, the extension may need an update. Please [open an issue](https://github.com/brokoskokoli/chat-exporter-for-claude/issues).
- **File size:** because fonts are embedded, files are usually a few MB.

## Development

Requirements: Node.js 18+ and Firefox.

```bash
# Run Firefox with the extension loaded (auto-reloads on change)
npx web-ext run --source-dir extension --start-url https://claude.ai

# Lint with the same checks addons.mozilla.org uses
npx web-ext lint --source-dir extension

# Build an .xpi locally
npx web-ext build --source-dir extension --artifacts-dir dist
```

### Releasing

1. Bump `version` in [`extension/manifest.json`](extension/manifest.json) and commit.
2. Push a matching tag:

```bash
git tag v0.2.0
git push origin main v0.2.0
```

The GitHub Actions pipeline checks that the tag matches the manifest version (it fails otherwise), lints, builds `chat-exporter-for-claude-<version>.xpi` and attaches it to a new GitHub release.

The `.xpi` is a plain ZIP of the `extension/` folder, with all files exactly as committed. There is no build step, minification or bundling.

#### Automatic upload to addons.mozilla.org

If the repository secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` are set, the pipeline also submits every tagged version to addons.mozilla.org with `web-ext sign --channel listed`. The version is published as soon as Mozilla approves it.

1. Create an API key at <https://addons.mozilla.org/developers/addon/api/key/>.
2. Add it to the repository: *Settings → Secrets and variables → Actions*. The JWT issuer goes into `AMO_JWT_ISSUER`, the JWT secret into `AMO_JWT_SECRET`.
3. Submit the first version manually through the Developer Hub, because the listing (description, categories, …) is created there. After that, every tag uploads automatically.

Every version uploaded to AMO needs a new version number, so never re-use a tag.

## Contributing

Issues and pull requests are welcome, especially fixes for changes in claude.ai's layout.

## License

[MIT](LICENSE)

---

## Deutsch

**Chat Exporter for Claude** ist eine kostenlose Firefox-Erweiterung. Sie exportiert einen Chat von claude.ai als **eine einzige HTML-Datei**, die genauso aussieht wie im Chat: dieselben Formatierungen, Schriften und Codeblöcke mit Syntax-Highlighting. Styles, Schriften und Bilder sind in der Datei eingebettet. Sie funktioniert deshalb auch offline und lässt sich archivieren, weitergeben oder als PDF drucken.

**Installation:** Die aktuelle `.xpi` von der [Releases-Seite](https://github.com/brokoskokoli/chat-exporter-for-claude/releases/latest) herunterladen. Die Release-Builds sind nicht signiert. Zum Installieren gibt es zwei Wege:
- In Firefox Developer Edition, Nightly oder ESR: in `about:config` die Einstellung `xpinstall.signatures.required = false` setzen. Dann `about:addons` → ⚙️ → *Add-on aus Datei installieren…*
- Zum Ausprobieren in jedem Firefox: `about:debugging#/runtime/this-firefox` → *Temporäres Add-on laden…*. Das Add-on bleibt bis zum nächsten Neustart installiert.

Sobald die Erweiterung auf addons.mozilla.org veröffentlicht ist, geht die Installation dort mit einem Klick.

**Benutzung:** Einen Chat auf claude.ai öffnen und auf das Symbol in der Toolbar klicken oder <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> drücken. Während die Erweiterung durch den Chat scrollt, die Seite nicht bedienen. Danach den Speicherort wählen.

**Datenschutz:** Es werden keine Daten gesammelt oder übertragen. Alles läuft lokal im Browser.

**Neues Release:** Zuerst `version` in `extension/manifest.json` hochsetzen und committen. Dann den passenden Tag pushen, z. B. `v0.2.0`. Die Pipeline prüft, ob Tag und Manifest-Version übereinstimmen, baut die `.xpi` und legt ein GitHub-Release an. Wenn die Secrets gesetzt sind, lädt sie die Version außerdem zu addons.mozilla.org hoch. Die `.xpi` ist ein ZIP des Ordners `extension/`, die Dateien darin sind unverändert.

---

<sub>Keywords: Claude chat export, export Claude conversation to HTML, save Claude chat, claude.ai export, Claude AI conversation archive, Firefox add-on, Firefox extension, Anthropic Claude, chat to HTML, backup Claude chats, Claude Chat exportieren, Claude Unterhaltung speichern.</sub>
