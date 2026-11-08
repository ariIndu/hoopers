import React, { useState } from 'react';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, CircleAlert, Hexagon, Shield, X } from 'lucide-react';

const filters = [
  { id: 'all', label: 'All assets' },
  { id: 'affected', label: 'Affected' },
  { id: 'phi', label: 'PHI' },
  { id: 'critical', label: 'Critical systems' }
];

function getAssetColor(asset, postureMode) {
  if (postureMode === 'posture') {
    if (asset.nessusRisk === 'Critical') return { fill: '#fef2f2', stroke: '#dc2626' };
    if (asset.nessusRisk === 'High') return { fill: '#fff7ed', stroke: '#c2410c' };
    if (asset.nessusRisk === 'Medium') return { fill: '#fffbeb', stroke: '#b7791f' };
    return { fill: '#ffffff', stroke: '#cbd5e1' };
  }

  if (asset.status === 'encrypted' || asset.status === 'exfiltrated') {
    return { fill: '#fef2f2', stroke: '#dc2626' };
  }
  if (asset.status === 'suspected') return { fill: '#fffaf0', stroke: '#d6ad4d' };
  if (asset.status === 'recovered') return { fill: '#fffdf7', stroke: '#d9c078' };
  return { fill: '#ffffff', stroke: '#cbd5e1' };
}

function wrapAssetName(name, maxLineLength = 11) {
  const words = name.split(/[-\s]+/);
  const lines = [];
  let line = '';

  words.forEach(word => {
    if (line && `${line}-${word}`.length > maxLineLength) {
      lines.push(`${line}-`);
      line = word;
    } else {
      line = line ? `${line}-${word}` : word;
    }
  });

  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function getHexPoints(cx, cy, radius) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(' ');
}

function formatClassification(value) {
  return value === 'Crown Jewels' ? 'Critical system' : value;
}

export default function HiveScreen() {
  const { assets, updateAssetStatus, metrics, postureMode, setPostureMode } = useIncident();
  const { canWrite } = useAuth();
  const [selectedAssetId, setSelectedAssetId] = useState('actuary-db-01');
  const [filter, setFilter] = useState('all');
  const [nextStatus, setNextStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedAsset = assets.find(asset => asset.id === selectedAssetId) || assets[0];
  const affectedCount = assets.filter(asset =>
    ['encrypted', 'exfiltrated', 'suspected'].includes(asset.status)
  ).length;

  const visibleAssets = assets.filter(asset => {
    if (filter === 'affected') return ['encrypted', 'exfiltrated', 'suspected'].includes(asset.status);
    if (filter === 'phi') return asset.dataClass === 'PHI';
    if (filter === 'critical') return asset.dataClass === 'Crown Jewels';
    return true;
  });

  async function handleStatusChange(event) {
    event.preventDefault();
    if (!canWrite || !selectedAsset || !nextStatus) return;
    setSaving(true);
    try {
      await updateAssetStatus(selectedAsset.id, nextStatus, note.trim());
      setNextStatus('');
      setNote('');
    } catch (error) {
      alert(`Could not update asset: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (!selectedAsset) {
    return (
      <section className="flex-1 p-8 text-center text-slate-500">
        <Hexagon className="mx-auto mb-3 h-8 w-8 text-amber-500" />
        <h2 className="font-semibold text-slate-900">No assets available</h2>
        <p className="mt-1 text-sm">Asset data could not be loaded.</p>
      </section>
    );
  }

  return (
    <section className="screen-scroll flex-1 overflow-y-auto bg-slate-50 p-5 md:p-7">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Incident workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Asset map</h1>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div><span className="text-slate-500">Total</span><strong className="ml-2 text-slate-900">{assets.length}</strong></div>
            <div><span className="text-slate-500">Affected</span><strong className="ml-2 text-slate-900">{affectedCount}</strong></div>
            <div><span className="text-slate-500">PHI affected</span><strong className="ml-2 text-amber-800">{metrics.phiCompromised}</strong></div>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {filters.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  filter === item.id ? 'bg-amber-100 font-medium text-amber-950' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPostureMode(postureMode === 'posture' ? 'scope' : 'posture')}
            aria-pressed={postureMode === 'posture'}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Shield className="h-4 w-4 text-amber-700" />
            {postureMode === 'posture' ? 'Show incident status' : 'Show scan risk'}
          </button>
        </div>

        <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col p-3 md:p-5">
            <div className="flex items-center justify-between px-1 pb-3 text-sm text-slate-500">
              <span>{postureMode === 'posture' ? 'Vulnerability scan' : 'Incident status'}</span>
              <span>Select a cell to view details</span>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto rounded-lg bg-slate-50/70 p-2 md:p-4">
              <svg
                viewBox="0 0 430 280"
                role="img"
                aria-label="Interactive honeycomb asset map"
                className="h-auto w-full max-w-4xl select-none"
              >
                {visibleAssets.map(asset => {
                  const isSelected = asset.id === selectedAsset.id;
                  const radius = 43;
                  const horizontal = Math.sqrt(3) * radius;
                  const vertical = radius * 1.5;
                  const cx = 60 + asset.col * horizontal + (asset.row % 2 ? horizontal / 2 : 0);
                  const cy = 65 + asset.row * vertical;
                  const colors = getAssetColor(asset, postureMode);
                  const nameLines = wrapAssetName(asset.name);
                  const state = postureMode === 'posture' ? `${asset.nessusRisk} risk` : asset.status;

                  return (
                    <g
                      key={asset.id}
                      role="button"
                      tabIndex="0"
                      aria-label={`${asset.name}, ${state}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedAssetId(asset.id)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedAssetId(asset.id);
                        }
                      }}
                      className={`asset-cell cursor-pointer outline-none ${asset.status === 'encrypted' || asset.status === 'exfiltrated' ? 'asset-cell-critical' : ''}`}
                    >
                      <title>{`${asset.name} · ${state}`}</title>
                      <polygon
                        points={getHexPoints(cx, cy, radius)}
                        fill={colors.fill}
                        stroke={isSelected ? '#92400e' : colors.stroke}
                        strokeWidth={isSelected ? '3' : '1.5'}
                        className="transition-colors"
                      />
                      <text
                        x={cx}
                        y={cy - (nameLines.length > 1 ? 8 : 3)}
                        textAnchor="middle"
                        fill="#1e293b"
                        fontSize="7.5"
                        fontFamily="system-ui, sans-serif"
                        fontWeight={isSelected ? '700' : '600'}
                      >
                        {nameLines.map((line, index) => (
                          <tspan key={`${line}-${index}`} x={cx} dy={index === 0 ? 0 : 9}>{line}</tspan>
                        ))}
                      </text>
                      <text
                        x={cx}
                        y={cy + 21}
                        textAnchor="middle"
                        fill={asset.status === 'encrypted' || asset.status === 'exfiltrated' ? '#b91c1c' : '#64748b'}
                        fontSize="7"
                        fontFamily="system-ui, sans-serif"
                        fontWeight={asset.status === 'encrypted' || asset.status === 'exfiltrated' ? '700' : '500'}
                      >
                        {state}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 pt-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />No known impact</span>
              <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full border border-amber-500 bg-amber-100" />Under review</span>
              <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full border border-red-600 bg-red-100" />Critical impact</span>
              <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full border border-amber-800 bg-white" />Recovered</span>
            </div>
          </div>

          <aside className="border-t border-slate-200 p-5 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">{selectedAsset.type}</p>
                <h2 className="mt-1 break-words text-lg font-semibold text-slate-950">{selectedAsset.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssetId(assets[0]?.id)}
                aria-label="Close asset details"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {['Critical', 'High', 'Medium'].includes(selectedAsset.nessusRisk) && (
              <div className={`mb-4 rounded-lg border p-3 ${
                selectedAsset.nessusRisk === 'Critical'
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : 'border-amber-200 bg-amber-50 text-amber-950'
              }`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">
                      {selectedAsset.nessusRisk} vulnerability risk
                    </p>
                    <p className="mt-1 text-xs leading-5">
                      {selectedAsset.nessusRisk === 'Critical'
                        ? 'Immediate review recommended.'
                        : selectedAsset.nessusRisk === 'High'
                          ? 'Prioritize investigation and remediation.'
                          : 'Include in the remediation plan.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <dl className="space-y-3 border-y border-slate-100 py-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium capitalize text-slate-900">{selectedAsset.status}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Data</dt>
                <dd className="text-right font-medium text-slate-900">{formatClassification(selectedAsset.dataClass)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Address</dt>
                <dd className="font-mono text-xs text-slate-700">{selectedAsset.ip}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Network</dt>
                <dd className="text-right text-xs text-slate-700">{selectedAsset.vlan}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Scan risk</dt>
                <dd className="font-medium text-slate-900">{selectedAsset.nessusRisk}</dd>
              </div>
            </dl>

            <p className="py-4 text-sm leading-6 text-slate-600">{selectedAsset.description}</p>
            {selectedAsset.cveList?.length > 0 && (
              <div className="mb-4 rounded-lg bg-slate-50 p-3">
                <p className="mb-2 text-xs font-medium text-slate-600">Related findings</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAsset.cveList.map(cve => (
                    <span key={cve} className="rounded bg-white px-2 py-1 font-mono text-xs text-slate-700">{cve}</span>
                  ))}
                </div>
              </div>
            )}

            {canWrite && (
              <form onSubmit={handleStatusChange} className="space-y-3 border-t border-slate-100 pt-4">
                <label className="block text-sm font-medium text-slate-800" htmlFor="asset-status">Update status</label>
                <select
                  id="asset-status"
                  value={nextStatus}
                  onChange={event => setNextStatus(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">Choose a status</option>
                  <option value="clean">No known impact</option>
                  <option value="suspected">Under review</option>
                  <option value="encrypted">Encrypted</option>
                  <option value="exfiltrated">Data taken</option>
                  <option value="recovered">Recovered</option>
                </select>
                <input
                  type="text"
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  placeholder="Optional note for the log"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
                <button
                  type="submit"
                  disabled={!nextStatus || saving}
                  className="w-full rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save status'}
                </button>
              </form>
            )}

            {!canWrite && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <CircleAlert className="h-4 w-4 shrink-0" />
                Read-only access
              </div>
            )}
          </aside>
        </div>

        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle className="h-3.5 w-3.5 text-amber-700" />
          Asset changes are recorded in the incident timeline.
        </p>
      </div>
    </section>
  );
}
