import React, { useState } from 'react';
import { HazardType, Severity } from '../types';
import { HAZARD_LABELS } from '../constants';

interface AddHazardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: HazardType; severity: Severity; description: string }) => void;
}

export const AddHazardModal: React.FC<AddHazardModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState<HazardType>(HazardType.POTHOLE);
  const [severity, setSeverity] = useState<Severity>(Severity.MEDIUM);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-slide-up sm:animate-fade-in">
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold">Report Hazard</h2>
          <button onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hazard Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(HazardType).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`p-2 text-xs rounded-lg border ${type === t ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600'}`}
                >
                  {HAZARD_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
            <select 
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {Object.values(Severity).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Deep pothole right after the speed breaker..."
              className="w-full p-2 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => {
              onSubmit({ type, severity, description });
              onClose();
              setDescription('');
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
};