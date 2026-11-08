# Beeswax

Beeswax is a prototype incident-response workspace built for the Winstead PC cyber incident response challenge. It brings asset scope, incident activity, responder chat, vulnerability findings, and a board-ready report into one compact interface.

## Winstead PC challenge brief

The dashboard is designed as a cyber incident-response command center for use during and after an incident. The experience favors a short set of clear tools, neutral surfaces with restrained yellow accents, visible critical alerts, and a persistent honeycomb asset map so responders can orient themselves quickly.

| Challenge requirement | How the prototype addresses it |
| --- | --- |
| Operate independently when internal systems may be compromised | The app can run as a separate Node.js service and uses local API/WebSocket connections. The interface warns responders not to use corporate email, Slack, or Teams. A separate service is not automatically an air gap; deployment isolation must be configured and verified. |
| Administrative access control | Admins can manage users; Admin and Responder roles can update incident information and assets. The demo has seeded personas for the CISO, responder, legal viewer, and platform administrator. |
| Incident documentation and real-time status | Incident details are editable, and the shared activity log receives incident and asset updates. Connected browsers synchronize updates over WebSockets. The timeline is independently checked in the browser against a SHA-256 hash chain. |
| Define incident scope and compromised data status | The honeycomb presents the affected systems and their status. Asset details include data classification and scan risk; status changes are reflected in activity. The board report summarizes affected systems and exposure categories. |
| Real-time communications | The team chat sends and receives messages through the local WebSocket-backed service. |
| Ease of use under pressure | Navigation uses plain-language tool names; the asset map keeps a small set of filters; chat follows a familiar message/feed layout; the board view is organized as an executive report. |
| Creativity beyond the core brief | Nessus XML ingestion, scan findings on assets, downloadable board reporting, and a tamper-evident audit-chain demonstration extend the required workflows. |

The board report follows the requested leadership questions—**What happened? Why does it matter? What should leadership do?**—and includes incident details, exposure, financial impact, security failures, accountability evidence, detection/response, risk assessment, recovery, and executive decisions. Where this prototype has no verified source data (such as downtime cost, remediation budget, Monte Carlo loss results, or a dated pre-incident patch decision), it says so rather than inventing a value. The Beeswax header opens an incident register where Admins and Responders can create and review incident summary records.

**Incident scope:** The register starts with one seeded incident. Newly added records are tracked in the register, while the asset map, chat, decisions, and activity log remain scoped to the original current case. Register records are held in server memory and are lost when the server restarts; this is not yet a persistent, fully separated multi-incident case-management system.

## What it does

- **Asset map:** Interactive SVG honeycomb showing 12 representative systems, their status, data classification, and Nessus risk. Changes to asset status are added to the incident activity log.
- **Incident log:** Editable incident summary and response status, a live activity timeline, and a demonstrable SHA-256 hash-chain integrity check.
- **Team chat:** Live responder messages over a WebSocket connection. The interface reminds responders not to use corporate email, Slack, or Teams.
- **Vulnerability scan:** Upload a Nessus XML file or load the bundled sample. Parsed findings can be correlated with known asset IP addresses and host names.
- **Board report:** Current incident details, asset counts, decisions, and recent activity can be printed or downloaded as a standalone HTML report.
- **Incident register:** Admins and Responders can add and review incident summary records from the Beeswax header; the current case dashboard remains unchanged.
- **User roles:** Demo Admin, Responder, and Viewer roles control which actions are available in the interface and API.

### Demo accounts

| Persona | Username | Password |
| --- | --- | --- |
| Alex Morgan (CISO) | `alex.morgan` | `ciso2026` |
| Sarah Chen (Responder) | `sarah.chen` | `respond2026` |
| Winstead Legal Team (Viewer) | `legal.counsel` | `legal2026` |
| Command Ops Admin | `admin` | `admin123` |

These are demonstration credentials only. Do not reuse them outside a local demo.

## Technology stack

| Layer | Technologies | Responsibility |
| --- | --- | --- |
| Web client | React 18, JavaScript, Vite 5 | Screens, interaction, and local development server |
| UI and icons | Tailwind CSS 3, Lucide React | Responsive layout, design tokens/utilities, and bundled SVG icons |
| Client state | React Context API | Authentication, incident data, WebSocket events, and screen state |
| HTTP API | Node.js, Express 4 | Authentication, incident and asset operations, uploads, and report data |
| Live updates | `ws` WebSocket server | Broadcast incident, asset, chat, scan, and decision updates |
| Scan ingestion | `fast-xml-parser`, `multer` | Accept Nessus XML and parse host/vulnerability findings |
| Password hashing | `bcryptjs` | Hash seeded demo-user passwords |
| Audit integrity | Browser Web Crypto API and Node.js `crypto` | Compute and verify the timeline's linked SHA-256 hashes |
| Runtime data | In-memory JavaScript objects and maps | Prototype users, assets, incident, messages, decisions, and timeline |

No separate database or UI component framework is used. Lucide icons are bundled with the client. The client uses system fonts and does not need a third-party font CDN.

## How it is built

The application has four main runtime layers:

1. **Presentation layer — `client/src/screens` and `client/src/components`:** `App.jsx` composes the navbar, tool navigation, screens, and user/integrity dialogs. Each screen reads shared data from the React contexts and renders the relevant user workflow.
2. **Client state and transport layer — `client/src/context`:** `AuthContext` manages the logged-in demo persona and bearer token. `IncidentContext` loads initial data from the API, exposes actions for mutations, and keeps the UI synchronized with WebSocket broadcasts.
3. **Service/API layer — `server/server.js`:** Express routes serve incident data, assets, timeline entries, chat, board decisions, and scan operations. Role middleware protects write operations. The WebSocket server broadcasts successful updates to connected clients.
4. **Integrity and ingestion layer:** Timeline entries include sequence, timestamp, actor, text, previous hash, and current hash. The browser independently verifies the chain with Web Crypto. The Nessus upload route parses XML, extracts host and vulnerability details, and correlates matching hosts with the asset list.

### Typical data flow

```text
React screen
   ├── fetch('/api/...') ──> Express route ──> in-memory state
   │                                      ├── append hash-linked activity
   │                                      └── broadcast update over WebSocket
   └── WebSocket event <──────────────────────────────┘
          └── IncidentContext updates React state
```

For Nessus imports, the client uploads the selected file as multipart form data. The server parses the XML, stores the parsed summary in process memory, matches findings to assets where possible, and broadcasts refreshed scan and asset data.

## Repository layout

```text
client/
  index.html
  src/
    components/       # Navbar, sidebar, user dialog, integrity dialog
    context/          # Authentication and incident state/actions
    screens/          # Asset map, incident log, chat, scan, board report
    utils/crypto.js   # Browser-side timeline verification
  tailwind.config.js
server/
  server.js           # Express API, WebSocket server, seed data, scan parsing
  package.json
sample-incident-scan.nessus
start-dev.js           # Starts the API and Vite development server
package.json           # Convenience scripts
```

## Run locally

Requirements: a current Node.js LTS release and npm.

Install the client and server dependencies from the repository root:

```powershell
npm install --prefix client
npm install --prefix server
```

Start the API and Vite development server together:

```powershell
npm run dev
```

The Vite client is normally available at `http://localhost:5173`. The server defaults to port `4000`; the Vite development proxy forwards `/api` and `/ws` requests to it. Set `PORT` to change the server port. To build the client bundle:

```powershell
npm run build
```

The production bundle is written to `client/dist`. Start the server with `npm run server`; when that bundle exists, the server can serve the built client and API from one process.

## Prototype security and deployment notes

This repository is a demonstration prototype, not a production incident-response platform. The server stores its operational data in process memory, so changes are lost on restart and do not coordinate across multiple server instances. Demo identities are seeded in source for local use. Before any real deployment, replace demo authentication and secrets, configure TLS and restricted network access, review CORS and upload limits, add durable storage and backups, and have the authorization and audit design independently reviewed. A separate command-center machine or network does not by itself guarantee air-gap isolation.
