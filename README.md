# RFQ — 8kW Hybrid Jayobo

React PWA for building and editing a Request for Quotation. Data is saved on the device with IndexedDB.

## Run

```bash
npm install
npm run icons
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Features

- Three quotation categories (editor); PDF print merges Material+Roughing as **I**, Labor as **II**
- Editable line items; overall total; payment schedule
- **Export PDF** — print dialog → Save as PDF
- Auto-save to IndexedDB; installable PWA

## Build

```bash
npm run build
npm run preview
```
