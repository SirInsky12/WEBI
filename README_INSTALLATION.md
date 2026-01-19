# WEBI — Energy Dashboard

A lightweight React + Vite dashboard for visualizing home energy (solar, battery, grid) and creating custom cards. This repository contains a small front-end that connects to an ioBroker or similar state provider to render live energy data, persist daily production history locally, and present an EnergyPack-style full-page overview.

## Features

- Full-page `Green Energy` overview (production, consumption, battery, grid)
- Local history storage for production/consumption (per-card, localStorage)
- Live updates via socket.io (websocket with polling fallback)
- Inline SVG charts, responsive card components, and easy card schema
- Dev server configured for LAN testing (`vite --host`) and proxying `/socket.io`

## Prerequisites

- Node.js 18+ and npm (or yarn)
- Git
- Optional: an ioBroker instance or another state provider exposing a socket.io endpoint if you want live data

## Install

1. Clone the repository:

```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd <your-repo>
```

2. Install dependencies:

```bash
npm install
# or
# yarn install
```

## Development (local)

Start the dev server bound to all interfaces so you can test from other devices on your LAN:

```bash
npm run dev
# shortcut in package.json runs: vite --host
```

If you need the app to connect to an ioBroker host during development, configure the proxy or update `src/App.jsx` to point to your backend. `vite.config.js` includes a proxy for `/socket.io` and `/login`—adjust the target host if necessary.

### Common dev tasks

- Run the dev server: `npm run dev`
- Build for production: `npm run build`
- Preview the production build: `npm run preview`

## Configuration

- Card schemas are defined in `src/models/dashboard.js`.
- The full-page Green Energy card uses `production_entity`, `consumption_entity`, `battery_entity`, `grid_entity`, and `warning_entity` fields in the card config.
- Historical production/consumption data is stored in `localStorage` under keys like `green-energy-history-{card.id}`.

## Troubleshooting

- If warnings or entity states appear in the editor preview but not after saving, ensure the full-page card receives its entity states. `src/Dashboard.jsx` builds an `entities` map for full-page cards—make sure your saved `warning_entity` ID is present in `card.config`.
- If the dev server is not reachable from another device, check Windows Firewall and ensure `vite --host` is used. You can open a PowerShell prompt as administrator and run:

```powershell
# Allow incoming connections to Node.js (adjust program path if different)
New-NetFirewallRule -DisplayName "Allow Node.js Dev Server" -Direction Inbound -Action Allow -Program "C:\Program Files\nodejs\node.exe" -Profile Private,Public
```

- If socket.io fails to connect, ensure the backend is reachable and CORS/proxy settings in `vite.config.js` match the backend host.

## Contributing

- Fork the repo, open a feature branch, and submit a pull request.
- Keep changes focused and run the dev server to verify UI and live updates.

## License

This project is provided under the MIT License (or replace with your chosen license).

---

If you want, I can also add this file as `README.md`, commit it, and create a short `CONTRIBUTING.md`. What would you like next?