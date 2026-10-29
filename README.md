# MasrShield

MasrShield is a browser-based cybersecurity awareness and research platform focused on
Arabic scam, phishing, and social-engineering detection. It runs entirely on the client
(no backend) and is designed for static hosting (VS Code Live Server, Vercel, GitHub Pages).

## Features

- Home page explaining the platform and its limitations.
- Suspicious-message analyzer using transparent, rule-based JavaScript heuristics.
- Suspicious-URL analyzer that deconstructs link anatomy and flags recognizable warning signs.
- Screenshot/image analysis interface with in-browser OCR (Tesseract.js) when available.
- QR-code decoding and analysis (jsQR) when available.
- Clear results with risk levels, reasons, and safety recommendations.
- Copy buttons for inputs and analysis reports.
- Input validation, empty-state handling, error messages, and loading states.
- Responsive, accessible UI with keyboard navigation.
- ConsistencyGuard: compare original vs. rewritten Arabic messages.
- Research dashboard reporting schema (no fabricated benchmarks).

## Important honesty notes

- Detection is heuristic and rule-based. It does NOT use AI, machine learning, or a real
  threat-intelligence database. A clean result does NOT guarantee safety.
- Images/URLs/messages are processed locally in your browser. Nothing is sent to external
  services without your action (OCR/QR libraries are loaded from a CDN).
- Never enter real passwords, OTPs, bank details, or personal identifiers.

## Project structure

```
MasrShield/
├── index.html              # Live Server entry (redirects to pages/)
├── vercel.json             # Vercel static deployment config (outputDirectory: pages)
├── .gitignore
├── README.md
└── pages/                  # Deployed root on Vercel
    ├── index.html
    ├── message-scanner.html
    ├── url-analyzer.html
    ├── screenshot-scanner.html
    ├── qr-scanner.html
    ├── consistency-guard.html
    ├── research-dashboard.html
    ├── css/
    │   ├── style.css
    │   └── responsive.css
    └── js/
        ├── app.js
        ├── riskEngine.js
        ├── messageScanner.js
        ├── urlAnalyzer.js
        ├── screenshotScanner.js
        ├── qrScanner.js
        ├── consistencyGuard.js
        ├── researchDashboard.js
        └── clipboard.js
```

## Running locally

1. Open the folder in VS Code.
2. Install the "Live Server" extension.
3. Right-click `index.html` (root) → "Open with Live Server", or open `pages/index.html`.

## Deploying to Vercel

- Import the GitHub repository into Vercel.
- Vercel uses `vercel.json` (`outputDirectory: pages`, `cleanUrls: true`).
- The site is served from the `pages/` directory at the domain root.
- Do not navigate to `/pages` — it is not a public route (redirects to `/`).

## Tech stack

- HTML5, CSS3, Vanilla JavaScript
- No build tools, no backend
- Optional CDN libraries: Tesseract.js (OCR), jsQR (QR decoding)

## License

Research prototype. Not for production security decisions.
