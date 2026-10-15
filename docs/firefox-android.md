# Firefox für Android

Besonderheiten der Extension auf Android und wie man dort testet.

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
