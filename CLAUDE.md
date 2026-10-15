# CLAUDE.md – Chat Exporter for Claude

Firefox-Extension (Manifest V2, Firefox ≥ 140, Android ≥ 142), die den aktuell geöffneten claude.ai-Chat als eigenständige HTML-Datei exportiert (eingebettete Styles, Schriften und Bilder; sieht aus wie im Chat).
Repo: https://github.com/brokoskokoli/chat-exporter-for-claude · AMO-Slug: `chat-exporter-for-claude` · Lizenz: MIT · inoffiziell, nicht mit Anthropic verbunden.

## Struktur

| Pfad | Inhalt |
| --- | --- |
| `extension/` | Die Extension selbst. Genau dieser Ordner wird als `.xpi` gezippt. |
| `extension/content.js` | Auf `https://claude.ai/*`: sammelt die Nachrichten, CSS, Schriften und Bilder ein und baut das HTML |
| `extension/background.js` | Toolbar-Button (aktiv nur auf `https://claude.ai/chat/<id>`, sonst ausgegraut) und Download auf dem Desktop |
| `assets/icon.svg` | Quelle der Icons; PNGs in `extension/icons/` mit `rsvg-convert` erzeugt (16/32/48/96/128) |
| `.github/workflows/release.yml` | Build, Release und Upload zu AMO bei jedem `v*`-Tag |
| `scripts/set-amo-secrets.sh` | Legt die AMO-API-Schlüssel als GitHub-Secrets an |
| `store/listing.md` | Texte für den Store-Eintrag (EN/DE) und Hinweise für die Prüfer |

## Release-Ablauf

1. `version` in `extension/manifest.json` hochsetzen und committen.
2. Passenden Tag setzen und beides pushen: `git tag vX.Y.Z && git push origin main vX.Y.Z`
3. Die Pipeline macht dann Folgendes:
   - Sie prüft, ob **Tag und Manifest-Version übereinstimmen**, und bricht sonst ab. Das Manifest wird **nicht** umgeschrieben. Früher hat `jq` es dabei umformatiert, das ist bewusst entfernt.
   - Sie führt `web-ext lint` aus, baut `chat-exporter-for-claude-<version>.xpi` und legt ein GitHub-Release an (unsigniert).
   - Sie lädt die Version mit `web-ext sign --channel listed --approval-timeout 0` zu addons.mozilla.org hoch. Das passiert nur, wenn die Secrets `AMO_JWT_ISSUER` und `AMO_JWT_SECRET` gesetzt sind (`scripts/set-amo-secrets.sh`). Auf Mozillas Prüfung wartet die Pipeline nicht.
- Jede Versionsnummer lässt sich bei AMO **nur einmal** hochladen. Einen Tag nie wiederverwenden und für Korrekturen immer eine neue Version nehmen.
- Die `.xpi` ist ein normales ZIP von `extension/`, alle Dateien unverändert wie committet. Es gibt keinen Build-Schritt, nichts wird minifiziert oder gebündelt. Bei Mozilla muss deshalb kein Quellcode extra hochgeladen werden.
- Ohne Tag lässt sich die Pipeline von Hand starten (`gh workflow run release.yml --ref main`). Sie baut dann nur, Release und AMO-Upload werden übersprungen.

## Git-Regeln

- Commit-Messages: `Co-Authored-By: Claude …` bleibt drin, die Zeile **`Claude-Session:` nie** einfügen, auch nicht in PRs.
- Das Repo ist öffentlich: keine persönlichen Daten und keine Inhalte aus Chats committen.

## Lokal bauen und prüfen

```bash
npx web-ext lint  --source-dir extension            # muss 0 errors / 0 warnings melden
npx web-ext build --source-dir extension --artifacts-dir . --overwrite-dest --filename chat-exporter-for-claude.zip \
  && mv -f chat-exporter-for-claude.zip chat-exporter-for-claude.xpi   # lokale Datei heißt wie der Ordner
```

`*.xpi` und `*.zip` stehen in `.gitignore`.

## Aufbau von claude.ai (Stand 2026-10)

- Nachrichten: `[data-testid="transcript-row"]` mit `data-index` (0…n), darin `[data-testid="user-message"]` bzw. `[data-testid="assistant-message"]`.
- **Die Liste ist virtualisiert:** Im DOM stehen nur die sichtbaren Zeilen, dazu Platzhalter `transcript-spacer`. Der Export sucht deshalb den scrollbaren Container, scrollt von oben in Schritten durch, klont jede Zeile anhand von `data-index` und prüft am Ende, ob Indizes fehlen.
- `<html>` hat die Klasse `scroll-smooth`. Deshalb mit `scrollTo({ behavior: "instant" })` scrollen, sonst werden Zeilen übersprungen.
- Die Stylesheets (u. a. von `assets-proxy.anthropic.com`) lassen sich auslesen (`cssRules`), und die Schriften sind per CORS abrufbar. Eingebettet werden nur die Schriften, die tatsächlich verwendet werden.
- Entfernt werden Aktions-Buttons (`message-actions`, `action-bar-*`, Copy/Retry/Edit …).
- Wenn Anthropic das Layout ändert, sind meist zuerst `ROW_SEL` und `REMOVE_SELECTORS` in `content.js` anzupassen.

## Firefox für Android

- `downloads.download()` startet auf Android nicht, und `saveAs` wird dort nicht unterstützt. Auf Android lädt deshalb die Seite selbst herunter (`pageDownload` in `content.js`: Blob aus dem Seitenkontext über `wrappedJSObject` und `cloneInto`, dann `<a download>`). Am Desktop läuft der Download über die Downloads-API, bei einem Fehler nimmt er denselben Weg wie auf Android.
- `commands` (Alt+Shift+E) gibt es auf Android nicht. Der Button liegt dort im ⋮-Menü unter „Erweiterungen“.
- So auf einem Android-Gerät testen:
  ```bash
  PATH="$HOME/Library/Android/sdk/platform-tools:$PATH" npx web-ext run -t firefox-android \
    --source-dir extension --android-device <ID aus `adb devices`> --firefox-apk org.mozilla.firefox \
    --adb-bin "$HOME/Library/Android/sdk/platform-tools/adb"
  ```
  Dafür müssen auf dem Handy USB-Debugging und in Firefox „Remote-Debugging über USB“ (Einstellungen → Entwicklerwerkzeuge) eingeschaltet sein. Das Release-Firefox schreibt keine Konsolen-Logs der Extension ins Android-Systemprotokoll (`logcat`).
- Kompatibilität von APIs vor der Benutzung in den MDN-Daten nachschlagen (`mdn/browser-compat-data`, `webextensions/…`) und nicht aus dem Gedächtnis annehmen.

## Testen am Desktop

Der Export lässt sich ohne Firefox prüfen: den Code aus `content.js` per Browser-Automation in einen geöffneten claude.ai-Chat einschleusen und `window.__claudeHtmlExport()` aufrufen. Das liefert `{ html, filename, count, missing }`. Bei einem Test mit 56 Nachrichten waren alle erfasst, die Datei war etwa 4,4 MB groß (vor allem durch die Schriften). Zum Ansehen in ein `iframe` mit `srcdoc` laden. Blob-URLs blockiert die Content Security Policy von claude.ai.
