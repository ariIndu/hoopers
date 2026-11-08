import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IncidentProvider, useIncident } from './context/IncidentContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import UsersModal from './components/UsersModal';
import TamperModal from './components/TamperModal';

import HiveScreen from './screens/HiveScreen';
import IncidentScreen from './screens/IncidentScreen';
import ChatScreen from './screens/ChatScreen';
import NessusScreen from './screens/NessusScreen';
import BoardBriefScreen from './screens/BoardBriefScreen';

function MainLayout() {
  const [currentScreen, setCurrentScreen] = useState('hive');
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isTamperModalOpen, setIsTamperModalOpen] = useState(false);

  const { loading: authLoading } = useAuth();
  const { loading: dataLoading } = useIncident();

  if (authLoading || dataLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white text-slate-800">
        <div className="relative mb-4">
          <svg className="w-14 h-14 text-amber-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" stroke="#d97706" strokeWidth="1.5" fillOpacity="0.9" />
          </svg>
        </div>
        <h2 className="text-sm font-mono font-bold tracking-widest text-slate-900 uppercase">
          Beeswax Command Node
        </h2>
        <p className="text-xs font-mono text-slate-500 mt-1">
          Initializing standalone cryptographic audit chain...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white text-slate-900">
      
      {/* Top Command Navbar */}
      <Navbar 
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
        onOpenIncident={() => setCurrentScreen('incident')}
      />

      {/* Main Body: Sidebar + Active Screen */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        
        <Sidebar 
          currentScreen={currentScreen} 
          setScreen={setCurrentScreen} 
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
          {currentScreen === 'hive' && <HiveScreen />}
          {currentScreen === 'incident' && (
            <IncidentScreen onOpenTamperDetails={() => setIsTamperModalOpen(true)} />
          )}
          {currentScreen === 'chat' && <ChatScreen />}
          {currentScreen === 'nessus' && (
            <NessusScreen onNavigateToHive={() => setCurrentScreen('hive')} />
          )}
          {currentScreen === 'board-brief' && <BoardBriefScreen />}
        </main>

      </div>

      {/* Modals */}
      <UsersModal 
        isOpen={isUsersModalOpen} 
        onClose={() => setIsUsersModalOpen(false)} 
      />

      <TamperModal 
        isOpen={isTamperModalOpen} 
        onClose={() => setIsTamperModalOpen(false)} 
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <IncidentProvider>
        <MainLayout />
      </IncidentProvider>
    </AuthProvider>
  );
}
