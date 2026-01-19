# ioBroker objects fetch script

Dieses kleine Projekt verbindet sich per HTTP mit ioBroker und versucht, die Objekte abzuziehen.

Usage

1. Installiere Abhängigkeiten:

```bash
npm install
```

2. Optional: Um andere URL oder Auth zu nutzen, setze Umgebungsvariablen:

- `IOBROKER_URL` (default: `http://192.168.1.235:8082`)
- `IOBROKER_USER` und `IOBROKER_PASS` für Basic Auth (falls benötigt)

3. Script ausführen:

```bash
npm start
```

Dateien

- [scripts/iobroker-fetch.js](scripts/iobroker-fetch.js) — versucht mehrere mögliche HTTP-Endpunkte und gibt die Antwort aus.
- [package.json](package.json) — enthält `axios` dependency und `start` script.
