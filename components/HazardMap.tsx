
import React, { useEffect, useRef } from 'react';
import { Hazard, HazardStatus, HazardType, Severity } from '../types';
import { HAZARD_ICONS, SEVERITY_COLORS } from '../constants';

interface HazardMapProps {
  center: { lat: number; lng: number };
  hazards: Hazard[];
  onMapClick: (lat: number, lng: number) => void;
  onHazardClick: (hazard: Hazard) => void;
  showHeatmap?: boolean;
}

export const HazardMap: React.FC<HazardMapProps> = ({ center, hazards, onMapClick, onHazardClick, showHeatmap = false }) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    // Initialize Leaflet Map
    if (mapContainerRef.current && !mapRef.current) {
      // @ts-ignore
      const L = window.L;
      if (!L) return;

      const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      map.on('click', (e: any) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
    }
  }, []); 

  // Handle Center Updates
  useEffect(() => {
    if (!mapRef.current) return;
    // @ts-ignore
    const L = window.L;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([center.lat, center.lng]);
    } else {
      const userIconHtml = `
        <div class="relative flex h-4 w-4">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-lg"></span>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userIconHtml,
        className: 'user-location-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      userMarkerRef.current = L.marker([center.lat, center.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(mapRef.current)
        .bindPopup("You are here");
    }

    if (firstLoadRef.current) {
      mapRef.current.setView([center.lat, center.lng], 15);
      firstLoadRef.current = false;
    }
  }, [center]);

  // Update Hazard Markers
  useEffect(() => {
    if (!mapRef.current) return;
    // @ts-ignore
    const L = window.L;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    hazards.forEach(hazard => {
      // Skip resolved hazards on the main map unless required (can implement filter later)
      // For now, let's just make resolved hazards semi-transparent gray
      const isResolved = hazard.status === HazardStatus.RESOLVED;
      const isSensor = hazard.source === 'SENSOR';
      
      // SAFEGUARD: Ensure we have a valid color class, default to MEDIUM if invalid/undefined
      const severityKey = hazard.severity && SEVERITY_COLORS[hazard.severity] ? hazard.severity : Severity.MEDIUM;
      const colorString = SEVERITY_COLORS[severityKey] || 'bg-orange-500 text-white';
      
      let colorClass = colorString.split(' ')[0].replace('bg-', '');
      let markerColor = '#3b82f6';
      
      if (isResolved) {
        markerColor = '#94a3b8'; // Slate 400
      } else {
        if (colorClass.includes('yellow')) markerColor = '#facc15';
        if (colorClass.includes('orange')) markerColor = '#f97316';
        if (colorClass.includes('red')) markerColor = '#dc2626';
        if (colorClass.includes('purple')) markerColor = '#7e22ce';
      }

      // Visual distinction for Sensor data
      const borderStyle = isSensor ? 'border: 2px dashed white;' : 'border: 2px solid white;';
      const iconClass = HAZARD_ICONS[hazard.type] || 'fa-exclamation-circle';

      const iconHtml = `
        <div style="background-color: ${markerColor}; width: ${showHeatmap ? '40px' : '32px'}; height: ${showHeatmap ? '40px' : '32px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; ${borderStyle} box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: all 0.2s; opacity: ${showHeatmap ? '0.6' : '1'}; filter: ${showHeatmap ? 'blur(2px)' : 'none'}">
          ${!showHeatmap ? `<i class="fas ${iconClass}" style="color: white; font-size: 14px;"></i>` : ''}
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon group',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([hazard.latitude, hazard.longitude], { icon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div class="font-sans min-w-[150px]">
             <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${isResolved ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600'}">${hazard.status}</span>
                ${isSensor ? '<span class="text-[10px] bg-indigo-50 text-indigo-600 px-1 rounded border border-indigo-100"><i class="fas fa-robot"></i> IoT</span>' : ''}
             </div>
            <h3 class="font-bold text-sm mb-1">${hazard.type}</h3>
            <p class="text-xs text-slate-600 mb-2">${hazard.description}</p>
            <div class="flex justify-between items-center text-xs text-slate-400">
               <span>${hazard.severity || 'UNKNOWN'}</span>
               <span><i class="fas fa-arrow-up"></i> ${hazard.upvotes}</span>
            </div>
          </div>
        `);
      
      marker.on('click', () => onHazardClick(hazard));
      markersRef.current.push(marker);
    });

  }, [hazards, showHeatmap]);

  return <div ref={mapContainerRef} className="w-full h-full z-0" />;
};
