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
| `.github/dependabot.yml` | Dependabot hält die Actions aktuell (monatlich, ein gebündelter PR) |
| `docs/` | Detail-Doku, siehe unten |
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

## Weiterführende Doku (nur bei Bedarf lesen)

- [docs/claude-ai-dom.md](docs/claude-ai-dom.md): Aufbau von claude.ai (virtualisierte Nachrichtenliste, Selektoren, Scrollen, Styles und Schriften). Lesen, wenn sich das Layout von claude.ai geändert hat oder der Export Nachrichten auslässt.
- [docs/firefox-android.md](docs/firefox-android.md): Firefox für Android (Download-Weg, nicht unterstützte APIs, Test per USB mit `web-ext run -t firefox-android`). Lesen, wenn es um Android oder um Downloads geht.

## Testen am Desktop

Der Export lässt sich ohne Firefox prüfen: den Code aus `content.js` per Browser-Automation in einen geöffneten claude.ai-Chat einschleusen und `window.__claudeHtmlExport()` aufrufen. Das liefert `{ html, filename, count, missing }`. Bei einem Test mit 56 Nachrichten waren alle erfasst, die Datei war etwa 4,4 MB groß (vor allem durch die Schriften). Zum Ansehen in ein `iframe` mit `srcdoc` laden. Blob-URLs blockiert die Content Security Policy von claude.ai.
