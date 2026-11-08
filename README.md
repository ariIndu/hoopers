# BEESWAX LITE // Air-Gapped Cyber Incident Command Center
> **HackUTD 2026 // Winstead PC Cyber Incident Response Challenge**  
> *Designed for high-stress crisis command during active, hostile network compromise.*

[![Security: Air-Gapped Standalone](https://img.shields.io/badge/Security-Air--Gapped%20%2F%20Isolated-emerald)](#one-page-threat-model)
[![Integrity: SHA-256 Hash Chain](https://img.shields.io/badge/Integrity-Tamper--Evident%20SHA--256-amber)](#tamper-evident-hash-chain-the-10-second-demo)
[![Regulatory: HIPAA PHI / 45 CFR § 164.404](https://img.shields.io/badge/Compliance-HIPAA%20PHI%2060--Day-purple)](#ciso-judgement-framework--board-brief)
[![Stack: React + Node + ws](https://img.shields.io/badge/Stack-React%20%2B%20Node%20%2B%20ws-blue)](#architecture--stack)

---

## Executive Summary

When a major enterprise suffers a SEV-1 cyber incident, the standard assumption must be that **the attacker already owns the internal network, monitors Active Directory, and listens to corporate Slack, Teams, and email**. Incident responders and executive leadership cannot coordinate safely inside the compromised environment.

**Beeswax** is an independently secure, standalone "command center" built to operate on isolated, hardened infrastructure during and after an incident. It delivers:
1. **Interactive Scope & Blast Radius Visualizer (Hive):** Pure SVG honeycomb lattice tracking compromised, encrypted, exfiltrated, and clean assets, with explicit tagging for **PHI (Protected Health Information)**, **PII**, and **Crown Jewels**.
2. **Tamper-Evident SHA-256 Audit Chain (Incident Documentation):** Mathematically sealed event ledger where any backend database alteration immediately triggers a visible cryptographic mismatch in the browser.
3. **Out-of-Band Tactical Communications (Chat):** Direct WebSocket communication channel completely isolated from corporate mail servers.
4. **Vulnerability Correlation & Ingestion (Nessus Scanner):** Ingests `.nessus` XML audit files, parses CVEs, and overlays vulnerability severity directly onto the asset honeycomb.
5. **CISO Executive Board Brief:** Modeled directly after CISO leadership doctrine: *"What did you see? Why is it important? What do you want me to do about it?"*, paired with an anti-FUD (*Fear, Uncertainty, Doubt*) ledger.

---

## One-Page Threat Model

```
       HOSTILE CORPORATE NETWORK (UNTRUSTED)
  ┌──────────────────────────────────────────────────────────────┐
  │ [Adversary Infiltrator / ALPHV Ransomware Operator]          │
  │   ├── Active Directory DC (DCSync attempted)                 │
  │   ├── Corporate Exchange & Slack (Compromised & Eavesdropped)│
  │   └── Perimeter FortiOS Gateway (CVE-2024-21762 Exploit)    │
  └──────────────────────────────────────────────────────────────┘
                                X  (NO TRUST / AIR-GAPPED)
  ┌──────────────────────────────────────────────────────────────┐
  │             BEESWAX STANDALONE HARDENED NODE                 │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │ Zero External CDNs  │  Local Web Crypto SHA-256 Engine │  │
  │  │ Local WebSockets    │  bcrypt Enforced RBAC Directory  │  │
  │  │ Memory-Store State  │  fast-xml-parser Nessus Ingestion│  │
  │  └────────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────┘
```

### Threat Assumptions
1. **Hostile Lan & Tapped Communications:** Corporate Microsoft 365, Teams, Exchange, and Slack are monitored by the adversary. *Mitigation:* Beeswax operates as a standalone server over dedicated tactical links with a hard prohibition on corporate communication channels.
2. **Adversary Log Tampering / Evidence Destruction:** Attackers attempt to modify SIEM logs, timeline entries, or SQL databases to delete traces of unauthorized 42GB PHI exfiltration. *Mitigation:* Every action is cryptographically sealed into a linear SHA-256 hash chain (`hash = SHA256(seq | ts | actor | text | prevHash)`). The client browser independently verifies the mathematical integrity of every block.
3. **Stress & Cognitive Overload:** Responders entering during a crisis do not recall complex interfaces. *Mitigation:* Zero setup friction. Color-coded hex status, live counters, fixed-choice board action checklists, and instant persona switching.
4. **Zero Cloud Dependencies:** If the adversary cuts corporate WAN access, external CDNs (Google Fonts, unpkg, cdnjs) fail. *Mitigation:* Self-contained single-process bundle; zero external requests required for runtime operation.

---

## Prototype Scope: Real vs. Production Pitch

| Component | Real in Prototype | Described Production Plan |
| :--- | :--- | :--- |
| **Audit Log Integrity** | Real SHA-256 cryptographic hash chain running in browser `crypto.subtle`; detects in-memory database tampering. | Hardware TPM / HSM enclave attestation; RFC 3161 cryptographic timestamping. |
| **Access Control (RBAC)** | Role-based permission enforcement on all write routes (`Admin`, `Responder`, `Viewer`); bcrypt credential hashing. | Hardware WebAuthn / FIDO2 security keys; two-person rule approval for destructive containment. |
| **Network Isolation** | Self-contained single-process Express + WebSocket server serving built React assets with zero external CDN calls. | Hardened Linux ISO deployed onto an air-gapped optical-diode network appliance. |
| **Nessus Ingestion** | Real-time XML parsing with `fast-xml-parser`, CVE extraction, and automatic correlation to Hive asset nodes. | Automated Tenable.io API sync with continuous attack-surface discovery. |
| **CISO Board Brief** | Live data counter integration, HIPAA 60-day OCR regulatory calculations, and interactive board decision checklist. | One-click SEC Form 8-K cyber incident draft generator and automated legal privilege stamping. |

---

## The 5 Core Screens

### 1. Hive (Asset Scope & Blast Radius)
- Interactive pure SVG hexagonal honeycomb grid representing enterprise infrastructure.
- 19 seeded assets including Domain Controllers, DMZ VPN Concentrator, Billing SQL Clusters, Immutable Backup NAS, and the **Health Actuary Risk Database** (`actuary-db-01`).
- Status colors:
  - 🟢 **Clean** (Verified uncompromised)
  - 🟡 **Suspected** (Anomalous telemetry detected)
  - 🔴 **Encrypted** (Ransomware payload locked)
  - 🟣 **Exfiltrated** (Unauthorized data egress confirmed)
  - 🔵 **Recovered** (Restored from immutable backup and validated)
- Click any hexagon to open the side inspection drawer with data classification tags (**PHI**, **PII**, **Crown Jewels**, **Client Data**, **Shadow IT**), Nessus weaponized CVE correlation, and immediate status change buttons that automatically seal an audit block into the hash chain.
- Live metric counter strip: *"3 Encrypted · 2 Exfiltrated · 3 PHI Exposed · 2 Recovered · 8 Clean"*.
- **Posture Toggle:** 1-click switch between **Incident Blast Radius** and **Nessus Vulnerability Posture** (re-coloring the entire grid by Nessus vulnerability risk).

### 2. Incident (Documentation & Live Hash-Chained Timeline)
- Single formal incident form complying with NIST SP 800-61 and SANS IR standards:
  - Incident Title, Severity Rating (Critical SEV-1 to Low SEV-4), Discovery Timestamp, Attack Vector dropdown, NIST Phase stepper (Detect ➔ Contain ➔ Eradicate ➔ Recover), Network Containment State, Executive Summary.
- Live timeline feed synchronizing in real time via WebSockets.
- Filter timeline by action type: `ALL`, `ALERT`, `COMMAND`, `RANSOM`.
- Append live forensic observations and containment orders with instant SHA-256 block sealing.

### 3. Tamper-Evident Hash Chain (The 10-Second Demo Showstopper)
- Prominent header badge: `🔒 INTEGRITY VERIFIED: 8/8 Blocks (SHA-256)`.
- **The "Tamper Demo" Button:** Clicking this sends a simulated attacker request to `/api/tamper`, which modifies entry #4 (altering the record of 42GB PHI exfiltration to claim routine maintenance).
- **The Result:** The browser's Web Crypto engine immediately detects that `SHA256(Block #4 payload)` does not match the stored cryptographic hash!
- The badge instantly turns into a pulsing crimson alert:  
  `⚠️ TAMPER DETECTED AT BLOCK #4!`
- Clicking "Inspect Full Cryptographic Hash Ledger" opens a block-by-block ledger showing the expected SHA-256 hash vs. the stored hash, mathematically proving evidence manipulation.
- Clicking **"Restore Chain"** restores authentic records and returns the indicator to verified green.

### 4. Chat (Out-of-Band Tactical Communications)
- Air-gapped room with persistent warning banner:  
  *"Out-of-band channel. Do not use corporate email or Slack. Corporate networks compromised."*
- Real-time WebSocket delivery between responders and legal counsel.
- Tactical Canned Preset buttons for high-speed response:
  - *"VLAN 40 segment isolation confirmed complete."*
  - *"Forensic volatile RAM image dumped from AD-DC-01."*
  - *"Winstead PC external breach counsel retained under privilege."*
  - *"Under HIPAA 45 CFR § 164.404, we have a 60-day notification clock on PHI."*

### 5. Nessus Scanner & CISO Board Brief
- **Nessus Ingestion:** Upload any `.nessus` XML file or click **"Load Sample Incident Scan"** (pre-bundled enterprise audit with FortiOS CVE-2024-21762, PostgreSQL CVE-2023-39417, Zerologon CVE-2020-1472, and Log4Shell CVE-2021-44228).
- Severity distribution bar chart (Critical, High, Medium, Low).
- Searchable host breakdown table with weaponized CVE tags and CVSS scores.
- **CISO Board Brief:** Tailored specifically to CISO leadership principles:
  - **What Did We See?** Live counts of encrypted systems, exfiltrated actuary tables, and untouched immutable backups.
  - **Why Does It Matter?** HIPAA 45 CFR § 164.404 regulatory exposure analysis (60-day mandatory notification to HHS OCR and affected individuals), actuary model IP risk, business interruption estimates (~$140,000/day), and 45 BTC ransomware demand refusal.
  - **What Do We Need From You?** Interactive decision checklist for Board and CIO approval:
    - [x] Retain External Forensics Firm (Mandiant)
    - [x] Retain External Breach Counsel under Privilege (Winstead PC)
    - [x] Formal Notice to Cyber Insurance Carrier
    - [x] Authorize Physical Network Disconnect of VLAN 40
    - [x] Refuse 45 BTC Ransom Demand (Follow FBI / CISA guidance)
  - **Confirmed vs. Unknown (The Anti-FUD Ledger):** Separates forensically verified facts from speculation to eliminate Fear, Uncertainty, and Doubt during board presentations.
  - **1-Click Export:** "Export Brief (PDF)" and "Copy Markdown" buttons for instant executive distribution.

---

## CISO Judgement Framework & Defense Matrix

When a breach occurs, the Board of Directors and CIO evaluate: *"Did the CISO know the risk was there? Should the CISO be fired?"*  
Beeswax encodes this defense matrix directly into the platform:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE CISO JUDGEMENT FRAMEWORK                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. PREVENTIVE POSTURE                                                  │
│    • CIS Critical Security Controls v8 audited.                        │
│    • Perimeter Nessus scan identified CVE-2024-21762 9 days prior.     │
│    • Patch had been approved and queued in monthly change window.      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. DETECTION & RESPONSE RESILIENCE                                     │
│    • Adversary dwell time contained under 4.5 hours.                   │
│    • Immediate air-gap protocol isolated lateral movement.            │
│    • Offline immutable ZFS backup repository (NAS-AIRGAP) kept safe.   │
├────────────────────────────────────────────────────────────────────────┤
│ 3. CROWN JEWELS VS. SHADOW IT PROBLEM                                  │
│    • Crown Jewels (Health Actuary Risk Tables) protected in VLAN 40.   │
│    • Exfiltration staging conduit was an unauthorized Shadow IT        │
│      MinIO S3 bucket deployed by developers without CISO clearance.    │
├────────────────────────────────────────────────────────────────────────┤
│ 4. PURPLE TEAMING & CONTINUOUS SIMULATION                              │
│    • Purple team exercises previously validated AD credential guards.  │
│    • Potomac / Myriddian Workbench Monte Carlo attack simulations      │
│      enabled rapid triage of the adversary's playbook.                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Role-Based Access Control (RBAC)

The system includes pre-configured personas for testing and live demonstration:

| Persona | Role | Credentials | Permissions |
| :--- | :--- | :--- | :--- |
| **Chris White** | `Admin` | `chris.white` / `ciso2026` | CISO authority, board decisions, user enrollment, full write |
| **Sarah Chen** | `Responder` | `sarah.chen` / `respond2026` | Lead DFIR, asset quarantine, timeline log authoring, tactical chat |
| **Winstead Legal Team** | `Viewer` | `legal.counsel` / `legal2026` | Read-only access to preserve legal privilege & observe timeline |
| **Command Admin** | `Admin` | `admin` / `admin123` | Platform administration & user directory management |

*Quick Persona Switcher:* Responders can switch between these personas in 1 click via the user avatar dropdown in the upper right.

---

## Architecture & Technology Stack

Beeswax is deliberately built with minimal dependencies to ensure air-gapped portability:

```
beeswax/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, UsersModal, TamperModal
│   │   ├── context/            # AuthContext, IncidentContext (WebSocket sync)
│   │   ├── screens/            # Hive, Incident, Chat, Nessus, BoardBrief
│   │   ├── utils/crypto.js     # Browser Web Crypto SHA-256 Hash Chain Engine
│   │   ├── App.jsx             # Shell & Router
│   │   └── main.jsx
│   ├── index.html
│   └── tailwind.config.js      # Cyber SOC Dark Theme
├── server/
│   ├── server.js               # Express + WebSocket + bcryptjs + fast-xml-parser
│   └── package.json
├── sample-incident-scan.nessus  # Bundled sample enterprise Nessus v2 XML audit
├── start-dev.js                # Concurrent launcher
└── package.json
```

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React (SOC icons).
- **Backend:** Node.js, Express, `ws` (native WebSockets), `bcryptjs`, `fast-xml-parser`, `multer`.
- **Integrity Engine:** Standard W3C Web Crypto API (`crypto.subtle.digest('SHA-256', ...)`).
- **Database:** In-memory store initialized from realistic breach parameters.

---

## Quick Start & Verification Guide

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Dependencies
```bash
# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

### 2. Run the Air-Gapped Command Center
```bash
# Option A: Single-process production server (serves API, WebSockets & UI on port 4000)
npm run build --prefix client
npm run server

# Option B: Concurrent development mode (Express on 4000, Vite HMR on 5173)
npm run dev
```

Open your browser to: **`http://localhost:4000`** (or `http://localhost:5173` if running dev server).

---

## 3-Minute Demo Walkthrough for Judges

1. **Step 1: The Command Center & Scope (0:00 - 0:45)**
   - Land on the **Hive** screen. Point out the dark cyber command aesthetic and the top banner: *"AIR-GAPPED SECURE ZONE | STANDALONE HARDENED NODE #01"*.
   - Point to the live counter strip: *"3 Encrypted · 2 Exfiltrated · 3 PHI Exposed · 8 Clean"*.
   - Click **`ACTUARY-DB-01`**. Highlight the red alert: Protected Health Information (PHI) under HIPAA 45 CFR § 164.404. Show that the initial entry point was `DMZ-VPN-01` (FortiOS CVE-2024-21762) and the egress pipe was `SHADOW-S3-STAGING` (unauthorized shadow IT).
   - Toggle **"Nessus Vulnerability Posture"** to show the honeycomb re-coloring based on vulnerability severity.

2. **Step 2: The Tamper-Evident Hash Chain Showstopper (0:45 - 1:30)**
   - Look at the top bar badge: `🔒 INTEGRITY VERIFIED: 8/8 Blocks (SHA-256)`.
   - Click the red **"Tamper Demo"** button.
   - Explain: *"An attacker who gained root access just modified the backend database entry #4 to delete evidence of the 42GB exfiltration."*
   - Watch the badge instantly turn crimson and flash: `⚠️ TAMPER DETECTED AT BLOCK #4!`.
   - Click the alert to open the **Cryptographic Hash Chain Inspector**. Show the exact mathematical discrepancy: *Computed SHA-256 vs. Stored Hash*.
   - Click **"Restore Chain"** to return to green.

3. **Step 3: Incident Documentation & Out-of-Band Chat (1:30 - 2:15)**
   - Click **Incident**. Show the NIST phase stepper and live timeline feed.
   - Type a note (*"Volatile memory acquisition completed on Domain Controller"*) and click **Append**. Show the instant SHA-256 block creation.
   - Click **Chat**. Highlight the isolation banner: *"Do not use corporate email or Slack"*. Click one of the tactical canned responses to demonstrate rapid crisis communications.

4. **Step 4: Nessus XML Ingestion & CISO Board Brief (2:15 - 3:00)**
   - Click **Nessus**. Click **"Load Sample Incident Scan"** to parse `sample-incident-scan.nessus`. Show the CVE breakdown and CVSS scores.
   - Click **Board Brief**. Show the Chris White CISO talk track:
     - *What did we see?*
     - *Why is it important?* (HIPAA 60-day OCR regulatory clock)
     - *What do we need from you?* (Interactive Board of Directors decision checklist)
     - *Confirmed vs. Unknown Anti-FUD Ledger*.
   - Click **"Copy Markdown"** or **"Export Brief (PDF)"** to show how leadership receives an actionable memo in seconds.

---

## Team & HackUTD Acknowledgments
Built with ❤️ for **HackUTD 2026** and the **Winstead PC Cyber Incident Response Challenge**. Designed to provide incident commanders, CISOs, and external breach counsel with an irrefutable, independently secure command center when the stakes are highest.
