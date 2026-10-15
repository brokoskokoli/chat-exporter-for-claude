# Aufbau von claude.ai (Stand 2026-10)

Wie die Seite aufgebaut ist und was `extension/content.js` daraus macht.

- Nachrichten: `[data-testid="transcript-row"]` mit `data-index` (0…n), darin `[data-testid="user-message"]` bzw. `[data-testid="assistant-message"]`.
- **Die Liste ist virtualisiert:** Im DOM stehen nur die sichtbaren Zeilen, dazu Platzhalter `transcript-spacer`. Der Export sucht deshalb den scrollbaren Container, scrollt von oben in Schritten durch, klont jede Zeile anhand von `data-index` und prüft am Ende, ob Indizes fehlen.
- `<html>` hat die Klasse `scroll-smooth`. Deshalb mit `scrollTo({ behavior: "instant" })` scrollen, sonst werden Zeilen übersprungen.
- Die Stylesheets (u. a. von `assets-proxy.anthropic.com`) lassen sich auslesen (`cssRules`), und die Schriften sind per CORS abrufbar. Eingebettet werden nur die Schriften, die tatsächlich verwendet werden.
- Entfernt werden Aktions-Buttons (`message-actions`, `action-bar-*`, Copy/Retry/Edit …).
- Wenn Anthropic das Layout ändert, sind meist zuerst `ROW_SEL` und `REMOVE_SELECTORS` in `content.js` anzupassen.
