
export enum HazardType {
  POTHOLE = 'POTHOLE',
  ACCIDENT = 'ACCIDENT',
  DEBRIS = 'DEBRIS',
  CONSTRUCTION = 'CONSTRUCTION',
  WATERLOGGING = 'WATERLOGGING',
  OTHER = 'OTHER'
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum HazardStatus {
  OPEN = 'OPEN',
  VERIFIED = 'VERIFIED',
  RESOLVED = 'RESOLVED'
}

export interface Hazard {
  id: string;
  type: HazardType;
  severity: Severity;
  status: HazardStatus;
  latitude: number;
  longitude: number;
  description: string;
  reportedAt: number; // timestamp
  upvotes: number;
  verified: boolean;
  reporterName?: string;
  reporterId?: string; // To track "My Reports"
  source?: 'USER' | 'SENSOR' | 'AUTHORITY'; // To track origin
}

export interface User {
  id: string;
  name: string;
  points: number;
  rank: string;
  role: 'USER' | 'ADMIN';
}

export interface MapViewState {
  latitude: number;
  longitude: number;
  zoom: number;
}
