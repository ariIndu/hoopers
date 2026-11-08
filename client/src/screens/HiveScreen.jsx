import React, { useState } from 'react';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, AlertOctagon, Lock, Database, Server, 
  ExternalLink, CheckCircle, RefreshCw, Send, 
  Eye, Zap, Filter, Flame, Crosshair, Grid, List, 
  Search, ShieldAlert, Cloud, Key, Network, Cpu
} from 'lucide-react';

export default function HiveScreen() {
  const { assets, updateAssetStatus, metrics, postureMode, setPostureMode } = useIncident();
  const { canWrite } = useAuth();

  const [selectedAssetId, setSelectedAssetId] = useState('actuary-db-01');
  const [dataFilter, setDataFilter] = useState('ALL');
  const [viewTab, setViewTab] = useState('grid'); // 'grid' (SVG Honeycomb) or 'library' (Asset Directory)
  const [searchQuery, setSearchQuery] = useState('');
  const [timelineNote, setTimelineNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  // Hexagon geometry math
  const R = 48; // Hexagon radius
  const hexWidth = Math.sqrt(3) * R; // ~83.1
  const hexHeight = 2 * R; // 96
  const vertDist = hexHeight * 0.75; // 72
  const horizDist = hexWidth; // 83.1

  function getHexPoints(cx, cy, r) {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i - 30; // Pointy-topped
      const angleRad = (Math.PI / 180) * angleDeg;
      points.push(`${cx + r * Math.cos(angleRad)},${cy + r * Math.sin(angleRad)}`);
    }
    return points.join(' ');
  }

  // Determine status styling for clean HCI
  function getAssetColors(asset) {
    if (postureMode === 'posture') {
      // Color by Nessus Vulnerability Severity
      switch (asset.nessusRisk) {
        case 'Critical':
          return { fill: '#fef2f2', stroke: '#ef4444', text: '#b91c1c', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
        case 'High':
          return { fill: '#fff7ed', stroke: '#f97316', text: '#c2410c', badge: 'bg-orange-50 text-orange-700 border-orange-200' };
        case 'Medium':
          return { fill: '#fefce8', stroke: '#eab308', text: '#a16207', badge: 'bg-amber-50 text-amber-800 border-amber-200' };
        default:
          return { fill: '#f8fafc', stroke: '#94a3b8', text: '#475569', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
      }
    }

    // Default: Color by Incident Scope Status
    switch (asset.status) {
      case 'encrypted':
        return { fill: '#fef2f2', stroke: '#ef4444', text: '#b91c1c', label: 'ENCRYPTED' };
      case 'exfiltrated':
        return { fill: '#faf5ff', stroke: '#a855f7', text: '#7e22ce', label: 'EXFILTRATED' };
      case 'suspected':
        return { fill: '#fffbeb', stroke: '#f59e0b', text: '#b45309', label: 'SUSPECTED' };
      case 'recovered':
        return { fill: '#ecfeff', stroke: '#06b6d4', text: '#0e7490', label: 'RECOVERED' };
      case 'clean':
      default:
        return { fill: '#f8fafc', stroke: '#94a3b8', text: '#475569', label: 'CLEAN' };
    }
  }

  async function handleStatusChange(newStatus) {
    if (!canWrite || !selectedAsset) return;
    setActionLoading(true);
    try {
      await updateAssetStatus(selectedAsset.id, newStatus, timelineNote);
      setTimelineNote('');
    } catch (err) {
      alert('Failed to update asset: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Filter assets
  const filteredAssets = assets.filter(a => {
    // Quick filter chips
    if (dataFilter === 'PHI' && a.dataClass !== 'PHI') return false;
    if (dataFilter === 'CROWN' && a.dataClass !== 'Crown Jewels') return false;
    if (dataFilter === 'COMPROMISED' && !(a.status === 'encrypted' || a.status === 'exfiltrated')) return false;
    if (dataFilter === 'SHADOW' && !a.id.includes('shadow')) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.ip.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.dataClass.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        (a.cveList && a.cveList.some(c => c.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  // Group assets for library view
  const assetCategories = [
    { title: 'Databases & Storage', icon: Database, match: (a) => a.type.includes('Database') || a.type.includes('Storage') },
    { title: 'Identity & Access Controls', icon: Key, match: (a) => a.type.includes('Domain') || a.type.includes('Bastion') || a.type.includes('Vault') },
    { title: 'Perimeter & Network', icon: Network, match: (a) => a.type.includes('VPN') || a.type.includes('Gateway') || a.type.includes('Switch') },
    { title: 'Analytics & Compute Systems', icon: Cpu, match: (a) => a.type.includes('Analytics') || a.type.includes('Server') || a.type.includes('Worker') || a.type.includes('OT') || a.type.includes('Sensor') }
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50">
      
      {/* Scope Metric Counter Strip - Clean White Bar with Yellow Brand Accents */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between flex-wrap gap-3 shadow-xs">
        
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>{metrics.encrypted} ENCRYPTED</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>{metrics.exfiltrated} EXFILTRATED</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{metrics.phiCompromised} PHI EXPOSED</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span>{metrics.recovered} RECOVERED</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium font-mono">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>{metrics.clean} CLEAN</span>
          </div>
        </div>

        {/* View Mode Switches: Honeycomb Canvas vs. Asset Library Directory */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center text-xs">
            <button
              onClick={() => setViewTab('grid')}
              className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                viewTab === 'grid'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-amber-600" />
              <span>Honeycomb Grid</span>
            </button>
            <button
              onClick={() => setViewTab('library')}
              className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                viewTab === 'library'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5 text-amber-600" />
              <span>Asset Library ({assets.length})</span>
            </button>
          </div>

          {/* Posture Toggle */}
          <button
            onClick={() => setPostureMode(postureMode === 'scope' ? 'posture' : 'scope')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 shadow-xs ${
              postureMode === 'posture'
                ? 'bg-amber-400 text-slate-950 font-bold border-amber-400'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle between Incident Status and Nessus Vulnerability Severity"
          >
            <Shield className="w-3.5 h-3.5 text-slate-900" />
            <span>{postureMode === 'posture' ? 'Posture: Nessus Vulns' : 'Posture: Incident Scope'}</span>
          </button>
        </div>

      </div>

      {/* Main Content Area: Grid/Library on Left + Inspection Drawer on Right */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Either Honeycomb Grid or Asset Library */}
        <div className="flex-1 flex flex-col p-5 overflow-auto bg-slate-50 light-grid-bg">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-400 px-2 flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-500" /> Filter:
              </span>
              {['ALL', 'PHI', 'CROWN', 'COMPROMISED', 'SHADOW'].map(f => (
                <button
                  key={f}
                  onClick={() => setDataFilter(f)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-md transition ${
                    dataFilter === f
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {f === 'CROWN' ? 'Crown Jewels' : f}
                </button>
              ))}
            </div>

            {viewTab === 'library' && (
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search assets, IPs, CVEs..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
                />
              </div>
            )}
          </div>

          {/* VIEW TAB 1: Honeycomb SVG Grid */}
          {viewTab === 'grid' && (
            <div className="flex-1 flex items-center justify-center min-h-[460px] bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <svg 
                viewBox="0 0 680 440" 
                className="w-full max-w-4xl h-auto select-none"
              >
                {/* Render Hexagons */}
                {assets.map(asset => {
                  const isSelected = asset.id === selectedAssetId;
                  const isFilteredOut = dataFilter !== 'ALL' && !filteredAssets.some(f => f.id === asset.id);
                  
                  // Hexagon row/col placement
                  const xOffset = 90;
                  const yOffset = 70;
                  const cx = xOffset + asset.col * horizDist + (asset.row % 2 === 1 ? horizDist / 2 : 0);
                  const cy = yOffset + asset.row * vertDist;

                  const colors = getAssetColors(asset);
                  const points = getHexPoints(cx, cy, R);

                  return (
                    <g
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className="cursor-pointer transition-transform duration-200 group"
                      opacity={isFilteredOut ? 0.25 : 1}
                    >
                      {/* Hexagon Body */}
                      <polygon
                        points={points}
                        fill={colors.fill}
                        stroke={isSelected ? '#f59e0b' : colors.stroke}
                        strokeWidth={isSelected ? '3.5' : '1.8'}
                        className="transition-all duration-200"
                      />

                      {/* Data Class Pill Indicator at Top */}
                      <rect
                        x={cx - 24}
                        y={cy - 29}
                        width="48"
                        height="11"
                        rx="2.5"
                        fill="#ffffff"
                        stroke={colors.stroke}
                        strokeWidth="0.8"
                      />
                      <text
                        x={cx}
                        y={cy - 21}
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize="7"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="bold"
                      >
                        {asset.dataClass === 'Crown Jewels' ? '💎 CROWN' : asset.dataClass}
                      </text>

                      {/* Asset Name in Center - High contrast dark slate */}
                      <text
                        x={cx}
                        y={cy - 5}
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="8"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="700"
                      >
                        {asset.name}
                      </text>

                      {/* Asset IP */}
                      <text
                        x={cx}
                        y={cy + 7}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="6.8"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {asset.ip}
                      </text>

                      {/* Status Pill at Bottom */}
                      <rect
                        x={cx - 26}
                        y={cy + 17}
                        width="52"
                        height="11"
                        rx="2.5"
                        fill="#ffffff"
                        stroke={colors.stroke}
                        strokeWidth="0.8"
                      />
                      <text
                        x={cx}
                        y={cy + 25}
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize="6.5"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="bold"
                      >
                        {postureMode === 'posture' ? `${asset.nessusRisk?.toUpperCase()}` : asset.status.toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* VIEW TAB 2: Asset Library Directory - Clean Structured HCI Catalog */}
          {viewTab === 'library' && (
            <div className="space-y-6">
              {assetCategories.map(cat => {
                const catAssets = filteredAssets.filter(cat.match);
                if (catAssets.length === 0) return null;
                const CatIcon = cat.icon;

                return (
                  <div key={cat.title} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    
                    {/* Category Header */}
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                          <CatIcon className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{cat.title}</h3>
                        <span className="text-xs font-mono text-slate-500">({catAssets.length})</span>
                      </div>
                    </div>

                    {/* Asset Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-mono uppercase text-slate-400">
                            <th className="py-2.5 px-4 font-semibold">Asset Name &amp; Host</th>
                            <th className="py-2.5 px-4 font-semibold">Type</th>
                            <th className="py-2.5 px-4 font-semibold">IP &amp; VLAN</th>
                            <th className="py-2.5 px-4 font-semibold">Data Class</th>
                            <th className="py-2.5 px-4 font-semibold">Incident Status</th>
                            <th className="py-2.5 px-4 font-semibold">Nessus Risk</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {catAssets.map(asset => {
                            const isSelected = asset.id === selectedAssetId;

                            return (
                              <tr 
                                key={asset.id}
                                onClick={() => setSelectedAssetId(asset.id)}
                                className={`cursor-pointer transition ${
                                  isSelected ? 'bg-amber-50/70 font-medium' : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <div className="font-mono font-bold text-slate-900">{asset.name}</div>
                                  <div className="text-[11px] text-slate-400 truncate max-w-xs">{asset.description}</div>
                                </td>

                                <td className="py-3 px-4 text-slate-600">
                                  {asset.type}
                                </td>

                                <td className="py-3 px-4 font-mono text-slate-600">
                                  <div>{asset.ip}</div>
                                  <div className="text-[10px] text-slate-400">{asset.vlan}</div>
                                </td>

                                <td className="py-3 px-4">
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                    asset.dataClass === 'PHI' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    asset.dataClass === 'Crown Jewels' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                    asset.dataClass === 'PII' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {asset.dataClass}
                                  </span>
                                </td>

                                <td className="py-3 px-4">
                                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                    asset.status === 'encrypted' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    asset.status === 'exfiltrated' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    asset.status === 'suspected' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                    asset.status === 'recovered' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {asset.status}
                                  </span>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                      asset.nessusRisk === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      asset.nessusRisk === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                      'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                      {asset.nessusRisk}
                                    </span>
                                    {asset.cveList?.length > 0 && (
                                      <span className="text-[10px] font-mono text-slate-400">
                                        ({asset.cveList.length} CVEs)
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAssetId(asset.id);
                                    }}
                                    className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition"
                                  >
                                    Inspect
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Scope Legend */}
          <div className="mt-4 bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600 shadow-xs">
            <div className="flex items-center space-x-4">
              <span className="font-mono text-[11px] text-slate-400 font-bold uppercase">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span>Clean</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Suspected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Encrypted (Ransom)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Exfiltrated (Stolen)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span>Recovered</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-amber-800 font-semibold">
              Every status edit automatically seals a SHA-256 block into the timeline
            </div>
          </div>

        </div>

        {/* Right Side Inspection Drawer - Clean White HCI Card */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col justify-between overflow-y-auto shadow-sm">
          
          <div className="p-5 space-y-5">
            
            {/* Header of Drawer */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                  {selectedAsset.type}
                </span>
                <span className={`text-[11px] font-mono uppercase px-2.5 py-0.5 rounded font-bold border ${
                  selectedAsset.status === 'encrypted' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  selectedAsset.status === 'exfiltrated' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  selectedAsset.status === 'suspected' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                  selectedAsset.status === 'recovered' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {selectedAsset.status.toUpperCase()}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 font-mono tracking-tight">
                {selectedAsset.name}
              </h2>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {selectedAsset.ip} · {selectedAsset.vlan}
              </div>
            </div>

            {/* Data Classification Impact Callout */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  Data Classification
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  selectedAsset.dataClass === 'PHI' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  selectedAsset.dataClass === 'Crown Jewels' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                  selectedAsset.dataClass === 'PII' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {selectedAsset.dataClass}
                </span>
              </div>

              {selectedAsset.dataClass === 'PHI' && (
                <div className="text-[11px] text-rose-900 bg-rose-50 p-2.5 rounded-lg border border-rose-200 leading-relaxed">
                  ⚠️ <strong className="font-semibold">Regulatory Impact (HIPAA):</strong> Contains Health Actuary Risk Tables. Under 45 CFR § 164.404, exfiltration triggers a mandatory <strong>60-day notification mandate</strong> to HHS OCR.
                </div>
              )}

              {selectedAsset.dataClass === 'Crown Jewels' && (
                <div className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-300 leading-relaxed">
                  💎 <strong className="font-semibold">Crown Jewels:</strong> Core enterprise domain infrastructure. Compromise allows unauthorized DCSync replication.
                </div>
              )}

              {selectedAsset.id.includes('shadow') && (
                <div className="text-[11px] text-purple-900 bg-purple-50 p-2.5 rounded-lg border border-purple-200 leading-relaxed">
                  ☁️ <strong className="font-semibold">Shadow IT:</strong> Unmanaged bucket spun up without CISO review. Primary staging egress conduit.
                </div>
              )}
            </div>

            {/* Asset Description & Forensic Note */}
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500 mb-1.5">Forensic Context</div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
                {selectedAsset.description}
              </p>
            </div>

            {/* Nessus Correlation */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  Nessus Vulnerability Risk
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  selectedAsset.nessusRisk === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  selectedAsset.nessusRisk === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {selectedAsset.nessusRisk} Risk
                </span>
              </div>

              {selectedAsset.cveList?.length > 0 ? (
                <div className="space-y-1">
                  {selectedAsset.cveList.map(cve => (
                    <div key={cve} className="text-xs font-mono text-rose-700 bg-white px-2 py-1 rounded border border-rose-200 flex items-center justify-between shadow-xs">
                      <span>{cve}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-rose-600">Weaponized</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 font-mono">No known unpatched critical CVEs recorded.</div>
              )}
            </div>

            {/* Big Status Action Buttons - Clean HCI Buttons */}
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500 mb-2">
                Update Asset Status
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <button
                  onClick={() => handleStatusChange('encrypted')}
                  disabled={!canWrite || actionLoading}
                  className="py-2.5 px-3 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  Encrypted
                </button>

                <button
                  onClick={() => handleStatusChange('exfiltrated')}
                  disabled={!canWrite || actionLoading}
                  className="py-2.5 px-3 rounded-lg bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                  Exfiltrated
                </button>

                <button
                  onClick={() => handleStatusChange('suspected')}
                  disabled={!canWrite || actionLoading}
                  className="py-2 px-3 rounded-lg bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-medium transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                  Suspected
                </button>

                <button
                  onClick={() => handleStatusChange('recovered')}
                  disabled={!canWrite || actionLoading}
                  className="py-2 px-3 rounded-lg bg-white hover:bg-cyan-50 text-cyan-800 border border-cyan-300 font-medium transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-600" />
                  Recovered
                </button>
              </div>

              <button
                onClick={() => handleStatusChange('clean')}
                disabled={!canWrite || actionLoading}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Declare Clean &amp; Restored
              </button>

              {!canWrite && (
                <div className="mt-2 text-[11px] text-slate-400 text-center font-mono">
                  [Read-Only Viewer: Upgrade persona to edit scope]
                </div>
              )}
            </div>

            {/* Optional note to attach to hash chain */}
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-mono">
                Forensic Note (Sealed to Hash Chain):
              </label>
              <input
                type="text"
                placeholder="e.g. Memory snapshot preserved"
                value={timelineNote}
                onChange={e => setTimelineNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
              />
            </div>

          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>AUDIT INTEGRITY:</span>
            <span className="text-emerald-700 font-semibold">SHA-256 Chained</span>
          </div>

        </div>

      </div>

    </div>
  );
}
