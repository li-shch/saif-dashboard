// src/api/client.ts
import type { SimulationParams } from "../App";

// --- Enums and Types for Rich Data ---
export const AssetStatus = {
  Available: 'available',
  InUse: 'in_use',
  NeedsInspection: 'needs_inspection',
  RentedFromCompetitor: 'rented_from_competitor',
} as const;

export type AssetStatus = typeof AssetStatus[keyof typeof AssetStatus];

export interface Asset {
  id: string;
  type: string;
  status: AssetStatus;
  location: { lat: number; lng: number };
  health_score?: number; // Representing Asset Health Model output
}

export interface OptimizationDecision {
  assetId: string;
  decision: 'STAY_ON_SITE' | 'RETRIEVE_TO_DEPOT' | 'EXECUTE_SWAP' | 'SCHEDULE_INSPECTION';
  reason: string;
  relatedAssetId?: string;
}

export interface OptimizationResult {
  decisionsMade: OptimizationDecision[];
  optimizedRoutes: {
    vehicleId: string;
    route: { lat: number; lng: number }[];
  }[];
  summary: {
    costSaving: number;
    distanceSavingKm: number;
    emissionsSavingKgCO2: number;
  };
}

// --- Mock Data ---
const initialAssets: Asset[] = [
  // VMS Boards
  { id: 'SAIF-001', type: 'VMS_Board', status: AssetStatus.Available, location: { lat: -37.8136, lng: 144.9631 }, health_score: 95 },
  { id: 'SAIF-002', type: 'VMS_Board', status: AssetStatus.InUse, location: { lat: -37.8180, lng: 144.9580 }, health_score: 88 },
  { id: 'SAIF-003', type: 'VMS_Board', status: AssetStatus.Available, location: { lat: -37.8056, lng: 144.9731 }, health_score: 91 },
  
  // Light Towers
  { id: 'SAIF-004', type: 'Light_Tower', status: AssetStatus.Available, location: { lat: -37.8080, lng: 144.9780 }, health_score: 92 },
  { id: 'SAIF-005', type: 'Light_Tower', status: AssetStatus.InUse, location: { lat: -37.8220, lng: 144.9550 }, health_score: 76 },
  { id: 'COMP-001', type: 'Light_Tower', status: AssetStatus.RentedFromCompetitor, location: { lat: -37.8095, lng: 144.9750 } },
  { id: 'COMP-002', type: 'Light_Tower', status: AssetStatus.RentedFromCompetitor, location: { lat: -37.8195, lng: 144.9680 } },
  
  // Barriers
  { id: 'SAIF-006', type: 'Barrier', status: AssetStatus.NeedsInspection, location: { lat: -37.8230, lng: 144.9670 }, health_score: 45 },
  { id: 'SAIF-007', type: 'Barrier', status: AssetStatus.Available, location: { lat: -37.8110, lng: 144.9590 }, health_score: 89 },
  { id: 'SAIF-008', type: 'Barrier', status: AssetStatus.InUse, location: { lat: -37.8160, lng: 144.9720 }, health_score: 94 },
  
  // Generators
  { id: 'SAIF-009', type: 'Generator', status: AssetStatus.Available, location: { lat: -37.8070, lng: 144.9650 }, health_score: 87 },
  { id: 'SAIF-010', type: 'Generator', status: AssetStatus.NeedsInspection, location: { lat: -37.8200, lng: 144.9600 }, health_score: 52 },
  
  // Traffic Cones
  { id: 'SAIF-011', type: 'Traffic_Cones', status: AssetStatus.Available, location: { lat: -37.8120, lng: 144.9700 }, health_score: 98 },
  { id: 'SAIF-012', type: 'Traffic_Cones', status: AssetStatus.InUse, location: { lat: -37.8175, lng: 144.9640 }, health_score: 96 },
];

const depotLocation = { lat: -37.7950, lng: 144.9631 };
const newJobLocation = { lat: -37.8145, lng: 144.9820 };
const secondaryDepot = { lat: -37.8250, lng: 144.9500 };

// --- API Functions ---
export const getInitialState = async (): Promise<{ assets: Asset[] }> => {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network latency
  return { assets: initialAssets };
};

// 简单的TSP算法 - 最近邻算法
const optimizeRoute = (start: {lat: number, lng: number}, points: {lat: number, lng: number}[], end: {lat: number, lng: number}) => {
  const result = [start];
  const remaining = [...points];
  let current = start;
  
  // 计算两点之间的距离
  const distance = (a: {lat: number, lng: number}, b: {lat: number, lng: number}) => {
    return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2));
  };
  
  // 贪心算法：每次选择最近的点
  while (remaining.length > 0) {
    let minDist = Infinity;
    let minIndex = -1;
    
    for (let i = 0; i < remaining.length; i++) {
      const dist = distance(current, remaining[i]);
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
      }
    }
    
    current = remaining[minIndex];
    result.push(current);
    remaining.splice(minIndex, 1);
  }
  
  // 如果终点不同于起点，添加终点
  if (end.lat !== start.lat || end.lng !== start.lng) {
    result.push(end);
  }
  
  return result;
};

export const fetchOptimizationPlan = async (params: SimulationParams): Promise<OptimizationResult> => {
  console.log("向后端发送请求，参数为:", params);
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulate the multi-stage decision process based on inputs
  const decisionsMade: OptimizationDecision[] = [
    {
      assetId: 'SAIF-002',
      decision: 'STAY_ON_SITE',
      reason: `Low regional demand & Util. Rate at ${params.utilizationRate}%. Cheaper to leave on site.`
    },
    {
      assetId: 'SAIF-004',
      decision: 'EXECUTE_SWAP',
      reason: `High competitor rental cost vs. swap cost. Saving calculated over ${params.hireDuration} days.`,
      relatedAssetId: 'COMP-001',
    },
    {
      assetId: 'SAIF-005',
      decision: 'RETRIEVE_TO_DEPOT',
      reason: 'Low utilization expected. Better to redeploy elsewhere.',
    },
    {
      assetId: 'SAIF-006',
      decision: 'SCHEDULE_INSPECTION',
      reason: 'Asset health score (45) is below threshold. Retrieving for maintenance.',
    },
    {
      assetId: 'SAIF-010',
      decision: 'SCHEDULE_INSPECTION',
      reason: 'Generator health score (52) requires immediate attention.',
    },
    {
      assetId: 'COMP-002',
      decision: 'EXECUTE_SWAP',
      reason: `Replace with SAIF-007 to reduce competitor dependency. ROI positive after ${Math.floor(params.hireDuration * 0.7)} days.`,
      relatedAssetId: 'SAIF-007',
    }
  ];

  // 使用优化算法计算最佳路径
  const truckAPoints = [
    { lat: -37.8080, lng: 144.9780 }, // SAIF-004
    { lat: -37.8095, lng: 144.9750 }, // COMP-001
  ];
  
  const truckBPoints = [
    { lat: -37.8230, lng: 144.9670 }, // SAIF-006
    { lat: -37.8200, lng: 144.9600 }, // SAIF-010
  ];
  
  const truckCPoints = [
    { lat: -37.8220, lng: 144.9550 }, // SAIF-005
    { lat: -37.8110, lng: 144.9590 }, // SAIF-007
    { lat: -37.8195, lng: 144.9680 }, // COMP-002
  ];
  
  const truckDPoints = [
    { lat: -37.8056, lng: 144.9731 }, // SAIF-003
    { lat: -37.8070, lng: 144.9650 }, // SAIF-009
    { lat: -37.8120, lng: 144.9700 }, // SAIF-011
  ];

  const mockResponse: OptimizationResult = {
    decisionsMade,
    optimizedRoutes: [
      {
        vehicleId: "Truck-A",
        route: optimizeRoute(depotLocation, truckAPoints, depotLocation)
      },
      {
        vehicleId: "Truck-B", 
        route: optimizeRoute(depotLocation, truckBPoints, secondaryDepot)
      },
      {
        vehicleId: "Truck-C",
        route: optimizeRoute(depotLocation, truckCPoints, depotLocation)
      },
      {
        vehicleId: "Truck-D",
        route: optimizeRoute(depotLocation, truckDPoints, newJobLocation)
      }
    ],
    summary: {
      costSaving: 1425.80,
      distanceSavingKm: 67.3,
      emissionsSavingKgCO2: 15.2,
    }
  };

  console.log("从后端接收到响应:", mockResponse);
  return mockResponse;
};
