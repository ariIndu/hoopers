import React, { useState } from 'react';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, Upload, FileText, CheckCircle2, AlertTriangle, 
  ChevronRight, ChevronDown, RefreshCw, BarChart2, Server, ExternalLink
} from 'lucide-react';

export default function NessusScreen({ onNavigateToHive }) {
  const { nessusData, uploadNessus, loadSampleNessus } = useIncident();
  const { canWrite } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [expandedHost, setExpandedHost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadStatus('');
    try {
      await uploadNessus(file);
      setUploadStatus(`Successfully parsed .nessus audit: ${file.name}`);
      setTimeout(() => setUploadStatus(''), 4000);
    } catch (err) {
      alert('Failed to parse Nessus XML: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleLoadSample() {
    setUploading(true);
    setUploadStatus('');
    try {
      await loadSampleNessus();
      setUploadStatus('Loaded bundled Enterprise DMZ & Actuary Incident Nessus scan.');
      setTimeout(() => setUploadStatus(''), 4000);
    } catch (err) {
      alert('Failed to load sample scan: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  const counts = nessusData?.severityCounts || { critical: 0, high: 0, medium: 0, low: 0 };
  const total = (counts.critical + counts.high + counts.medium + counts.low) || 1;

  const critPercent = Math.round((counts.critical / total) * 100);
  const highPercent = Math.round((counts.high / total) * 100);
  const medPercent = Math.round((counts.medium / total) * 100);

  const filteredHosts = nessusData?.hosts?.filter(h => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      h.ip.toLowerCase().includes(term) ||
      h.hostname.toLowerCase().includes(term) ||
      h.os.toLowerCase().includes(term) ||
      h.vulnerabilities.some(v => v.cve?.toLowerCase().includes(term) || v.pluginName?.toLowerCase().includes(term))
    );
  }) || [];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-y-auto bg-slate-50 p-6 space-y-6">
      
      {/* Top Controls: Upload & Quick Sample Loader */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              Nessus Vulnerability Audit Parser (.nessus XML)
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              fast-xml-parser
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Ingest vulnerability scans to establish whether known vulnerabilities existed prior to breach (CISO Preventive Posture Evaluation).
          </p>
        </div>

        {/* Upload Controls */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <label className={`px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition flex items-center gap-2 cursor-pointer shadow-xs ${uploading ? 'opacity-50' : ''}`}>
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Upload .nessus</span>
            <input
              type="file"
              accept=".nessus,.xml"
              onChange={handleFileUpload}
              disabled={uploading || !canWrite}
              className="hidden"
            />
          </label>

          <button
            onClick={handleLoadSample}
            disabled={uploading || !canWrite}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} />
            <span>Load Sample Incident Scan</span>
          </button>
        </div>

      </div>

      {uploadStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 font-medium uppercase">Scanned Hosts</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {nessusData?.totalHosts || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">DMZ &amp; Internal Segments</div>
        </div>

        <div className="bg-white border border-rose-200 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-rose-700 font-bold uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Critical Severities
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
            {counts.critical}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">CVSS 9.0 - 10.0 Exploitables</div>
        </div>

        <div className="bg-white border border-orange-200 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-orange-700 font-bold uppercase">High Severities</div>
          <div className="text-2xl font-bold font-mono text-orange-700 mt-1">
            {counts.high}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">CVSS 7.0 - 8.9 Elevation Vectors</div>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-amber-800 font-bold uppercase">Medium Severities</div>
          <div className="text-2xl font-bold font-mono text-amber-800 mt-1">
            {counts.medium}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Weak Auth &amp; Configurations</div>
        </div>

      </div>

      {/* Severity Breakdown Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-500" />
            Vulnerability Severity Distribution
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Total Findings: {counts.critical + counts.high + counts.medium + counts.low}
          </span>
        </div>

        {/* Multi-Colored Clean Segment Bar */}
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
          <div 
            style={{ width: `${critPercent}%` }} 
            className="bg-rose-500 transition" 
            title={`Critical: ${counts.critical} (${critPercent}%)`} 
          />
          <div 
            style={{ width: `${highPercent}%` }} 
            className="bg-orange-500 transition" 
            title={`High: ${counts.high} (${highPercent}%)`} 
          />
          <div 
            style={{ width: `${medPercent}%` }} 
            className="bg-amber-400 transition" 
            title={`Medium: ${counts.medium} (${medPercent}%)`} 
          />
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-6 text-xs font-sans pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span className="text-slate-700 font-medium">Critical ({counts.critical})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500"></span>
            <span className="text-slate-700 font-medium">High ({counts.high})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400"></span>
            <span className="text-slate-700 font-medium">Medium ({counts.medium})</span>
          </div>
        </div>
      </div>

      {/* Host Vulnerability Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-500" />
              Audited Hosts &amp; Weaponized CVE Findings
            </h3>
            <p className="text-xs text-slate-500">Correlated against Active Directory, FortiOS DMZ, and Actuary Databases</p>
          </div>

          <input
            type="text"
            placeholder="Search CVE, IP, hostname..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono w-64 shadow-xs"
          />
        </div>

        {/* Hosts List */}
        <div className="space-y-3">
          {filteredHosts.map(host => {
            const isExpanded = expandedHost === host.ip;

            return (
              <div 
                key={host.ip}
                className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden transition hover:border-slate-300"
              >
                {/* Host Row Header */}
                <div 
                  onClick={() => setExpandedHost(isExpanded ? null : host.ip)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-amber-600" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{host.hostname}</span>
                        <span className="font-mono text-xs text-slate-500">({host.ip})</span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{host.os}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {host.criticalCount > 0 && (
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {host.criticalCount} Critical
                      </span>
                    )}
                    {host.highCount > 0 && (
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                        {host.highCount} High
                      </span>
                    )}
                    {host.mediumCount > 0 && (
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                        {host.mediumCount} Med
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Vulnerabilities List */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-2 border-t border-slate-100 bg-slate-50/70 space-y-2.5">
                    <div className="text-[11px] font-mono uppercase text-slate-400 pt-1 font-semibold">
                      Detected Findings ({host.vulnerabilities.length})
                    </div>

                    <div className="space-y-2">
                      {host.vulnerabilities.map((v, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                v.severity === 4 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                v.severity === 3 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-amber-50 text-amber-800 border-amber-300'
                              }`}>
                                {v.severity === 4 ? 'CRITICAL' : v.severity === 3 ? 'HIGH' : 'MEDIUM'}
                              </span>

                              <span className="text-xs font-semibold text-slate-900">{v.pluginName}</span>
                            </div>

                            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-3">
                              <span>Port: {v.port}</span>
                              {v.cvss > 0 && <span>CVSS: <strong className="text-slate-900">{v.cvss}</strong></span>}
                            </div>
                          </div>

                          {v.cve && v.cve !== 'N/A' && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                {v.cve}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
