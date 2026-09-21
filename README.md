# RFQ — 8kW Hybrid Jayobo

React PWA for building and editing a Request for Quotation. Data is saved on the device with IndexedDB (no server required).

## Run

```bash
npm install
npm run icons
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Features

- Three quotation categories (same as PDF layout):
  - Material Cost
  - Roughing-In & Consumable Mat
  - Labor & Supervision
- Add / edit / remove items per category as needed (no prefilled catalog)
- Fields: description, qty, unit, unit price, amount (auto)
- Category subtotals + grand total
- Header fields: title, customer, prepared by, date, notes
- Auto-save to IndexedDB on this phone or computer
- Installable PWA (HTTPS or localhost)

## Build

```bash
npm run build
npm run preview
```
