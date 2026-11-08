const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// In-Memory Database and Session Storage
const SESSIONS = new Map();

// Helper: SHA-256 for hash chaining
function computeHash(seq, ts, actor, text, prevHash) {
  const payload = `${seq}|${ts}|${actor}|${text}|${prevHash}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// 1. Initial Users Seed
const USERS = [
  {
    id: 'usr_admin',
    username: 'admin',
    name: 'Administrator (Command Ops)',
    role: 'Admin',
    passHash: bcrypt.hashSync('admin123', 10),
    title: 'Incident Commander'
  },
  {
    id: 'usr_ciso',
    username: 'chris.white',
    name: 'Chris White',
    role: 'Admin',
    passHash: bcrypt.hashSync('ciso2026', 10),
    title: 'Chief Information Security Officer (CISO)'
  },
  {
    id: 'usr_responder',
    username: 'sarah.chen',
    name: 'Sarah Chen',
    role: 'Responder',
    passHash: bcrypt.hashSync('respond2026', 10),
    title: 'Lead DFIR Specialist'
  },
  {
    id: 'usr_viewer',
    username: 'legal.counsel',
    name: 'Winstead Legal Team',
    role: 'Viewer',
    passHash: bcrypt.hashSync('legal2026', 10),
    title: 'Breach Counsel / Board Observer'
  }
];

// 2. Incident Status
let INCIDENT = {
  id: 'INC-2026-8812',
  title: 'Project Apex Ransomware & Health Actuary Exfiltration',
  severity: 'Critical',
  discoveredAt: new Date(Date.now() - 4.5 * 3600 * 1000).toISOString(),
  attackVector: 'Unpatched Edge VPN (CVE-2024-21762) -> Credential Pivot',
  phase: 'Contain', // Detect -> Contain -> Eradicate -> Recover
  summary: 'Adversary breached perimeter VPN gateway (FortiOS CVE-2024-21762), moved laterally into internal Health Actuary database clusters, deployed BlackCat/ALPHV ransomware variant on billing nodes, and initiated exfiltration of 42GB of PHI data to shadow IT cloud staging repository.',
  leadCommander: 'Chris White (CISO) & Sarah Chen (DFIR Lead)',
  networkState: 'Segmented / Isolated VLAN 40',
  ransomNotePresent: true,
  ransomDemanded: '45 BTC (~$3.1M USD) - PAYMENT REFUSED'
};

// 3. Hive Assets (19 assets in a structured honeycomb lattice)
// Statuses: clean, suspected, encrypted, exfiltrated, recovered
// Data Classes: PHI, PII, Crown Jewels, Client Data, Internal, Shadow IT
let ASSETS = [
  {
    id: 'dmz-vpn-concentrator',
    name: 'DMZ-VPN-01',
    ip: '198.51.100.1',
    vlan: 'VLAN 10 (DMZ)',
    type: 'VPN Gateway',
    dataClass: 'Internal',
    status: 'suspected',
    row: 0, col: 1,
    description: 'Fortinet FortiOS SSL-VPN gateway. Initial patient zero compromise vector via CVE-2024-21762.',
    nessusRisk: 'Critical',
    cveList: ['CVE-2024-21762']
  },
  {
    id: 'telehealth-api-gw',
    name: 'TELEHEALTH-GW',
    ip: '198.51.100.14',
    vlan: 'VLAN 10 (DMZ)',
    type: 'API Gateway',
    dataClass: 'PHI',
    status: 'clean',
    row: 0, col: 2,
    description: 'Reverse proxy routing incoming patient telemetry to internal medical systems.',
    nessusRisk: 'Low',
    cveList: []
  },
  {
    id: 'sw-core-01',
    name: 'SW-CORE-PRIMARY',
    ip: '10.0.0.1',
    vlan: 'VLAN 1 (Management)',
    type: 'Core Switch',
    dataClass: 'Crown Jewels',
    status: 'clean',
    row: 0, col: 3,
    description: 'L3 Backbone aggregation switch with ACL enforcement rules.',
    nessusRisk: 'Low',
    cveList: []
  },
  {
    id: 'ad-dc-primary',
    name: 'AD-DC-01',
    ip: '10.0.10.5',
    vlan: 'VLAN 10 (Identity)',
    type: 'Domain Controller',
    dataClass: 'Crown Jewels',
    status: 'suspected',
    row: 1, col: 0,
    description: 'Windows Server 2022 Primary Active Directory. Attacker attempted Zerologon & DCSync replication.',
    nessusRisk: 'Critical',
    cveList: ['CVE-2020-1472', 'CVE-2021-42287']
  },
  {
    id: 'ad-dc-secondary',
    name: 'AD-DC-02',
    ip: '10.0.10.6',
    vlan: 'VLAN 10 (Identity)',
    type: 'Domain Controller',
    dataClass: 'Crown Jewels',
    status: 'clean',
    row: 1, col: 1,
    description: 'Secondary Domain Controller. Hardened replication partner.',
    nessusRisk: 'Medium',
    cveList: []
  },
  {
    id: 'actuary-db-01',
    name: 'ACTUARY-DB-01',
    ip: '10.0.40.12',
    vlan: 'VLAN 40 (Health Actuary)',
    type: 'Database',
    dataClass: 'PHI',
    status: 'exfiltrated',
    row: 1, col: 2,
    description: 'PostgreSQL cluster housing proprietary health insurance mortality models and patient actuary risk tables. Forensic logs confirm 42GB staged outbound.',
    nessusRisk: 'Critical',
    cveList: ['CVE-2023-39417']
  },
  {
    id: 'patient-claims-srv',
    name: 'PATIENT-CLAIMS-01',
    ip: '10.0.40.18',
    vlan: 'VLAN 40 (Health Actuary)',
    type: 'Application Server',
    dataClass: 'PHI',
    status: 'encrypted',
    row: 1, col: 3,
    description: 'Processes insurance pre-authorizations and HIPAA claims. Encrypted with ALPHV payload. .locked extension appended.',
    nessusRisk: 'High',
    cveList: ['CVE-2021-34527']
  },
  {
    id: 'epic-emr-bridge',
    name: 'EMR-BRIDGE-SRV',
    ip: '10.0.40.25',
    vlan: 'VLAN 40 (Health Actuary)',
    type: 'Integration Server',
    dataClass: 'PHI',
    status: 'recovered',
    row: 1, col: 4,
    description: 'HL7 / FHIR bridge to hospital EMR systems. Isolated and restored from immutable offline snapshot.',
    nessusRisk: 'Low',
    cveList: []
  },
  {
    id: 'billing-sql-cluster',
    name: 'BILLING-SQL-01',
    ip: '10.0.20.8',
    vlan: 'VLAN 20 (Finance)',
    type: 'Database',
    dataClass: 'Client Data',
    status: 'encrypted',
    row: 2, col: 0,
    description: 'MS SQL Server containing enterprise billing schedules and ACH routing numbers. Ransom note dropped at C:\\HOW_TO_RECOVER.txt.',
    nessusRisk: 'High',
    cveList: ['CVE-2021-34527']
  },
  {
    id: 'potomac-workbench-ai',
    name: 'POTOMAC-WORKBENCH',
    ip: '10.0.30.22',
    vlan: 'VLAN 30 (Analytics)',
    type: 'Analytics Cluster',
    dataClass: 'Internal',
    status: 'suspected',
    row: 2, col: 1,
    description: 'Myriddian / Potomac Intelligence Workbench running Monte Carlo actuary risk simulations.',
    nessusRisk: 'Critical',
    cveList: ['CVE-2021-44228']
  },
  {
    id: 'shadow-s3-backup',
    name: 'SHADOW-S3-STAGING',
    ip: '10.0.99.50',
    vlan: 'VLAN 99 (Unmanaged Cloud)',
    type: 'Cloud Storage',
    dataClass: 'PHI',
    status: 'exfiltrated',
    row: 2, col: 2,
    description: 'SHADOW IT: Unauthorized MinIO object bucket configured by dev team without CISO approval. Used by attacker as egress staging conduit.',
    nessusRisk: 'Critical',
    cveList: ['CVE-2023-28432']
  },
  {
    id: 'exchange-hybrid-01',
    name: 'EXCHANGE-HYBRID',
    ip: '10.0.10.19',
    vlan: 'VLAN 10 (Identity)',
    type: 'Mail Server',
    dataClass: 'Client Data',
    status: 'suspected',
    row: 2, col: 3,
    description: 'Corporate mail server. Compromised user inbox used to send internal phishing lures.',
    nessusRisk: 'High',
    cveList: []
  },
  {
    id: 'hr-workday-sync',
    name: 'HR-WORKDAY-SYNC',
    ip: '10.0.20.15',
    vlan: 'VLAN 20 (Finance)',
    type: 'Integration Server',
    dataClass: 'PII',
    status: 'encrypted',
    row: 2, col: 4,
    description: 'Employee payroll and SSN sync daemon. File system encrypted; volume shadow copies wiped.',
    nessusRisk: 'Medium',
    cveList: []
  },
  {
    id: 'backup-nas-immutable',
    name: 'BACKUP-NAS-AIRGAP',
    ip: '10.0.50.99',
    vlan: 'VLAN 50 (Vault)',
    type: 'Storage NAS',
    dataClass: 'Crown Jewels',
    status: 'clean',
    row: 3, col: 1,
    description: 'WORM (Write Once Read Many) immutable ZFS backup repository with air-gapped physical replication. Safe and intact.',
    nessusRisk: 'Low',
    cveList: []
  },
  {
    id: 'gitlab-ci-runner',
    name: 'GITLAB-RUNNER-01',
    ip: '10.0.30.14',
    vlan: 'VLAN 30 (Analytics)',
    type: 'CI/CD Worker',
    dataClass: 'Internal',
    status: 'clean',
    row: 3, col: 2,
    description: 'Build automation server. Credential cache flushed upon incident declaration.',
    nessusRisk: 'Low',
    cveList: []
  },
  {
    id: 'scada-chiller-mgmt',
    name: 'OT-CHILLER-MGMT',
    ip: '192.168.100.5',
    vlan: 'VLAN 80 (Facility OT)',
    type: 'OT Controller',
    dataClass: 'Operational',
    status: 'clean',
    row: 3, col: 3,
    description: 'Datacenter HVAC and power distribution SCADA system. Isolated by physical air-gap.',
    nessusRisk: 'Low',
    cveList: []
  },
  {
    id: 'pki-ca-offline',
    name: 'PKI-ROOT-CA',
    ip: '10.0.50.2',
    vlan: 'VLAN 50 (Vault)',
    type: 'PKI Vault',
    dataClass: 'Crown Jewels',
    status: 'clean',
    row: 3, col: 0,
    description: 'Root Certificate Authority. Offline HSM signed. Verified untouched.',
    nessusRisk: 'Low',
    cveList: []
  },
  {
    id: 'jumpbox-bastion',
    name: 'JUMPBOX-ADMIN',
    ip: '10.0.10.9',
    vlan: 'VLAN 10 (Admin)',
    type: 'Bastion Host',
    dataClass: 'Internal',
    status: 'recovered',
    row: 0, col: 0,
    description: 'Administrative jumpbox. Session logs retrieved for DFIR forensic timeline.',
    nessusRisk: 'Medium',
    cveList: []
  },
  {
    id: 'edr-telemetry-broker',
    name: 'EDR-BROKER-01',
    ip: '10.0.10.2',
    vlan: 'VLAN 10 (Admin)',
    type: 'Security Sensor',
    dataClass: 'Internal',
    status: 'clean',
    row: 1, col: 5,
    description: 'Host-based detection collector. Retained 14 days of volatile memory and process dumps.',
    nessusRisk: 'Low',
    cveList: []
  }
];

// 4. Hash Chained Timeline Log
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

const INITIAL_TIMELINE_ENTRIES = [
  {
    seq: 1,
    ts: new Date(Date.now() - 4.5 * 3600 * 1000).toISOString(),
    actor: 'SYSTEM_BOOT',
    text: 'Beeswax Air-Gapped Command Center initialized on standalone hardware. Genesis node online.',
    actionType: 'SYSTEM'
  },
  {
    seq: 2,
    ts: new Date(Date.now() - 4.1 * 3600 * 1000).toISOString(),
    actor: 'sarah.chen (DFIR)',
    text: 'Perimeter Alert: FortiOS SSL-VPN gateway (DMZ-VPN-01) logged anomalous HTTP byte sequences matching CVE-2024-21762 exploit signature.',
    actionType: 'ALERT'
  },
  {
    seq: 3,
    ts: new Date(Date.now() - 3.7 * 3600 * 1000).toISOString(),
    actor: 'sarah.chen (DFIR)',
    text: 'Adversary lateral movement: Domain Controller AD-DC-01 recorded suspicious DCSync replication requests from service account svc_backup.',
    actionType: 'ALERT'
  },
  {
    seq: 4,
    ts: new Date(Date.now() - 3.2 * 3600 * 1000).toISOString(),
    actor: 'sarah.chen (DFIR)',
    text: 'CRITICAL EXFILTRATION: 42GB archive staged outbound from ACTUARY-DB-01 (Health Risk Tables) to unmonitored Shadow IT bucket SHADOW-S3-STAGING.',
    actionType: 'EXFIL_FLAG'
  },
  {
    seq: 5,
    ts: new Date(Date.now() - 2.8 * 3600 * 1000).toISOString(),
    actor: 'chris.white (CISO)',
    text: 'SEV-1 INCIDENT DECLARED. Out-of-band communication protocol activated. All corporate Slack & email channels declared compromised.',
    actionType: 'COMMAND'
  },
  {
    seq: 6,
    ts: new Date(Date.now() - 2.3 * 3600 * 1000).toISOString(),
    actor: 'sarah.chen (DFIR)',
    text: 'RANSOMWARE LOCKOUT: BILLING-SQL-01 and PATIENT-CLAIMS-01 file systems encrypted with ALPHV / BlackCat variant. Ransom note 45 BTC dropped.',
    actionType: 'RANSOM'
  },
  {
    seq: 7,
    ts: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
    actor: 'chris.white (CISO)',
    text: 'CONTAINMENT ORDER: Physical network isolation executed on VLAN 40 (Health Actuary) and VLAN 20 (Finance). Offline backups verified intact.',
    actionType: 'CONTAINMENT'
  },
  {
    seq: 8,
    ts: new Date(Date.now() - 1.1 * 3600 * 1000).toISOString(),
    actor: 'sarah.chen (DFIR)',
    text: 'RECOVERY COMMENCED: EMR-BRIDGE-SRV wiped and restored cleanly from immutable air-gapped backup NAS-AIRGAP. Integrity verified.',
    actionType: 'RECOVERY'
  }
];

// Build initial hash chain
let TIMELINE = [];
let lastHash = GENESIS_HASH;
for (const entry of INITIAL_TIMELINE_ENTRIES) {
  const hash = computeHash(entry.seq, entry.ts, entry.actor, entry.text, lastHash);
  TIMELINE.push({
    ...entry,
    prevHash: lastHash,
    hash: hash,
    tampered: false
  });
  lastHash = hash;
}

// Backup copy of authentic timeline for restoration after tamper demo
let ORIGINAL_AUTHENTIC_TIMELINE = JSON.parse(JSON.stringify(TIMELINE));

// 5. Out-of-Band Chat Messages
let MESSAGES = [
  {
    id: 'msg_1',
    ts: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
    sender: 'chris.white',
    senderName: 'Chris White (CISO)',
    role: 'Admin',
    text: 'Team: Assume the corporate network is hostile. Zero traffic on Teams or Outlook. This Beeswax instance is our sole command post.'
  },
  {
    id: 'msg_2',
    ts: new Date(Date.now() - 3.1 * 3600 * 1000).toISOString(),
    sender: 'sarah.chen',
    senderName: 'Sarah Chen (DFIR Lead)',
    role: 'Responder',
    text: 'Confirmed 42GB staged out of ACTUARY-DB-01. That database holds the mortality models and health risk actuary tables. We have PHI exposure.'
  },
  {
    id: 'msg_3',
    ts: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    sender: 'legal.counsel',
    senderName: 'Winstead Legal Team',
    role: 'Viewer',
    text: 'Under HIPAA 45 CFR § 164.404, PHI exfiltration triggers a strict 60-day notification window to HHS OCR. We need forensic certainty before filing.'
  },
  {
    id: 'msg_4',
    ts: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
    sender: 'chris.white',
    senderName: 'Chris White (CISO)',
    role: 'Admin',
    text: 'Understood. We are preparing the CISO Board Brief now. No FUD—confirmed facts only. Backup NAS is safe. We will NOT pay ransom.'
  }
];

// 6. Board Decisions Checklist State
let BOARD_DECISIONS = {
  retainForensics: { id: 'retainForensics', label: 'Approve External Forensics Firm (Mandiant / CrowdStrike retainer)', approved: true, approvedBy: 'Chris White (CISO)', timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
  retainCounsel: { id: 'retainCounsel', label: 'Retain External Breach Counsel under Attorney-Client Privilege (Winstead PC)', approved: true, approvedBy: 'Chris White (CISO)', timestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString() },
  notifyInsurance: { id: 'notifyInsurance', label: 'Formal Notice to Cyber Insurance Carrier (Policy #WIN-CYBER-881)', approved: true, approvedBy: 'Board Chair', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  vlanIsolation: { id: 'vlanIsolation', label: 'Authorize Complete Physical Network Disconnect of VLAN 40 (Health Actuary)', approved: true, approvedBy: 'Chris White (CISO)', timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString() },
  refuseRansom: { id: 'refuseRansom', label: 'Refuse 45 BTC Ransom Demand (Follow FBI / CISA Guidance)', approved: true, approvedBy: 'Board of Directors', timestamp: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString() }
};

// 7. Nessus Vulnerability Store
let NESSUS_DATA = {
  scanName: 'Winstead Enterprise Perimeter & DMZ Audit',
  parsedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  totalHosts: 6,
  totalVulnerabilities: 12,
  severityCounts: {
    critical: 5,
    high: 4,
    medium: 3,
    low: 0
  },
  hosts: [
    {
      ip: '198.51.100.1',
      hostname: 'dmz-vpn-concentrator.winstead.net',
      os: 'FortiOS 7.0.12',
      criticalCount: 1,
      highCount: 1,
      mediumCount: 0,
      vulnerabilities: [
        { pluginName: 'FortiOS SSL-VPN Remote Code Execution (CVE-2024-21762)', severity: 4, cvss: 9.8, cve: 'CVE-2024-21762', port: '443/tcp' },
        { pluginName: 'TLS Version 1.0 / 1.1 Deprecated Protocol Enabled', severity: 3, cvss: 7.5, cve: 'N/A', port: '443/tcp' }
      ]
    },
    {
      ip: '10.0.40.12',
      hostname: 'actuary-db-01.internal.winstead',
      os: 'Red Hat Enterprise Linux 8.7',
      criticalCount: 1,
      highCount: 1,
      mediumCount: 1,
      vulnerabilities: [
        { pluginName: 'PostgreSQL Extension Script SQL Injection / Privilege Escalation (CVE-2023-39417)', severity: 4, cvss: 9.0, cve: 'CVE-2023-39417', port: '5432/tcp' },
        { pluginName: 'Unencrypted PHI Actuary Database Connection Listener', severity: 3, cvss: 7.4, cve: 'N/A', port: '5432/tcp' },
        { pluginName: 'SSH Weak MAC Algorithms Enabled', severity: 2, cvss: 5.3, cve: 'N/A', port: '22/tcp' }
      ]
    },
    {
      ip: '10.0.10.5',
      hostname: 'ad-dc-primary.internal.winstead',
      os: 'Windows Server 2022',
      criticalCount: 1,
      highCount: 1,
      mediumCount: 0,
      vulnerabilities: [
        { pluginName: 'Microsoft Active Directory Netlogon Elevation of Privilege (Zerologon - CVE-2020-1472)', severity: 4, cvss: 10.0, cve: 'CVE-2020-1472', port: '445/tcp' },
        { pluginName: 'Kerberos PAC Validation Signature Privilege Escalation (CVE-2021-42287)', severity: 3, cvss: 8.8, cve: 'CVE-2021-42287', port: '88/tcp' }
      ]
    },
    {
      ip: '10.0.20.8',
      hostname: 'billing-sql-cluster.internal.winstead',
      os: 'Windows Server 2019',
      criticalCount: 0,
      highCount: 2,
      mediumCount: 0,
      vulnerabilities: [
        { pluginName: 'Microsoft SQL Server Blank sa Password Suspected / Weak Authentication', severity: 3, cvss: 8.1, cve: 'N/A', port: '1433/tcp' },
        { pluginName: 'SMB Signing Disabled or Not Required', severity: 3, cvss: 7.1, cve: 'N/A', port: '445/tcp' }
      ]
    },
    {
      ip: '10.0.30.22',
      hostname: 'potomac-workbench-ai.internal.winstead',
      os: 'Ubuntu 22.04 LTS',
      criticalCount: 1,
      highCount: 0,
      mediumCount: 1,
      vulnerabilities: [
        { pluginName: 'Apache Log4j JNDI Remote Code Execution (Log4Shell - CVE-2021-44228)', severity: 4, cvss: 10.0, cve: 'CVE-2021-44228', port: '8080/tcp' },
        { pluginName: 'Jupyter / Analytics Kernel Exposed Without Token', severity: 2, cvss: 6.8, cve: 'N/A', port: '8888/tcp' }
      ]
    },
    {
      ip: '10.0.99.50',
      hostname: 'shadow-s3-backup.cloud.winstead',
      os: 'MinIO Object Storage',
      criticalCount: 1,
      highCount: 1,
      mediumCount: 0,
      vulnerabilities: [
        { pluginName: 'MinIO Information Disclosure & Admin Secret Exposure (CVE-2023-28432)', severity: 4, cvss: 9.8, cve: 'CVE-2023-28432', port: '9000/tcp' },
        { pluginName: 'Shadow IT Storage: Public Read/Write Access Policy', severity: 3, cvss: 8.6, cve: 'N/A', port: '9000/tcp' }
      ]
    }
  ]
};

// WebSocket Broadcast Helper
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }
  const token = authHeader.split(' ')[1];
  const user = SESSIONS.get(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }
  req.user = user;
  next();
}

function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: Role '${req.user?.role}' does not have permission. Required: [${roles.join(', ')}]`
      });
    }
    next();
  };
}

// ======================= API ROUTES =======================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    airGapped: true,
    nodeId: 'NODE-01-AIRGAP',
    connectedWsClients: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = USERS.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const passwordValid = bcrypt.compareSync(password, user.passHash);
  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = 'bwk_' + crypto.randomBytes(24).toString('hex');
  const sessionUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    title: user.title
  };
  SESSIONS.set(token, sessionUser);

  res.json({ token, user: sessionUser });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  SESSIONS.delete(token);
  res.json({ success: true });
});

// Users Route (Admin only)
app.get('/api/users', authMiddleware, (req, res) => {
  res.json({
    users: USERS.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      title: u.title
    }))
  });
});

app.post('/api/users', authMiddleware, requireRoles(['Admin']), (req, res) => {
  const { username, name, role, password, title } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }
  if (!['Admin', 'Responder', 'Viewer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be Admin, Responder, or Viewer' });
  }
  const existing = USERS.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const newUser = {
    id: 'usr_' + Date.now().toString(36),
    username: username.toLowerCase().trim(),
    name: name || username,
    role,
    title: title || `${role} Operator`,
    passHash: bcrypt.hashSync(password, 10)
  };
  USERS.push(newUser);

  // Auto-log to tamper-evident timeline
  const lastEntry = TIMELINE[TIMELINE.length - 1];
  const seq = lastEntry ? lastEntry.seq + 1 : 1;
  const ts = new Date().toISOString();
  const prevHash = lastEntry ? lastEntry.hash : GENESIS_HASH;
  const logText = `User Account Created: ${newUser.username} (${newUser.role}) by ${req.user.name}`;
  const hash = computeHash(seq, ts, req.user.name, logText, prevHash);
  const timelineItem = {
    seq,
    ts,
    actor: req.user.name,
    text: logText,
    actionType: 'ADMIN',
    prevHash,
    hash,
    tampered: false
  };
  TIMELINE.push(timelineItem);
  ORIGINAL_AUTHENTIC_TIMELINE.push(timelineItem);

  broadcast('TIMELINE_NEW', timelineItem);
  broadcast('USER_ADDED', { id: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name });

  res.status(201).json({
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      title: newUser.title
    }
  });
});

// Incident Routes
app.get('/api/incident', (req, res) => {
  res.json({ incident: INCIDENT });
});

app.put('/api/incident', authMiddleware, requireRoles(['Admin', 'Responder']), (req, res) => {
  const { title, severity, attackVector, phase, summary, networkState, ransomDemanded } = req.body;
  
  const oldPhase = INCIDENT.phase;
  const oldSeverity = INCIDENT.severity;

  INCIDENT = {
    ...INCIDENT,
    title: title || INCIDENT.title,
    severity: severity || INCIDENT.severity,
    attackVector: attackVector || INCIDENT.attackVector,
    phase: phase || INCIDENT.phase,
    summary: summary || INCIDENT.summary,
    networkState: networkState || INCIDENT.networkState,
    ransomDemanded: ransomDemanded || INCIDENT.ransomDemanded
  };

  // If phase or severity changed, append to hash-chain
  let logText = `Incident parameters updated by ${req.user.name}.`;
  if (oldPhase !== INCIDENT.phase) {
    logText += ` Incident Phase transitioned: [${oldPhase} ➔ ${INCIDENT.phase}].`;
  }
  if (oldSeverity !== INCIDENT.severity) {
    logText += ` Severity revised: [${oldSeverity} ➔ ${INCIDENT.severity}].`;
  }

  const lastEntry = TIMELINE[TIMELINE.length - 1];
  const seq = lastEntry ? lastEntry.seq + 1 : 1;
  const ts = new Date().toISOString();
  const prevHash = lastEntry ? lastEntry.hash : GENESIS_HASH;
  const hash = computeHash(seq, ts, req.user.name, logText, prevHash);
  const timelineItem = {
    seq,
    ts,
    actor: req.user.name,
    text: logText,
    actionType: 'INCIDENT_UPDATE',
    prevHash,
    hash,
    tampered: false
  };
  TIMELINE.push(timelineItem);
  ORIGINAL_AUTHENTIC_TIMELINE.push(timelineItem);

  broadcast('INCIDENT_UPDATE', INCIDENT);
  broadcast('TIMELINE_NEW', timelineItem);

  res.json({ incident: INCIDENT });
});

// Hive Assets Routes
app.get('/api/assets', (req, res) => {
  res.json({ assets: ASSETS });
});

app.put('/api/assets/:id', authMiddleware, requireRoles(['Admin', 'Responder']), (req, res) => {
  const { id } = req.params;
  const { status, description, notes } = req.body;

  const assetIndex = ASSETS.findIndex(a => a.id === id);
  if (assetIndex === -1) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const oldStatus = ASSETS[assetIndex].status;
  ASSETS[assetIndex].status = status || ASSETS[assetIndex].status;
  if (description) ASSETS[assetIndex].description = description;

  // Append tamper-evident audit record
  const lastEntry = TIMELINE[TIMELINE.length - 1];
  const seq = lastEntry ? lastEntry.seq + 1 : 1;
  const ts = new Date().toISOString();
  const prevHash = lastEntry ? lastEntry.hash : GENESIS_HASH;
  const logText = `Asset Scope Updated: ${ASSETS[assetIndex].name} (${ASSETS[assetIndex].ip}) status changed from [${oldStatus.toUpperCase()}] to [${status.toUpperCase()}]. Data Class: ${ASSETS[assetIndex].dataClass}. ${notes ? 'Note: ' + notes : ''}`;
  const hash = computeHash(seq, ts, req.user.name, logText, prevHash);
  
  const timelineItem = {
    seq,
    ts,
    actor: req.user.name,
    text: logText,
    actionType: status === 'encrypted' ? 'RANSOM' : status === 'exfiltrated' ? 'EXFIL_FLAG' : status === 'recovered' ? 'RECOVERY' : 'SCOPE_UPDATE',
    prevHash,
    hash,
    tampered: false
  };
  TIMELINE.push(timelineItem);
  ORIGINAL_AUTHENTIC_TIMELINE.push(timelineItem);

  broadcast('ASSET_UPDATE', ASSETS[assetIndex]);
  broadcast('TIMELINE_NEW', timelineItem);

  res.json({ asset: ASSETS[assetIndex], timelineItem });
});

// Timeline Routes
app.get('/api/timeline', (req, res) => {
  res.json({ timeline: TIMELINE, genesisHash: GENESIS_HASH });
});

app.post('/api/timeline', authMiddleware, requireRoles(['Admin', 'Responder']), (req, res) => {
  const { text, actionType } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Timeline text required' });
  }

  const lastEntry = TIMELINE[TIMELINE.length - 1];
  const seq = lastEntry ? lastEntry.seq + 1 : 1;
  const ts = new Date().toISOString();
  const prevHash = lastEntry ? lastEntry.hash : GENESIS_HASH;
  const hash = computeHash(seq, ts, req.user.name, text.trim(), prevHash);

  const timelineItem = {
    seq,
    ts,
    actor: req.user.name,
    text: text.trim(),
    actionType: actionType || 'NOTE',
    prevHash,
    hash,
    tampered: false
  };

  TIMELINE.push(timelineItem);
  ORIGINAL_AUTHENTIC_TIMELINE.push(timelineItem);

  broadcast('TIMELINE_NEW', timelineItem);
  res.status(201).json({ item: timelineItem });
});

// ======================= THE TAMPER DEMO ENDPOINT =======================
// "The best 10 seconds of your demo"
// Modifies an entry's text on the server so the browser's cryptographic hash chain recomputation fails!
app.post('/api/tamper', authMiddleware, requireRoles(['Admin', 'Responder']), (req, res) => {
  const targetSeq = req.body.seq || 4; // Default entry #4: the critical exfiltration alert
  const targetIndex = TIMELINE.findIndex(e => e.seq === targetSeq);

  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Target timeline entry not found' });
  }

  // Cover attacker tracks: Change exfiltration notice to benign maintenance note
  TIMELINE[targetIndex].text = '[ATTACKER TAMPERED] Routine database vacuum and scheduled backup completed normally. No unauthorized data egress observed.';
  TIMELINE[targetIndex].actor = 'SYSTEM_MAINTENANCE';
  TIMELINE[targetIndex].tampered = true; // Flag for internal debugging, client detects cryptographically!

  broadcast('TIMELINE_TAMPER', {
    tamperedSeq: targetSeq,
    timeline: TIMELINE
  });

  res.json({
    status: 'TAMPER_APPLIED',
    message: `Entry #${targetSeq} was modified directly in memory without recomputing the SHA-256 hash chain. The browser will now detect cryptographic discrepancy!`,
    entry: TIMELINE[targetIndex]
  });
});

app.post('/api/tamper/restore', authMiddleware, requireRoles(['Admin', 'Responder']), (req, res) => {
  // Re-load the original authentic timeline
  TIMELINE = JSON.parse(JSON.stringify(ORIGINAL_AUTHENTIC_TIMELINE));

  broadcast('TIMELINE_RESTORE', {
    timeline: TIMELINE
  });

  res.json({
    status: 'INTEGRITY_RESTORED',
    message: 'Authentic forensic timeline restored. Cryptographic hash chain is intact.',
    timeline: TIMELINE
  });
});

// Out-of-Band Chat Routes
app.get('/api/chat', (req, res) => {
  res.json({ messages: MESSAGES });
});

app.post('/api/chat', authMiddleware, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text required' });
  }

  const newMessage = {
    id: 'msg_' + Date.now().toString(36),
    ts: new Date().toISOString(),
    sender: req.user.username,
    senderName: req.user.name,
    role: req.user.role,
    text: text.trim()
  };

  MESSAGES.push(newMessage);
  broadcast('CHAT_MESSAGE', newMessage);

  res.status(201).json({ message: newMessage });
});

// Board Decisions Checklist
app.get('/api/board-brief/decisions', (req, res) => {
  res.json({ decisions: BOARD_DECISIONS });
});

app.put('/api/board-brief/decisions/:id', authMiddleware, requireRoles(['Admin', 'Responder']), (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;

  if (!BOARD_DECISIONS[id]) {
    return res.status(404).json({ error: 'Decision item not found' });
  }

  BOARD_DECISIONS[id].approved = Boolean(approved);
  BOARD_DECISIONS[id].approvedBy = approved ? req.user.name : null;
  BOARD_DECISIONS[id].timestamp = new Date().toISOString();

  // Log to timeline
  const lastEntry = TIMELINE[TIMELINE.length - 1];
  const seq = lastEntry ? lastEntry.seq + 1 : 1;
  const ts = new Date().toISOString();
  const prevHash = lastEntry ? lastEntry.hash : GENESIS_HASH;
  const logText = `Board Action Item [${BOARD_DECISIONS[id].label}] marked as ${approved ? 'APPROVED' : 'PENDING'} by ${req.user.name}.`;
  const hash = computeHash(seq, ts, req.user.name, logText, prevHash);
  
  const timelineItem = {
    seq,
    ts,
    actor: req.user.name,
    text: logText,
    actionType: 'COMMAND',
    prevHash,
    hash,
    tampered: false
  };
  TIMELINE.push(timelineItem);
  ORIGINAL_AUTHENTIC_TIMELINE.push(timelineItem);

  broadcast('BOARD_DECISION_UPDATE', BOARD_DECISIONS);
  broadcast('TIMELINE_NEW', timelineItem);

  res.json({ decisions: BOARD_DECISIONS });
});

// Nessus Scanner Routes
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

function parseNessusXml(xmlContent) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });
  const parsed = parser.parse(xmlContent);

  const report = parsed.NessusClientData_v2?.Report;
  if (!report) {
    throw new Error('Invalid .nessus file format (Missing NessusClientData_v2/Report node)');
  }

  const rawHosts = Array.isArray(report.ReportHost) ? report.ReportHost : [report.ReportHost].filter(Boolean);
  
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  const hosts = rawHosts.map(host => {
    const hostName = host['@_name'];
    let hostIp = hostName;
    let fqdn = hostName;
    let os = 'Unknown OS';

    // Parse HostProperties tags
    if (host.HostProperties?.tag) {
      const tags = Array.isArray(host.HostProperties.tag) ? host.HostProperties.tag : [host.HostProperties.tag];
      for (const t of tags) {
        if (t['@_name'] === 'host-ip') hostIp = t['#text'];
        if (t['@_name'] === 'host-fqdn') fqdn = t['#text'];
        if (t['@_name'] === 'operating-system') os = t['#text'];
      }
    }

    const items = Array.isArray(host.ReportItem) ? host.ReportItem : [host.ReportItem].filter(Boolean);
    const vulnerabilities = [];
    let hostCrit = 0;
    let hostHigh = 0;
    let hostMed = 0;

    for (const item of items) {
      const sev = parseInt(item['@_severity'] || '0', 10);
      if (sev === 4) { criticalCount++; hostCrit++; }
      else if (sev === 3) { highCount++; hostHigh++; }
      else if (sev === 2) { mediumCount++; hostMed++; }
      else if (sev === 1) { lowCount++; }

      vulnerabilities.push({
        pluginName: item['@_pluginName'] || 'Generic Vulnerability',
        severity: sev,
        cvss: parseFloat(item.cvss_base_score || '0.0'),
        cve: item.cve || 'N/A',
        port: `${item['@_port'] || '0'}/${item['@_protocol'] || 'tcp'}`
      });
    }

    // Sort vulnerabilities critical first
    vulnerabilities.sort((a, b) => b.severity - a.severity);

    return {
      ip: hostIp,
      hostname: fqdn,
      os,
      criticalCount: hostCrit,
      highCount: hostHigh,
      mediumCount: hostMed,
      vulnerabilities
    };
  });

  return {
    scanName: report['@_name'] || 'Uploaded Vulnerability Scan',
    parsedAt: new Date().toISOString(),
    totalHosts: hosts.length,
    totalVulnerabilities: criticalCount + highCount + mediumCount + lowCount,
    severityCounts: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount
    },
    hosts
  };
}

app.get('/api/nessus/summary', (req, res) => {
  res.json({ nessus: NESSUS_DATA });
});

app.post('/api/nessus/upload', authMiddleware, requireRoles(['Admin', 'Responder']), upload.single('file'), (req, res) => {
  try {
    let xmlContent = '';
    if (req.file) {
      xmlContent = req.file.buffer.toString('utf-8');
    } else if (req.body && req.body.xml) {
      xmlContent = req.body.xml;
    } else {
      return res.status(400).json({ error: 'No .nessus file or XML body uploaded' });
    }

    const parsedData = parseNessusXml(xmlContent);
    NESSUS_DATA = parsedData;

    // Cross-correlate with Hive Assets!
    for (const host of NESSUS_DATA.hosts) {
      const asset = ASSETS.find(a => a.ip === host.ip || a.name.toLowerCase() === host.hostname.toLowerCase());
      if (asset) {
        if (host.criticalCount > 0) asset.nessusRisk = 'Critical';
        else if (host.highCount > 0) asset.nessusRisk = 'High';
        else if (host.mediumCount > 0) asset.nessusRisk = 'Medium';
        else asset.nessusRisk = 'Low';

        asset.cveList = host.vulnerabilities.filter(v => v.cve && v.cve !== 'N/A').map(v => v.cve);
      }
    }

    // Log upload event
    const lastEntry = TIMELINE[TIMELINE.length - 1];
    const seq = lastEntry ? lastEntry.seq + 1 : 1;
    const ts = new Date().toISOString();
    const prevHash = lastEntry ? lastEntry.hash : GENESIS_HASH;
    const logText = `Nessus Vulnerability Scan Ingested: ${NESSUS_DATA.totalHosts} hosts, ${NESSUS_DATA.severityCounts.critical} Critical, ${NESSUS_DATA.severityCounts.high} High vulnerabilities. Asset risk posture correlated.`;
    const hash = computeHash(seq, ts, req.user.name, logText, prevHash);
    
    const timelineItem = {
      seq,
      ts,
      actor: req.user.name,
      text: logText,
      actionType: 'AUDIT',
      prevHash,
      hash,
      tampered: false
    };
    TIMELINE.push(timelineItem);
    ORIGINAL_AUTHENTIC_TIMELINE.push(timelineItem);

    broadcast('NESSUS_UPDATE', NESSUS_DATA);
    broadcast('ASSETS_REFRESH', ASSETS);
    broadcast('TIMELINE_NEW', timelineItem);

    res.json({
      success: true,
      nessus: NESSUS_DATA
    });
  } catch (err) {
    console.error('Nessus parse error:', err);
    res.status(400).json({ error: 'Failed to parse .nessus XML file: ' + err.message });
  }
});

// Load bundled sample Nessus scan with 1-click
app.post('/api/nessus/load-sample', authMiddleware, requireRoles(['Admin', 'Responder']), (req, res) => {
  try {
    const samplePath = path.join(__dirname, '..', 'sample-incident-scan.nessus');
    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({ error: 'Sample .nessus scan file not found on disk' });
    }
    const xmlContent = fs.readFileSync(samplePath, 'utf-8');
    const parsedData = parseNessusXml(xmlContent);
    NESSUS_DATA = parsedData;

    // Cross-correlate with Hive Assets
    for (const host of NESSUS_DATA.hosts) {
      const asset = ASSETS.find(a => a.ip === host.ip || a.name.toLowerCase().includes(host.hostname.toLowerCase().split('.')[0]));
      if (asset) {
        if (host.criticalCount > 0) asset.nessusRisk = 'Critical';
        else if (host.highCount > 0) asset.nessusRisk = 'High';
        else if (host.mediumCount > 0) asset.nessusRisk = 'Medium';
        else asset.nessusRisk = 'Low';

        asset.cveList = host.vulnerabilities.filter(v => v.cve && v.cve !== 'N/A').map(v => v.cve);
      }
    }

    broadcast('NESSUS_UPDATE', NESSUS_DATA);
    broadcast('ASSETS_REFRESH', ASSETS);

    res.json({ success: true, nessus: NESSUS_DATA });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Serve React Client Build if available (Single-process offline deploy)
const distPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`   BEESWAX LITE // Air-Gapped Cyber Incident Backend  `);
  console.log(`   Node Server running on http://localhost:${PORT}     `);
  console.log(`   WebSocket active on ws://localhost:${PORT}/ws      `);
  console.log(`======================================================\n`);
});
