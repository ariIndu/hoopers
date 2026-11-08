import React, { useState } from 'react';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, CheckSquare, Square, Printer, Copy, Check, 
  ShieldAlert, AlertTriangle, Scale, ShieldCheck, Database, 
  Brain, HelpCircle, Activity, ArrowRight, UserCheck
} from 'lucide-react';

export default function BoardBriefScreen() {
  const { incident, metrics, boardDecisions, toggleBoardDecision, assets, nessusData } = useIncident();
  const { canWrite, user } = useAuth();

  const [copied, setCopied] = useState(false);

  // Markdown copy helper
  function handleCopyMemo() {
    const memo = `
# EXECUTIVE CYBER INCIDENT BRIEFING
**CONFIDENTIAL // ATTORNEY-CLIENT PRIVILEGED (WINSTEAD PC)**
**To:** Board of Directors & Chief Information Officer (CIO)
**From:** Chris White, Chief Information Security Officer (CISO)
**Date:** ${new Date().toLocaleDateString()}
**Incident ID:** ${incident?.id || 'INC-2026-8812'}
**Classification:** SEV-1 CRITICAL // ACTIVE CONTAINMENT

---

## 1. WHAT DID WE SEE? (Scope & Ground Truth)
- **Compromised Assets:** ${metrics.encrypted} encrypted by BlackCat/ALPHV ransomware; ${metrics.exfiltrated} exfiltrated.
- **Initial Access:** Perimeter FortiOS SSL-VPN gateway exploited via CVE-2024-21762.
- **Crown Jewels Impacted:** ACTUARY-DB-01 (Health Insurance Actuary Risk Tables & Mortality Models).
- **Shadow IT Exfiltration Conduit:** Unauthorized staging object bucket (SHADOW-S3-STAGING) discovered in egress path.
- **Backup Integrity:** Immutable air-gapped ZFS backup repository (BACKUP-NAS-AIRGAP) remains 100% UNTOUCHED and verified clean.

---

## 2. WHY IS IT IMPORTANT? (Actuary & Regulatory Exposure)
- **HIPAA / OCR Regulatory Exposure:** Under HIPAA Breach Notification Rule 45 CFR § 164.404, exfiltration of unencrypted Health Actuary PHI triggers a strict **60-day notification mandate** to HHS OCR and affected individuals.
- **Business Interruption:** Actuary risk modeling and pre-authorization processing offline. Estimated disruption cost: ~$140,000 / day.
- **Ransom Demand:** Threat actor dropped note demanding 45 BTC (~$3.1M USD). Executive recommendation: REFUSE PAYMENT.

---

## 3. WHAT DO WE NEED FROM YOU? (Board Action Checklist)
${Object.values(boardDecisions).map(d => `- [${d.approved ? 'X' : ' '}] ${d.label} (${d.approved ? 'APPROVED by ' + d.approvedBy : 'PENDING APPROVAL'})`).join('\n')}

---

## 4. CONFIRMED FACTS VS. UNKNOWN (Anti-FUD Ledger)
- **CONFIRMED:** 42GB egressed to Shadow S3 bucket; Active Directory Domain Controller isolated; immutable backups intact.
- **UNKNOWN:** Whether threat actor retains external persistence outside VLAN 40; whether dark web leaks will precede our regulatory disclosure.

---

## 5. CISO JUDGMENT & PREVENTIVE POSTURE REVIEW
- **Preventive Controls:** CIS Controls baseline audited; perimeter firewall patch had been scheduled in upcoming maintenance window.
- **Detection & Response:** Zero lateral spread to core accounting; containment enacted within 4.5 hours of initial anomalous egress.
`;

    navigator.clipboard.writeText(memo.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-y-auto bg-slate-50 p-6 space-y-6">
      
      {/* Executive Header & Quick Actions - Clean White Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              EXECUTIVE BOARD MEMO
            </span>
            <span className="text-xs font-mono text-slate-500">
              ATTORNEY-CLIENT PRIVILEGED (WINSTEAD PC)
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            CISO Briefing: Incident Apex &amp; Actuary Scope Assessment
          </h1>
          
          <div className="text-xs text-slate-500 font-sans mt-1 flex items-center gap-3">
            <span>Author: <strong className="text-slate-900">Chris White (CISO)</strong></span>
            <span>•</span>
            <span>Recipient: <strong className="text-slate-900">Board of Directors &amp; CIO</strong></span>
            <span>•</span>
            <span>Framework: <strong className="text-amber-700">NIST SP 800-61 / CIS v8</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <button
            onClick={handleCopyMemo}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
            title="Copy formatted executive memo for Slack or external legal report"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-600" />}
            <span>{copied ? 'Copied Memo!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Export Brief (PDF)</span>
          </button>
        </div>

      </div>

      {/* The 3-Part Executive Talk Track (What Did We See? Why Is It Important? What Do We Want You To Do?) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Section 1: What Did We See? */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-bold">
              PILLAR 1 // GROUND TRUTH
            </span>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              What Did We See?
            </h2>
            <p className="text-xs text-slate-500">Live blast radius observed across network sensors</p>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-rose-700 font-bold flex items-center justify-between">
                <span>Ransomware Encryption</span>
                <span className="font-mono">{metrics.encrypted} Systems</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                ALPHV / BlackCat variant locked <code>BILLING-SQL-01</code> and <code>PATIENT-CLAIMS-01</code>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-purple-700 font-bold flex items-center justify-between">
                <span>Exfiltrated Repository</span>
                <span className="font-mono">{metrics.exfiltrated} Assets</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                42GB of health actuary tables egressed from <code>ACTUARY-DB-01</code> to an unmonitored shadow IT staging bucket.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-emerald-700 font-bold flex items-center justify-between">
                <span>Backup Integrity</span>
                <span className="font-mono">100% Intact</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Immutable WORM offline ZFS NAS safe. Restoration already validated for <code>EMR-BRIDGE-SRV</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Why Is It Important? */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-700 font-bold">
              PILLAR 2 // REGULATORY &amp; FINANCIAL EXPOSURE
            </span>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              Why Does It Matter?
            </h2>
            <p className="text-xs text-slate-500">Business interruption, legal liabilities &amp; HIPAA impact</p>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-1.5">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-rose-600" />
                HIPAA 45 CFR § 164.404 Mandate
              </div>
              <p className="text-rose-800 text-[11px]">
                Health Actuary risk tables contain Protected Health Information (PHI). Under federal OCR guidelines, exfiltration triggers a strict <strong>60-day notification clock</strong> to HHS and affected policyholders.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Actuary Model Intellectual Property</div>
              <p className="text-slate-600 text-[11px]">
                Proprietary Monte Carlo health mortality simulations leaked. Competitor exposure risk is elevated.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Ransomware Extortion</span>
                <span className="text-rose-700 font-mono font-bold">45 BTC (~$3.1M)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                CISO and FBI guidance: <strong>Refuse payment</strong>. Decryption keys are rarely guaranteed, and paying sanctions OFAC guidelines.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: What Do We Want You To Do? (Action Checklist) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-bold">
              PILLAR 3 // BOARD CLEARANCE
            </span>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              What Do We Need From You?
            </h2>
            <p className="text-xs text-slate-500">Fixed-choice checklist for executive authorization</p>
          </div>

          <div className="space-y-2.5">
            {Object.values(boardDecisions).map(decision => (
              <div
                key={decision.id}
                onClick={() => canWrite && toggleBoardDecision(decision.id, !decision.approved)}
                className={`p-3 rounded-xl border transition flex items-start space-x-3 ${
                  decision.approved 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                } ${canWrite ? 'cursor-pointer select-none' : 'cursor-default'}`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {decision.approved ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className={`text-xs font-semibold ${decision.approved ? 'text-emerald-900 line-through opacity-80' : 'text-slate-900'}`}>
                    {decision.label}
                  </div>
                  {decision.approved && (
                    <div className="text-[10px] font-mono text-emerald-700 mt-1">
                      Approved by {decision.approvedBy} at {new Date(decision.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!canWrite && (
            <div className="text-[11px] font-mono text-slate-400 text-center">
              [Viewer Role: Only CISO / Admin can record board approvals]
            </div>
          )}
        </div>

      </div>

      {/* Confirmed vs. Unknown Anti-FUD Ledger */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              The Anti-FUD Ledger: Confirmed Facts vs. Unknown Risks
            </h2>
            <p className="text-xs text-slate-500">
              Eliminating Fear, Uncertainty, and Doubt: ground truth forensic facts separated from unverified adversary claims
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
            Anti-FUD Standard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Confirmed Facts */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
            <h3 className="text-xs font-mono font-bold uppercase text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Confirmed Ground Truth (Forensically Verified)
            </h3>
            
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Initial Vector:</strong> FortiOS SSL-VPN gateway buffer overflow (CVE-2024-21762) exploited at 08:14 UTC.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Staging Destination:</strong> 42GB staged to <code>shadow-s3-backup</code> (unmonitored MinIO storage bucket).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Backups Untouched:</strong> Offline ZFS immutable snapshot vault is 100% verified and unharmed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Domain Dominance:</strong> DCSync replication attempts were blocked by local EDR containment rules.</span>
              </li>
            </ul>
          </div>

          {/* Unknown Risks */}
          <div className="p-4 bg-amber-50/60 border border-amber-300 rounded-xl space-y-2.5">
            <h3 className="text-xs font-mono font-bold uppercase text-amber-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              Unknowns (In-Progress Forensic Investigation)
            </h3>

            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Full Patient Census Count:</strong> Exact record count in the 42GB actuary model staging dump is currently undergoing de-duplication by external DFIR.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Dark Web Exposure:</strong> No active leak site auction has been published by BlackCat/ALPHV yet.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Secondary Persistence:</strong> Memory forensics ongoing on VLAN 10 domain controllers to confirm complete eradication.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* CISO Judgement Framework & Defense Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-600" />
              The CISO Judgement Framework: Did We Know Risk Was There?
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-semibold">
              Chris White Defense Framework
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluating preventive posture, control effectiveness, and whether leadership took reasonable, defensible cybersecurity measures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
          
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="text-amber-900 font-bold uppercase flex items-center gap-1 font-mono">
              <span>1. Preventive Posture</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              CIS Controls v8 baseline implemented. The FortiOS vulnerability CVE-2024-21762 was identified in Nessus 9 days ago and queued in the monthly patching cycle.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="text-emerald-900 font-bold uppercase flex items-center gap-1 font-mono">
              <span>2. Detection Resilience</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Dwell time under 4.5 hours. Automated network isolation prevented ransomware spread beyond 2 non-critical compute clusters.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="text-purple-900 font-bold uppercase flex items-center gap-1 font-mono">
              <span>3. Shadow IT Root Cause</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              The data staging conduit (MinIO bucket) was deployed by developers outside central IT governance. Policy gap to be corrected in post-incident board recommendations.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="text-cyan-900 font-bold uppercase flex items-center gap-1 font-mono">
              <span>4. Purple Team Validation</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Prior purple team exercise identified Active Directory Netlogon weakness, enabling proactive credential rotation that prevented domain compromise.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
