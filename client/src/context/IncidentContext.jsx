import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { verifyHashChain } from '../utils/crypto';

const IncidentContext = createContext(null);

export function IncidentProvider({ children }) {
  const { token } = useAuth();

  const [incident, setIncident] = useState(null);
  const [assets, setAssets] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [messages, setMessages] = useState([]);
  const [nessusData, setNessusData] = useState(null);
  const [boardDecisions, setBoardDecisions] = useState({});
  
  // Integrity state computed by browser SHA-256 Web Crypto
  const [integrity, setIntegrity] = useState({ valid: true, errorIndex: null, totalEntries: 0 });
  const [isTampering, setIsTampering] = useState(false);
  const [postureMode, setPostureMode] = useState('scope'); // 'scope' (incident status) or 'posture' (Nessus severity)
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Re-verify hash chain whenever timeline changes
  const runVerification = useCallback(async (currentTimeline) => {
    try {
      const result = await verifyHashChain(currentTimeline);
      setIntegrity(result);
    } catch (err) {
      console.error('Error during cryptographic verification:', err);
    }
  }, []);

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [incRes, astRes, tmlRes, msgRes, nssRes, bdcRes] = await Promise.all([
        fetch('/api/incident'),
        fetch('/api/assets'),
        fetch('/api/timeline'),
        fetch('/api/chat'),
        fetch('/api/nessus/summary'),
        fetch('/api/board-brief/decisions')
      ]);

      const [incData, astData, tmlData, msgData, nssData, bdcData] = await Promise.all([
        incRes.json(),
        astRes.json(),
        tmlRes.json(),
        msgRes.json(),
        nssRes.json(),
        bdcRes.json()
      ]);

      if (incData.incident) setIncident(incData.incident);
      if (astData.assets) setAssets(astData.assets);
      if (tmlData.timeline) {
        setTimeline(tmlData.timeline);
        await runVerification(tmlData.timeline);
      }
      if (msgData.messages) setMessages(msgData.messages);
      if (nssData.nessus) setNessusData(nssData.nessus);
      if (bdcData.decisions) setBoardDecisions(bdcData.decisions);
    } catch (err) {
      console.error('Failed to load incident command center data:', err);
    } finally {
      setLoading(false);
    }
  }, [runVerification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws;
    let reconnectTimeout;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;

            switch (type) {
              case 'INCIDENT_UPDATE':
                setIncident(payload);
                break;
              case 'ASSET_UPDATE':
                setAssets(prev => prev.map(a => a.id === payload.id ? payload : a));
                break;
              case 'ASSETS_REFRESH':
                setAssets(payload);
                break;
              case 'TIMELINE_NEW':
                setTimeline(prev => {
                  const updated = [...prev, payload];
                  runVerification(updated);
                  return updated;
                });
                break;
              case 'TIMELINE_TAMPER':
                setTimeline(payload.timeline);
                await runVerification(payload.timeline);
                break;
              case 'TIMELINE_RESTORE':
                setTimeline(payload.timeline);
                await runVerification(payload.timeline);
                break;
              case 'CHAT_MESSAGE':
                setMessages(prev => [...prev, payload]);
                break;
              case 'NESSUS_UPDATE':
                setNessusData(payload);
                break;
              case 'BOARD_DECISION_UPDATE':
                setBoardDecisions(payload);
                break;
              default:
                break;
            }
          } catch (err) {
            console.error('WS message handling error:', err);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [runVerification]);

  // Actions
  async function updateIncident(fields) {
    if (!token) return;
    const res = await fetch('/api/incident', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(fields)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setIncident(data.incident);
    return data.incident;
  }

  async function updateAssetStatus(assetId, status, notes = '') {
    if (!token) return;
    const res = await fetch(`/api/assets/${assetId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async function addTimelineNote(text, actionType = 'NOTE') {
    if (!token) return;
    const res = await fetch('/api/timeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text, actionType })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.item;
  }

  async function triggerTamperDemo() {
    if (!token) return;
    setIsTampering(true);
    try {
      const res = await fetch('/api/tamper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ seq: 4 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    } finally {
      setIsTampering(false);
    }
  }

  async function restoreIntegrity() {
    if (!token) return;
    setIsTampering(true);
    try {
      const res = await fetch('/api/tamper/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    } finally {
      setIsTampering(false);
    }
  }

  async function sendChatMessage(text) {
    if (!token) return;
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.message;
  }

  async function toggleBoardDecision(id, approved) {
    if (!token) return;
    const res = await fetch(`/api/board-brief/decisions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ approved })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setBoardDecisions(data.decisions);
  }

  async function loadSampleNessus() {
    if (!token) return;
    const res = await fetch('/api/nessus/load-sample', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setNessusData(data.nessus);
    return data.nessus;
  }

  async function uploadNessus(file) {
    if (!token) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/nessus/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setNessusData(data.nessus);
    return data.nessus;
  }

  // Live Metrics Calculations
  const metrics = {
    total: assets.length,
    clean: assets.filter(a => a.status === 'clean').length,
    suspected: assets.filter(a => a.status === 'suspected').length,
    encrypted: assets.filter(a => a.status === 'encrypted').length,
    exfiltrated: assets.filter(a => a.status === 'exfiltrated').length,
    recovered: assets.filter(a => a.status === 'recovered').length,
    phiCompromised: assets.filter(a => (a.status === 'encrypted' || a.status === 'exfiltrated') && a.dataClass === 'PHI').length,
    crownJewelsAtRisk: assets.filter(a => (a.status === 'suspected' || a.status === 'encrypted' || a.status === 'exfiltrated') && a.dataClass === 'Crown Jewels').length
  };

  return (
    <IncidentContext.Provider value={{
      incident,
      assets,
      timeline,
      messages,
      nessusData,
      boardDecisions,
      integrity,
      metrics,
      postureMode,
      setPostureMode,
      wsConnected,
      loading,
      isTampering,
      updateIncident,
      updateAssetStatus,
      addTimelineNote,
      triggerTamperDemo,
      restoreIntegrity,
      sendChatMessage,
      toggleBoardDecision,
      loadSampleNessus,
      uploadNessus,
      refreshData: fetchData
    }}>
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncident() {
  const context = useContext(IncidentContext);
  if (!context) throw new Error('useIncident must be used within IncidentProvider');
  return context;
}
