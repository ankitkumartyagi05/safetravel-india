
import React, { useState, useEffect, useCallback } from 'react';
import { HazardMap } from './components/HazardMap';
import { AddHazardModal } from './components/AddHazardModal';
import { VoiceIndicator } from './components/VoiceIndicator';
import { AdminView } from './components/AdminView';
import { Hazard, HazardType, Severity, HazardStatus } from './types';
import { generateMockHazards } from './services/mockDataService';
import { GeminiLiveService } from './services/liveService';
import { INITIAL_CENTER, MOCK_USER, HAZARD_ICONS } from './constants';

export default function App() {
  const [userLocation, setUserLocation] = useState(INITIAL_CENTER);
  const [hasLocation, setHasLocation] = useState(false);
  
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // App State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'FEED' | 'MINE'>('FEED');
  const [hazardFilter, setHazardFilter] = useState<'ALL' | HazardType>('ALL');

  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [liveService] = useState(() => new GeminiLiveService(process.env.API_KEY || ''));

  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'alert' | 'info' } | null>(null);

  // Initialize Data
  useEffect(() => {
    setHazards(generateMockHazards(INITIAL_CENTER.lat, INITIAL_CENTER.lng));
  }, []);

  // Geolocation Setup
  useEffect(() => {
    if (!navigator.geolocation) {
      showNotification("Geolocation is not supported by your browser", 'alert');
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const newLoc = { lat: latitude, lng: longitude };
      setUserLocation(newLoc);
      
      if (!hasLocation) {
        setHasLocation(true);
        setHazards(generateMockHazards(latitude, longitude));
        showNotification("Location found! Hazards updated.", 'success');
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn("Geolocation warning:", error.message);
      
      let friendlyMsg = "Could not pinpoint location.";
      if (error.code === error.PERMISSION_DENIED) friendlyMsg = "Location denied. Using default map.";
      if (error.code === error.POSITION_UNAVAILABLE) friendlyMsg = "GPS unavailable. Using default map.";
      if (error.code === error.TIMEOUT) friendlyMsg = "GPS timeout. Using default map.";
      
      if (!hasLocation) {
        showNotification(friendlyMsg, 'alert');
      }
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, { timeout: 10000 });

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [hasLocation]);

  // Proximity Alert Simulation (Route Assist)
  useEffect(() => {
    if (!hasLocation) return;
    
    // Check if user is very close to a CRITICAL or HIGH hazard (e.g., 100 meters)
    const criticalHazards = hazards.filter(h => 
      (h.severity === Severity.CRITICAL || h.severity === Severity.HIGH) && 
      h.status !== HazardStatus.RESOLVED
    );

    const nearby = criticalHazards.find(h => {
      const dLat = Math.abs(h.latitude - userLocation.lat);
      const dLng = Math.abs(h.longitude - userLocation.lng);
      // Rough approximation: 0.001 deg is approx 111 meters
      return dLat < 0.001 && dLng < 0.001;
    });

    if (nearby) {
       showNotification(`⚠️ CAUTION: ${nearby.type} reported nearby!`, 'alert');
    }
  }, [userLocation, hazards, hasLocation]);

  const handleMapClick = (lat: number, lng: number) => {
    setTempLocation({ lat, lng });
    setIsModalOpen(true);
  };

  const handleAddHazard = (data: { type: HazardType; severity: Severity; description: string }) => {
    const newHazard: Hazard = {
      id: Math.random().toString(36).substr(2, 9),
      latitude: tempLocation ? tempLocation.lat : userLocation.lat,
      longitude: tempLocation ? tempLocation.lng : userLocation.lng,
      status: HazardStatus.OPEN,
      reportedAt: Date.now(),
      upvotes: 0,
      verified: false,
      reporterName: MOCK_USER.name,
      reporterId: MOCK_USER.id,
      source: 'USER',
      ...data
    };

    setHazards(prev => [newHazard, ...prev]);
    showNotification('Hazard reported! +50 Points', 'success');
  };

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHazards(prev => prev.map(h => {
      if (h.id === id) {
        return { ...h, upvotes: h.upvotes + 1, verified: h.upvotes + 1 >= 3 };
      }
      return h;
    }));
    showNotification('Upvoted! Helping verify data.', 'info');
  };

  const handleResolve = (id: string) => {
    setHazards(prev => prev.map(h => 
      h.id === id ? { ...h, status: HazardStatus.RESOLVED } : h
    ));
    showNotification('Hazard marked as Resolved.', 'success');
  };

  const handleVerify = (id: string) => {
    setHazards(prev => prev.map(h => 
      h.id === id ? { ...h, status: HazardStatus.VERIFIED, verified: true } : h
    ));
    showNotification('Report Verified.', 'success');
  };

  const simulateSensorReport = () => {
    const types = [HazardType.POTHOLE, HazardType.DEBRIS, HazardType.WATERLOGGING];
    const rndType = types[Math.floor(Math.random() * types.length)];
    const offsetLat = (Math.random() - 0.5) * 0.01;
    const offsetLng = (Math.random() - 0.5) * 0.01;
    
    const newHazard: Hazard = {
      id: `sensor-${Date.now()}`,
      latitude: userLocation.lat + offsetLat,
      longitude: userLocation.lng + offsetLng,
      type: rndType,
      severity: Severity.MEDIUM,
      status: HazardStatus.OPEN,
      description: `Automated detection: Anomaly detected by fleet sensor #402`,
      reportedAt: Date.now(),
      upvotes: 0,
      verified: false,
      reporterName: 'IoT System',
      source: 'SENSOR'
    };
    
    setHazards(prev => [newHazard, ...prev]);
    showNotification('New Hazard Detected by Smart Sensors', 'info');
  };

  const handleImportSensors = (data: any[]) => {
    const newHazards: Hazard[] = data.map((item, index) => ({
      id: `csv-${Date.now()}-${index}`,
      latitude: item.latitude,
      longitude: item.longitude,
      type: item.type as HazardType,
      severity: item.severity as Severity,
      description: item.description,
      status: HazardStatus.VERIFIED,
      reportedAt: Date.now(),
      upvotes: 0,
      verified: true,
      reporterName: 'IoT Batch Import',
      source: 'SENSOR'
    }));

    setHazards(prev => [...newHazards, ...prev]);
    showNotification(`Successfully imported ${newHazards.length} sensor reports`, 'success');
  };

  const showNotification = (message: string, type: 'success' | 'alert' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Gemini Live Handlers
  const handleToolCall = async (name: string, args: any) => {
    console.log(`Tool Called: ${name}`, args);
    if (name === 'reportHazard') {
      const newHazard: Hazard = {
        id: Math.random().toString(36).substr(2, 9),
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        type: (args.type as HazardType) || HazardType.OTHER,
        severity: (args.severity as Severity) || Severity.MEDIUM,
        status: HazardStatus.OPEN,
        description: args.description || 'Reported via Voice Assistant',
        reportedAt: Date.now(),
        upvotes: 0,
        verified: false,
        reporterName: 'Voice Assistant',
        source: 'USER'
      };
      setHazards(prev => [newHazard, ...prev]);
      showNotification(`Voice Report: ${newHazard.type} added`, 'success');
      return { result: "Hazard reported successfully." };
    }
    if (name === 'getHazardsNearby') {
      const nearby = hazards
        .filter(h => h.status !== HazardStatus.RESOLVED)
        .slice(0, 5)
        .map(h => ({ type: h.type, severity: h.severity, description: h.description }));
      return { hazards: nearby.length ? nearby : "No hazards nearby." };
    }
    return { error: "Unknown tool" };
  };

  const toggleVoice = useCallback(async () => {
    if (isVoiceActive) {
      await liveService.disconnect();
      setIsVoiceActive(false);
      setVoiceStatus('disconnected');
    } else {
      setVoiceStatus('connecting');
      try {
        await liveService.connect(handleToolCall, (status) => {
          setVoiceStatus(status);
          if (status === 'connected') setIsVoiceActive(true);
          else if (status !== 'connecting') setIsVoiceActive(false);
        });
      } catch (e) {
        setVoiceStatus('error');
        showNotification('Failed to connect to Voice Service', 'alert');
      }
    }
  }, [isVoiceActive, liveService]);

  // Filtering Logic
  const visibleHazards = hazards.filter(h => {
    if (hazardFilter !== 'ALL' && h.type !== hazardFilter) return false;
    if (activeTab === 'MINE' && h.reporterId !== MOCK_USER.id) return false;
    if (activeTab === 'FEED' && h.status === HazardStatus.RESOLVED) return false;
    return true;
  });

  return (
    <div className="flex h-screen w-full relative overflow-hidden">
      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-96 bg-white border-r border-slate-200 z-10 shadow-lg relative">
        <div className="p-6 bg-gradient-to-r from-[#0F3443] to-[#34E89E] text-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              <i className="fas fa-shield-halved mr-3 text-emerald-300"></i>
              SafeTravel
            </h1>
            <button 
              onClick={() => setIsAdminMode(true)}
              className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white font-medium transition border border-white/10"
            >
              DASHBOARD
            </button>
          </div>
          <p className="text-emerald-50 text-xs opacity-90 leading-relaxed">
            Community-driven road safety. Report hazards, get alerts, save lives.
          </p>
        </div>
        
        {/* User Stats */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white">
              {MOCK_USER.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-800">{MOCK_USER.name}</p>
              <div className="flex items-center text-xs text-slate-500 font-medium mt-0.5">
                <i className="fas fa-crown text-amber-500 mr-1.5"></i>
                {MOCK_USER.rank}
              </div>
            </div>
          </div>
          <div className="text-right">
             <span className="block text-xl font-bold text-indigo-600">{MOCK_USER.points}</span>
             <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Points</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white">
          <button 
            onClick={() => setActiveTab('FEED')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition ${activeTab === 'FEED' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Live Feed
          </button>
          <button 
            onClick={() => setActiveTab('MINE')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition ${activeTab === 'MINE' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Reports
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setHazardFilter('ALL')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${hazardFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>All</button>
          <button onClick={() => setHazardFilter(HazardType.ACCIDENT)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${hazardFilter === HazardType.ACCIDENT ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Accidents</button>
          <button onClick={() => setHazardFilter(HazardType.POTHOLE)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${hazardFilter === HazardType.POTHOLE ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Potholes</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {visibleHazards.length === 0 && (
             <div className="text-center py-10 opacity-50">
                <i className="fas fa-check-circle text-4xl text-slate-300 mb-2"></i>
                <p className="text-sm">No hazards to show.</p>
             </div>
          )}
          {visibleHazards.map(h => (
            <div key={h.id} onClick={() => setTempLocation({lat: h.latitude, lng: h.longitude})} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer group hover:border-indigo-200 relative overflow-hidden">
               {/* Status Stripe */}
               {h.status === HazardStatus.VERIFIED && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
               {h.source === 'SENSOR' && <div className="absolute top-0 right-0 p-1"><i className="fas fa-wifi text-indigo-300 text-xs"></i></div>}

              <div className="flex justify-between items-start mb-2 pl-2">
                <div className="flex items-center space-x-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${h.severity === Severity.CRITICAL ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                    <i className={`fas ${HAZARD_ICONS[h.type]}`}></i>
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-slate-800">{h.type}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {h.source === 'SENSOR' ? 'Automated Detection' : h.reporterName}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      h.severity === Severity.CRITICAL ? 'bg-red-50 text-red-600 border-red-100' : 
                      h.severity === Severity.HIGH ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                      'bg-green-50 text-green-600 border-green-100'
                    }`}>
                      {h.severity}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-3 pl-2">{h.description}</p>
              <div className="flex items-center justify-between text-xs border-t border-slate-50 pt-3 pl-2">
                <div className="flex space-x-4 text-slate-400">
                  <button onClick={(e) => handleUpvote(h.id, e)} className="flex items-center hover:text-green-600 transition group/btn">
                    <i className="fas fa-arrow-up mr-1.5 group-hover/btn:scale-125 transition-transform"></i> 
                    <span className="font-medium">{h.upvotes}</span>
                  </button>
                  <span className="flex items-center hover:text-red-500 transition cursor-not-allowed opacity-50"><i className="fas fa-arrow-down mr-1.5"></i></span>
                </div>
                {h.status === HazardStatus.VERIFIED && (
                  <span className="flex items-center text-blue-500 font-bold"><i className="fas fa-check-circle mr-1.5"></i> Verified</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* --- Main Map Area --- */}
      <main className="flex-1 relative bg-slate-100 h-full w-full">
        <HazardMap 
          center={userLocation}
          hazards={visibleHazards} // Filter map as well
          onMapClick={handleMapClick}
          onHazardClick={(h) => console.log('Clicked', h)}
          showHeatmap={isAdminMode} // Just a prop to trigger styles
        />

        {/* Mobile Header Overlay */}
        <div className="absolute top-4 left-4 right-4 md:hidden z-[1000]">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-xl flex justify-between items-center ring-1 ring-black/5">
            <h1 className="font-bold text-slate-800 flex items-center text-lg">
              <i className="fas fa-shield-halved mr-2 text-[#34E89E]"></i>
              SafeTravel
            </h1>
            <div className="flex items-center space-x-3">
               <button onClick={() => setIsAdminMode(true)} className="w-8 h-8 bg-slate-800 rounded-full text-white flex items-center justify-center shadow-lg">
                  <i className="fas fa-building-columns text-xs"></i>
               </button>
            </div>
          </div>
        </div>

        {/* Legend / Stats (Floating on Desktop) */}
        {!isAdminMode && (
          <div className="hidden md:block absolute top-6 right-6 z-[1000] bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl w-72 ring-1 ring-black/5 animate-fade-in">
             <h4 className="font-bold text-slate-700 mb-4 text-sm flex items-center justify-between">
               <span className="flex items-center"><i className="fas fa-chart-pie mr-2 text-indigo-500"></i> Area Status</span>
               <span className="text-[10px] text-green-500 font-medium bg-green-50 px-2 py-0.5 rounded-full">● Live</span>
             </h4>
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-xl text-center border border-red-200 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-red-500 tracking-wider mb-1">Critical</p>
                  <p className="font-bold text-red-700 text-3xl">
                    {hazards.filter(h => h.severity === Severity.CRITICAL && h.status !== HazardStatus.RESOLVED).length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl text-center border border-slate-200 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Active</p>
                  <p className="font-bold text-slate-700 text-3xl">
                    {hazards.filter(h => h.status !== HazardStatus.RESOLVED).length}
                  </p>
                </div>
             </div>
             <div className="mt-4 pt-4 border-t border-slate-100">
               <p className="text-xs text-slate-400 font-medium flex items-center">
                 <i className="fas fa-location-dot mr-2 text-slate-300"></i>
                 {hasLocation ? "Locating you..." : "Mumbai, India (Default)"}
               </p>
             </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className={`absolute top-24 md:top-20 left-1/2 transform -translate-x-1/2 z-[2000] px-6 py-3 rounded-full shadow-2xl animate-bounce-in text-white font-medium flex items-center space-x-3 whitespace-nowrap border-2 border-white/20 backdrop-blur-md ${
            notification.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 
            notification.type === 'info' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
            'bg-gradient-to-r from-[#FF512F] to-[#F09819]'
          }`}>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <i className={`fas ${notification.type === 'success' ? 'fa-check' : notification.type === 'info' ? 'fa-info' : 'fa-bell'} text-sm`}></i>
            </div>
            <span>{notification.message}</span>
          </div>
        )}

        {/* Manual Report FAB */}
        <button 
          onClick={() => {
            setTempLocation(userLocation);
            setIsModalOpen(true);
          }}
          className="fixed bottom-8 right-6 md:right-8 md:bottom-8 z-[1000] bg-gradient-to-r from-[#FF512F] to-[#F09819] text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group ring-4 ring-orange-200/50"
        >
          <i className="fas fa-plus text-xl md:text-2xl group-hover:rotate-90 transition-transform duration-300 drop-shadow-md"></i>
        </button>

        {/* Voice Assistant FAB */}
        <VoiceIndicator 
          active={isVoiceActive} 
          status={voiceStatus} 
          onClick={toggleVoice} 
        />
        
        {/* Help Tip */}
        {!isVoiceActive && !isModalOpen && !isAdminMode && (
          <div className="fixed bottom-28 right-8 z-[900] bg-slate-800/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-lg hidden md:block shadow-lg animate-fade-in border border-slate-700">
            Press <i className="fas fa-microphone mx-1"></i> to report hazards
          </div>
        )}
      </main>

      {/* Admin Dashboard Overlay */}
      {isAdminMode && (
        <AdminView 
          hazards={hazards}
          onClose={() => setIsAdminMode(false)}
          onResolve={handleResolve}
          onVerify={handleVerify}
          onSimulateSensor={simulateSensorReport}
          onImportSensors={handleImportSensors}
        />
      )}

      {/* Modals */}
      <AddHazardModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddHazard}
      />
    </div>
  );
}
