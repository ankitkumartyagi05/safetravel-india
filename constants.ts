import { HazardType, Severity } from './types';

export const INITIAL_CENTER = {
  lat: 19.0760, // Mumbai
  lng: 72.8777
};

export const MOCK_USER = {
  id: 'u1',
  name: 'Arjun Kumar',
  points: 1250,
  rank: 'Road Guardian'
};

export const HAZARD_LABELS: Record<HazardType, string> = {
  [HazardType.POTHOLE]: 'Pothole',
  [HazardType.ACCIDENT]: 'Accident',
  [HazardType.DEBRIS]: 'Debris',
  [HazardType.CONSTRUCTION]: 'Construction',
  [HazardType.WATERLOGGING]: 'Water Logging',
  [HazardType.OTHER]: 'Other Hazard'
};

export const HAZARD_ICONS: Record<HazardType, string> = {
  [HazardType.POTHOLE]: 'fa-road-spikes',
  [HazardType.ACCIDENT]: 'fa-car-burst',
  [HazardType.DEBRIS]: 'fa-trash-can',
  [HazardType.CONSTRUCTION]: 'fa-trowel-bricks',
  [HazardType.WATERLOGGING]: 'fa-water',
  [HazardType.OTHER]: 'fa-triangle-exclamation'
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  [Severity.LOW]: 'bg-yellow-400 text-yellow-900',
  [Severity.MEDIUM]: 'bg-orange-500 text-white',
  [Severity.HIGH]: 'bg-red-600 text-white',
  [Severity.CRITICAL]: 'bg-purple-700 text-white'
};