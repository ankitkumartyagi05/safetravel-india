
import React, { useState, useRef } from 'react';
import { Hazard, HazardStatus, Severity, HazardType } from '../types';
import { HAZARD_ICONS } from '../constants';

interface AdminViewProps {
  hazards: Hazard[];
  onClose: () => void;
  onVerify: (id: string) => void;
  onResolve: (id: string) => void;
  onSimulateSensor: () => void;
  onImportSensors: (data: any[]) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
  hazards, 
  onClose, 
  onVerify, 
  onResolve, 
  onSimulateSensor,
  onImportSensors 
}) => {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredHazards = hazards.filter(h => {
    if (filter === 'ALL') return true;
    return h.status === filter;
  });

  const stats = {
    total: hazards.length,
    critical: hazards.filter(h => h.severity === Severity.CRITICAL).length,
    resolved: hazards.filter(h => h.status === HazardStatus.RESOLVED).length,
    open: hazards.filter(h => h.status === HazardStatus.OPEN || h.status === HazardStatus.VERIFIED).length
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      // Skip header (index 0) and parse the rest
      const parsedData = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // CSV format: latitude,longitude,type,severity,description
        const cols = line.split(',');
        if (cols.length >= 5) {
          const rawType = cols[2].trim().toUpperCase();
          const rawSeverity = cols[3].trim().toUpperCase();

          // Validate Type and Severity to avoid undefined UI errors
          const type = Object.values(HazardType).includes(rawType as HazardType) ? rawType : HazardType.OTHER;
          const severity = Object.values(Severity).includes(rawSeverity as Severity) ? rawSeverity : Severity.MEDIUM;

          parsedData.push({
            latitude: parseFloat(cols[0]),
            longitude: parseFloat(cols[1]),
            type: type,
            severity: severity,
            description: cols.slice(4).join(',').trim() // Join back just in case description had commas
          });
        }
      }
      
      if (parsedData.length > 0) {
        onImportSensors(parsedData);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-100 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-[#0F3443] text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <i className="fas fa-building-columns text-emerald-400"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg">SafeCity Authority Dashboard</h1>
            <p className="text-xs text-slate-300">Municipal Road Maintenance & Moderation Portal</p>
          </div>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition">
          Exit Dashboard
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar Stats */}
        <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden md:block overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Analytics Overview</h2>
          
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-indigo-600 text-xs font-bold uppercase">Total Reports</p>
              <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-red-600 text-xs font-bold uppercase">Critical / High</p>
              <p className="text-3xl font-bold text-slate-800">{stats.critical}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-emerald-600 text-xs font-bold uppercase">Resolved</p>
              <p className="text-3xl font-bold text-slate-800">{stats.resolved}</p>
            </div>
          </div>

          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Tools</h2>
          
          <button 
            onClick={onSimulateSensor}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center mb-3"
          >
            <i className="fas fa-robot mr-2"></i> Simulate Single
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".csv"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition flex items-center justify-center mb-3"
          >
            <i className="fas fa-file-csv mr-2 text-green-600"></i> Import Sensor CSV
          </button>

          <div className="text-xs text-slate-500 text-center">
             CSV Format: <br/> lat, lng, type, severity, desc
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {/* Filters */}
          <div className="p-4 bg-white border-b border-slate-200 flex space-x-2 overflow-x-auto">
            <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-full text-sm font-bold transition ${filter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>All Reports</button>
            <button onClick={() => setFilter('OPEN')} className={`px-4 py-2 rounded-full text-sm font-bold transition ${filter === 'OPEN' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Open / Pending</button>
            <button onClick={() => setFilter('RESOLVED')} className={`px-4 py-2 rounded-full text-sm font-bold transition ${filter === 'RESOLVED' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Resolved</button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Severity</th>
                    <th className="p-4 font-bold">Location / Desc</th>
                    <th className="p-4 font-bold text-center">Votes</th>
                    <th className="p-4 font-bold text-center">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHazards.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                             <i className={`fas ${HAZARD_ICONS[h.type] || 'fa-exclamation-triangle'}`}></i>
                          </span>
                          <span className="font-medium text-slate-700">{h.type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                           h.severity === Severity.CRITICAL ? 'bg-red-100 text-red-700' :
                           h.severity === Severity.HIGH ? 'bg-orange-100 text-orange-700' :
                           'bg-slate-100 text-slate-700'
                        }`}>
                          {h.severity}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-800 truncate max-w-xs">{h.description}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(h.reportedAt).toLocaleDateString()} • {h.source === 'SENSOR' ? 'Detected by IoT' : `Reported by ${h.reporterName || 'Unknown'}`}</p>
                      </td>
                      <td className="p-4 text-center font-medium text-slate-600">{h.upvotes}</td>
                      <td className="p-4 text-center">
                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                           h.status === HazardStatus.RESOLVED ? 'bg-green-100 text-green-700' :
                           h.status === HazardStatus.VERIFIED ? 'bg-blue-100 text-blue-700' :
                           'bg-yellow-100 text-yellow-700'
                         }`}>
                           {h.status === HazardStatus.RESOLVED && <i className="fas fa-check mr-1"></i>}
                           {h.status}
                         </span>
                      </td>
                      <td className="p-4 text-right">
                        {h.status !== HazardStatus.RESOLVED && (
                           <div className="flex justify-end space-x-2">
                             <button 
                               onClick={() => onVerify(h.id)}
                               disabled={h.status === HazardStatus.VERIFIED}
                               className={`p-2 rounded hover:bg-blue-50 text-blue-600 transition ${h.status === HazardStatus.VERIFIED ? 'opacity-50 cursor-not-allowed' : ''}`}
                               title="Verify Report"
                             >
                               <i className="fas fa-thumbs-up"></i>
                             </button>
                             <button 
                               onClick={() => onResolve(h.id)}
                               className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                             >
                               Resolve
                             </button>
                           </div>
                        )}
                        {h.status === HazardStatus.RESOLVED && (
                          <span className="text-xs text-slate-400 italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
