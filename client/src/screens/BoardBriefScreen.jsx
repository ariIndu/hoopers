import React, { useMemo, useState } from 'react';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { Check, Download, Printer } from 'lucide-react';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Not recorded';
}

function buildReportHtml({ incident, assets, metrics, decisions, timeline, reportDate }) {
  const affected = assets.filter(asset => ['encrypted', 'exfiltrated', 'suspected'].includes(asset.status));
  const knownFindings = assets.filter(asset => asset.cveList?.length);
  const compromised = assets.filter(asset => ['encrypted', 'exfiltrated'].includes(asset.status));
  const exposedByClass = dataClass => compromised.filter(asset => asset.dataClass === dataClass).length;
  const criticalAtRisk = assets.filter(asset =>
    asset.dataClass === 'Crown Jewels' && ['encrypted', 'exfiltrated', 'suspected'].includes(asset.status)
  );
  const shadowAssets = assets.filter(asset => asset.id.includes('shadow'));
  const firstAlert = timeline.find(item => item.actionType === 'ALERT');
  const containmentEntry = timeline.find(item => item.actionType === 'CONTAINMENT');
  const recoveredEntries = timeline.filter(item => item.actionType === 'RECOVERY');
  const recentTimeline = [...timeline].reverse().slice(0, 8);

  const details = [
    ['Attack type', 'Ransomware with reported data exfiltration'],
    ['Initial access', incident?.attackVector || 'Under investigation'],
    ['First recorded', formatDate(incident?.discoveredAt)],
    ['Severity / phase', `${incident?.severity || 'Not set'} / ${incident?.phase || 'Not set'}`],
    ['Affected systems', `${affected.length} affected or under review of ${assets.length} tracked assets`]
  ];

  const reportSections = [
    {
      title: '1. Incident details',
      summary: 'Attack type, recorded discovery, severity, and current scope.',
      bullets: details.map(([label, value]) => `${label}: ${value}.`)
    },
    {
      title: '2. Data exposure',
      summary: 'Counts reflect asset records marked encrypted or exposed; suspected assets are listed separately as under review.',
      bullets: [
        `PHI: ${exposedByClass('PHI')} affected assets; ${metrics.phiCompromised} PHI assets encrypted or exposed, including the reported 42 GB staging event in the activity log.`,
        `PII: ${exposedByClass('PII')} affected assets recorded.`,
        `Client / financial records: ${exposedByClass('Client Data')} affected assets recorded.`,
        `Critical systems ("Crown Jewels"): ${criticalAtRisk.length} currently suspected or affected (${criticalAtRisk.map(asset => asset.name).join(', ') || 'none'}).`,
        `Additional systems under review: ${metrics.suspected}.`
      ]
    },
    {
      title: '3. Financial impact',
      summary: 'Known scenario figures are not independently validated financial estimates.',
      bullets: [
        `Ransom demand recorded: ${incident?.ransomDemanded || 'Not recorded'}.`,
        'Business interruption, response, restoration, legal, and notification costs: estimate not available; obtain a Finance-approved range.',
        'Insurance recovery and any potential fines or penalties: not assessed in this prototype.'
      ]
    },
    {
      title: '4. Security failures',
      summary: 'Current scan findings and asset records identify review areas, not proof of when a control failed.',
      bullets: [
        `Related scan findings: ${knownFindings.length} tracked systems have CVE entries (${knownFindings.map(asset => `${asset.name}: ${asset.cveList.join(', ')}`).join('; ') || 'none recorded'}).`,
        `Shadow IT / unmanaged storage: ${shadowAssets.map(asset => `${asset.name} (${asset.status})`).join(', ') || 'none recorded'}.`,
        'Patch, access-control, monitoring, and data-egress control evidence is not attached to this workspace; validate with system owners.'
      ]
    },
    {
      title: '5. CISO accountability',
      summary: 'The available record is insufficient to make a finding about prior knowledge or individual accountability.',
      bullets: [
        'The current Nessus risk and CVE list do not show when a vulnerability was first identified or whether remediation was approved, scheduled, or completed.',
        'Preserve and review dated vulnerability reports, risk acceptances, change tickets, exception approvals, and escalation records.',
        'Do not infer that a control was effective or that a responsible individual knew of a risk without supporting evidence.'
      ]
    },
    {
      title: '6. Detection and response',
      summary: 'Timeline entries are the source for response milestones; no resolution timestamp is recorded.',
      bullets: [
        `First timeline alert: ${firstAlert ? formatDate(firstAlert.ts) : 'Not recorded'}.`,
        `Containment entry: ${containmentEntry ? formatDate(containmentEntry.ts) : 'Not recorded'}.`,
        `Recorded discovery time: ${formatDate(incident?.discoveredAt)}; the system does not currently calculate or verify detection/containment service-level times.`,
        `Current phase: ${incident?.phase || 'Not set'}. Resolution time: not recorded.`
      ]
    },
    {
      title: '7. Risk assessment',
      summary: 'Decision support only; this prototype does not replace a documented control assessment or quantitative loss model.',
      bullets: [
        'NIST: organize follow-up evidence and actions using the incident response lifecycle (detect, respond, recover) and document current status.',
        'CIS Controls: no control-by-control assessment or evidence mapping is stored in this workspace.',
        'Scenario likelihood: high operational concern based on the recorded ransomware and data-staging events; this is not a calibrated forecast.',
        'Monte Carlo loss estimate: not available. No probability distribution, loss inputs, or simulation output is maintained by this system.'
      ]
    },
    {
      title: '8. Recovery',
      summary: 'Track restoration and hardening to independently verified completion.',
      bullets: [
        `${metrics.recovered} assets are marked recovered in the current scope.`,
        `Recovery activity recorded: ${recoveredEntries.length ? recoveredEntries.map(item => `${formatDate(item.ts)} — ${item.text}`).join('; ') : 'none'}.`,
        'Verify clean backups, rebuild affected systems from trusted media, rotate exposed credentials, patch confirmed vulnerabilities, and validate monitoring before reconnecting systems.',
        'Capture lessons learned, evidence provenance, and named owners for each remediation action.'
      ]
    },
    {
      title: '9. Executive decisions',
      summary: 'Approve immediate containment and evidence-preservation priorities. Costs and accountable owners require confirmation.',
      bullets: [
        ...decisions.map(decision =>
          `${decision.approved ? 'Recorded as approved' : 'Pending'}: ${decision.label}${decision.approvedBy ? ` (recorded by ${decision.approvedBy})` : ''}.`
        ),
        'Immediate: confirm containment, retain incident counsel and forensic support, and preserve evidence. Cost: obtain quotes; owner: incident commander; deadline: immediate.',
        'Next 24 hours: confirm the affected-data scope, notification analysis, and insurance notice requirements. Cost: to be estimated; owner: counsel / response lead.',
        'Next 30 days: close verified patching, access, and shadow-storage control gaps. Cost and due dates: set with Finance and system owners.'
      ]
    }
  ];

  const sectionHtml = reportSections.map(section => `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      <p class="muted">${escapeHtml(section.summary)}</p>
      <ul>${section.bullets.map(bullet => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>
      ${section.title.startsWith('2.') ? `
        <table><thead><tr><th>System</th><th>Type</th><th>Status</th><th>Data</th></tr></thead>
        <tbody>${affected.map(asset => `<tr><td>${escapeHtml(asset.name)}</td><td>${escapeHtml(asset.type)}</td><td>${escapeHtml(asset.status)}</td><td>${escapeHtml(asset.dataClass === 'Crown Jewels' ? 'Critical system' : asset.dataClass)}</td></tr>`).join('') || '<tr><td colspan="4">No affected assets are recorded.</td></tr>'}</tbody></table>
      ` : ''}
    </section>
  `).join('');

  const timelineHtml = recentTimeline.map(item =>
    `<li><time>${escapeHtml(formatDate(item.ts))}</time> <strong>${escapeHtml(item.actor)}:</strong> ${escapeHtml(item.text)}</li>`
  ).join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Executive incident report — ${escapeHtml(incident?.id || 'Beeswax')}</title>
<style>
body{font:14px/1.55 Arial,sans-serif;color:#1f2937;max-width:900px;margin:36px auto;padding:0 28px}
h1{font-size:30px;line-height:1.2;color:#111827;margin:8px 0}h2{font-size:19px;color:#111827;margin:24px 0 5px}
h3{font-size:16px;margin:22px 0 5px}p,li{max-width:80ch}li{margin:5px 0}.muted{color:#64748b;font-size:13px}
header.cover{border-bottom:3px solid #e8b82f;padding-bottom:18px}section{border-bottom:1px solid #e5e7eb;padding-bottom:12px}
table{width:100%;border-collapse:collapse;margin:12px 0}th,td{text-align:left;padding:8px;border-bottom:1px solid #e5e7eb}th{background:#f8fafc}
footer{margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px;font-size:12px;color:#64748b}
@media print{body{margin:0 auto;padding:0 12px}h2,h3{break-after:avoid}tr,li{break-inside:avoid}section{break-inside:auto}}
</style></head>
<body>
<header class="cover"><p class="muted">BEESWAX · PREPARED FOR WINSTEAD PC</p>
<h1>Executive cyber incident report</h1><p><strong>${escapeHtml(incident?.title || 'Incident update')}</strong></p>
<p class="muted">Incident ${escapeHtml(incident?.id || '—')} · Prepared ${escapeHtml(formatDate(reportDate))}</p>
<p class="muted">What happened? · Why does it matter? · What should leadership do?</p></header>
<main>
<section><h2>What happened?</h2><p>${escapeHtml(incident?.summary || 'No incident summary has been recorded.')}</p></section>
<section><h2>Why does it matter?</h2><p>Recorded scope includes ${metrics.encrypted} encrypted systems, ${metrics.exfiltrated} systems marked for data exposure, and ${metrics.phiCompromised} PHI systems encrypted or exposed. Scope remains subject to forensic validation.</p></section>
<section><h2>What should leadership do?</h2><p>Approve priority containment, evidence preservation, qualified legal and forensic support, and time-bound remediation. Confirm accountable owners, cost estimates, and notification decisions with the appropriate leads.</p></section>
${sectionHtml}
<section><h2>Recent activity</h2><ol>${timelineHtml || '<li>No activity has been recorded.</li>'}</ol></section>
</main>
<footer>Prepared from the current incident workspace at ${escapeHtml(formatDate(reportDate))}. Validate scope, estimates, legal obligations, and recommendations with the response team and counsel before external distribution.</footer>
</body></html>`;
}

export default function BoardBriefScreen() {
  const { incident, metrics, boardDecisions, toggleBoardDecision, assets, timeline } = useIncident();
  const { canWrite } = useAuth();
  const [downloaded, setDownloaded] = useState(false);
  const reportDate = useMemo(() => new Date(), []);
  const reportDateLabel = reportDate.toLocaleString();
  const decisions = Object.values(boardDecisions);
  const affectedAssets = assets.filter(asset => ['encrypted', 'exfiltrated', 'suspected'].includes(asset.status));
  const exposedAssets = assets.filter(asset => ['encrypted', 'exfiltrated'].includes(asset.status));
  const vulnerableAssets = assets.filter(asset => asset.cveList?.length);
  const criticalAssets = assets.filter(asset =>
    asset.dataClass === 'Crown Jewels' && ['encrypted', 'exfiltrated', 'suspected'].includes(asset.status)
  );
  const activity = [...timeline].reverse().slice(0, 8);

  const reportHtml = useMemo(() => buildReportHtml({
    incident,
    assets,
    metrics,
    decisions,
    timeline,
    reportDate
  }), [incident, assets, metrics, decisions, timeline, reportDate]);

  function handleDownload() {
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident-report-${(incident?.id || 'beeswax').toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2500);
  }

  const sections = [
    {
      title: '1. Incident details',
      description: 'Attack type, first recorded, severity, phase, and affected systems.',
      rows: [
        ['Attack type', 'Ransomware with reported data exfiltration'],
        ['Initial access', incident?.attackVector || 'Under investigation'],
        ['First recorded', incident?.discoveredAt ? new Date(incident.discoveredAt).toLocaleString() : 'Not recorded'],
        ['Severity / phase', `${incident?.severity || 'Not set'} / ${incident?.phase || 'Not set'}`],
        ['Affected systems', `${affectedAssets.length} affected or under review of ${assets.length} tracked assets`]
      ]
    },
    {
      title: '2. Data exposure',
      description: 'Current counts; suspected systems are not counted as confirmed exposure.',
      bullets: [
        `PHI: ${exposedAssets.filter(asset => asset.dataClass === 'PHI').length} affected systems (${metrics.phiCompromised} encrypted or exposed).`,
        `PII: ${exposedAssets.filter(asset => asset.dataClass === 'PII').length} affected systems.`,
        `Client / financial records: ${exposedAssets.filter(asset => asset.dataClass === 'Client Data').length} affected systems.`,
        `Critical systems: ${criticalAssets.length} suspected or affected (${criticalAssets.map(asset => asset.name).join(', ') || 'none'}).`,
        `Under review: ${metrics.suspected} systems.`
      ],
      table: true
    },
    {
      title: '3. Financial impact',
      description: 'Unverified scenario values are not a substitute for Finance-approved estimates.',
      bullets: [
        `Ransom demand recorded: ${incident?.ransomDemanded || 'Not recorded'}.`,
        'Downtime, response, recovery, legal, and notification costs: not yet estimated; request a Finance-approved range.',
        'Insurance recovery and any potential penalties: assessment not recorded.'
      ]
    },
    {
      title: '4. Security failures',
      description: 'Available scan findings identify review areas, not when a control failed.',
      bullets: [
        `CVEs on ${vulnerableAssets.length} tracked systems: ${vulnerableAssets.map(asset => `${asset.name} (${asset.cveList.join(', ')})`).join('; ') || 'none recorded'}.`,
        `Shadow or unmanaged storage: ${assets.filter(asset => asset.id.includes('shadow')).map(asset => `${asset.name} — ${asset.status}`).join('; ') || 'none recorded'}.`,
        'Patch, access, monitoring, and data-egress control evidence is not attached; validate with system owners.'
      ]
    },
    {
      title: '5. CISO accountability',
      description: 'The current record is insufficient to make a finding about prior knowledge or individual accountability.',
      bullets: [
        'Current Nessus risk and CVE entries do not establish when a vulnerability was known or whether remediation was approved, scheduled, or completed.',
        'Review dated scan reports, risk acceptances, change tickets, exceptions, and escalation records.',
        'Do not infer control effectiveness or individual knowledge without supporting evidence.'
      ]
    },
    {
      title: '6. Detection and response',
      description: 'Use the timeline as the source for response milestones; resolution time is not recorded.',
      bullets: [
        `Recorded discovery: ${incident?.discoveredAt ? new Date(incident.discoveredAt).toLocaleString() : 'Not recorded'}.`,
        `Timeline entries: ${timeline.length}; latest entry: ${timeline.length ? new Date(timeline[timeline.length - 1].ts).toLocaleString() : 'Not recorded'}.`,
        `Current phase: ${incident?.phase || 'Not set'}. Detection and containment duration are not calculated or verified by this prototype.`,
        'Resolution time: not recorded.'
      ]
    },
    {
      title: '7. Risk assessment',
      description: 'Decision support only; this prototype does not provide a formal control assessment or quantitative loss model.',
      bullets: [
        'NIST: document response and recovery actions against the incident response lifecycle.',
        'CIS Controls: no control-by-control evidence mapping is stored in this workspace.',
        'Scenario likelihood: high operational concern given the recorded ransomware and data-staging events; not a calibrated forecast.',
        'Monte Carlo loss estimate: unavailable; probability distributions, loss inputs, and simulation results are not maintained here.'
      ]
    },
    {
      title: '8. Recovery',
      description: 'Confirm restoration and remediation with evidence and named owners.',
      bullets: [
        `${metrics.recovered} assets are marked recovered.`,
        'Verify trusted backups, rebuild affected systems, rotate exposed credentials, patch validated findings, and confirm monitoring before reconnecting systems.',
        'Document recovery evidence, lessons learned, and remaining work.'
      ]
    },
    {
      title: '9. Executive decisions',
      description: 'Confirm actions, owners, costs, and deadlines with the response team and Finance.',
      decisions,
      bullets: [
        'Immediate: confirm containment, evidence preservation, and legal/forensic support. Cost: obtain quotes; owner: incident commander.',
        'Within 24 hours: confirm data scope, notification analysis, and insurance notice requirements. Cost: estimate with counsel and Finance.',
        'Within 30 days: close verified patching, access, and shadow-storage gaps. Set owners, cost, and due dates with system owners.'
      ]
    }
  ];

  return (
    <section className="screen-scroll flex-1 overflow-y-auto bg-slate-50 p-5 md:p-7">
      <div className="mx-auto max-w-6xl">
        <header className="report-toolbar mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Prepared for Winstead PC</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Board report</h1>
            <p className="mt-1 text-sm text-slate-600">Incident breakdown for executive review and distribution.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleDownload} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50">
              {downloaded ? <Check className="h-4 w-4 text-emerald-700" /> : <Download className="h-4 w-4" />}
              {downloaded ? 'Downloaded' : 'Download report'}
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3.5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300">
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </button>
          </div>
        </header>

        <article className="report-page rounded-xl border border-slate-200 bg-white px-6 py-7 shadow-sm md:px-10 md:py-9">
          <header className="border-b-2 border-amber-300 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Beeswax · Prepared for Winstead PC</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Executive cyber incident report</h2>
            <p className="mt-2 text-lg font-medium text-slate-800">{incident?.title || 'Incident update'}</p>
            <p className="mt-1 text-sm text-slate-500">{incident?.id} <span className="px-1">·</span> Prepared {reportDateLabel}</p>
          </header>

          <section className="report-section border-b border-slate-100 py-5">
            <h3 className="text-base font-semibold text-slate-900">What happened?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{incident?.summary || 'No incident summary has been recorded.'}</p>
          </section>
          <section className="report-section border-b border-slate-100 py-5">
            <h3 className="text-base font-semibold text-slate-900">Why does it matter?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Current records show {metrics.encrypted} encrypted assets, {metrics.exfiltrated} assets marked for data exposure, and {metrics.phiCompromised} PHI assets encrypted or exposed. Scope and notification obligations require confirmation by investigators and counsel.
            </p>
          </section>
          <section className="report-section border-b border-slate-100 py-5">
            <h3 className="text-base font-semibold text-slate-900">What should leadership do?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Confirm containment, preserve evidence, retain appropriate counsel and forensic support, and assign owners and due dates to remediation. Review costs and notification decisions with Finance and counsel.
            </p>
          </section>

          {sections.map(section => (
            <section key={section.title} className="report-section border-b border-slate-100 py-5 last:border-0">
              <h3 className="text-base font-semibold text-slate-900">{section.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p>

              {section.rows && (
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {section.rows.map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-3 text-sm">
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="mt-1 font-medium text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                  {section.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}

              {section.table && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="pb-2 font-medium">System</th><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Data</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {affectedAssets.map(asset => (
                        <tr key={asset.id}>
                          <td className="py-2 font-medium text-slate-900">{asset.name}</td>
                          <td className="py-2 text-slate-600">{asset.type}</td>
                          <td className="py-2 capitalize text-slate-700">{asset.status}</td>
                          <td className="py-2 text-slate-700">{asset.dataClass === 'Crown Jewels' ? 'Critical system' : asset.dataClass}</td>
                        </tr>
                      ))}
                      {affectedAssets.length === 0 && <tr><td colSpan="4" className="py-3 text-slate-500">No affected assets are recorded.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {section.decisions && (
                <ul className="mt-3 space-y-2">
                  {section.decisions.map(decision => (
                    <li key={decision.id} className="flex items-start gap-2 text-sm">
                      <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${decision.approved ? 'bg-amber-100 text-amber-950' : 'bg-slate-100 text-slate-600'}`}>
                        {decision.approved ? 'Approved' : 'Pending'}
                      </span>
                      <span className="text-slate-800">{decision.label}{decision.approvedBy && <span className="block text-xs text-slate-500">Recorded by {decision.approvedBy}</span>}</span>
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => toggleBoardDecision(decision.id, !decision.approved)}
                          aria-label={`${decision.approved ? 'Mark pending' : 'Approve'}: ${decision.label}`}
                          className="ml-auto rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                        >
                          {decision.approved ? 'Undo' : 'Approve'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="report-section border-b border-slate-100 py-5">
            <h3 className="text-base font-semibold text-slate-900">Recent activity</h3>
            <ol className="mt-3 space-y-3">
              {activity.map(item => (
                <li key={item.seq} className="text-sm leading-6 text-slate-700">
                  <time className="mr-2 text-xs text-slate-500">{new Date(item.ts).toLocaleString()}</time>
                  <strong className="font-medium text-slate-900">{item.actor}:</strong> {item.text}
                </li>
              ))}
              {activity.length === 0 && <li className="text-sm text-slate-500">No activity has been recorded.</li>}
            </ol>
          </section>

          <footer className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
            Generated from the current Beeswax incident workspace. Validate scope, estimates, legal obligations, and recommendations with the response team and counsel before external distribution.
          </footer>
        </article>
      </div>
    </section>
  );
}
