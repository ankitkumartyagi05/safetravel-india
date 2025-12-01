
import { Hazard, HazardType, Severity, HazardStatus } from '../types';
import { INITIAL_CENTER, MOCK_USER } from '../constants';

export const generateMockHazards = (centerLat: number = INITIAL_CENTER.lat, centerLng: number = INITIAL_CENTER.lng): Hazard[] => {
  const hazards: Hazard[] = [
    {
      id: 'h1',
      type: HazardType.POTHOLE,
      severity: Severity.MEDIUM,
      status: HazardStatus.VERIFIED,
      latitude: centerLat + 0.002,
      longitude: centerLng - 0.003,
      description: 'Deep pothole on the left lane near the signal.',
      reportedAt: Date.now() - 3600000,
      upvotes: 12,
      verified: true,
      reporterName: 'Priya S.',
      reporterId: 'u2',
      source: 'USER'
    },
    {
      id: 'h2',
      type: HazardType.ACCIDENT,
      severity: Severity.CRITICAL,
      status: HazardStatus.OPEN,
      latitude: centerLat - 0.004,
      longitude: centerLng + 0.002,
      description: 'Two cars collided, blocking the main junction.',
      reportedAt: Date.now() - 1800000,
      upvotes: 45,
      verified: true,
      reporterName: 'Rahul M.',
      reporterId: 'u3',
      source: 'USER'
    },
    {
      id: 'h3',
      type: HazardType.WATERLOGGING,
      severity: Severity.HIGH,
      status: HazardStatus.OPEN,
      latitude: centerLat + 0.005,
      longitude: centerLng + 0.005,
      description: 'Knee-deep water due to burst pipe.',
      reportedAt: Date.now() - 7200000,
      upvotes: 2,
      verified: false,
      reporterName: 'Amit K.',
      reporterId: 'u4',
      source: 'USER'
    },
    {
      id: 'h4',
      type: HazardType.CONSTRUCTION,
      severity: Severity.LOW,
      status: HazardStatus.RESOLVED,
      latitude: centerLat - 0.001,
      longitude: centerLng - 0.008,
      description: 'Metro work ongoing, lane narrowing.',
      reportedAt: Date.now() - 86400000,
      upvotes: 150,
      verified: true,
      reporterName: 'SafeCity Official',
      reporterId: 'admin1',
      source: 'AUTHORITY'
    },
    {
      id: 'h5',
      type: HazardType.DEBRIS,
      severity: Severity.MEDIUM,
      status: HazardStatus.OPEN,
      latitude: centerLat + 0.001,
      longitude: centerLng + 0.001,
      description: 'Fallen tree branch on road.',
      reportedAt: Date.now() - 100000,
      upvotes: 1,
      verified: false,
      reporterName: MOCK_USER.name,
      reporterId: MOCK_USER.id,
      source: 'USER'
    }
  ];
  return hazards;
};
