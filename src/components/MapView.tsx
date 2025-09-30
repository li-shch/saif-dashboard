import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Marker } from 'mapbox-gl';
import type { OptimizationResult, Asset } from '../api/client';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// 扩展window对象类型
declare global {
  interface Window {
    truckMarkers?: mapboxgl.Marker[];
  }
}

interface MapViewProps {
  initialAssets: Asset[];
  optimizationResults: OptimizationResult | null;
  optimizationProgress?: any; // 实时优化进度
}

// --- Helper Functions & Constants ---
// 工地状态颜色映射
const STATUS_COLORS: Record<string, string> = {
  'pending_delivery': '#f59e0b',     // amber-500 - 等待送货
  'pending_collection': '#8b5cf6',   // violet-500 - 等待回收
  'active_operations': '#3b82f6',    // blue-500 - 有多个运输任务
  'deployed': '#22c55e',             // green-500 - 已部署稳定运行
  'competitor_rental': '#ef4444',    // red-500 - 竞争对手租赁
  
  // 兼容旧状态
  'available': '#f59e0b',
  'in_use': '#3b82f6',
  'needs_inspection': '#f97316',
  'rented_from_competitor': '#ef4444',
};

const ROUTE_COLORS = ['#16a34a', '#c026d3', '#db2777', '#0ea5e9', '#f59e0b', '#8b5cf6']; // green, fuchsia, pink, cyan, amber, violet

// --- Component ---
const MapView = ({ initialAssets, optimizationResults, optimizationProgress }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Marker[]>([]);

  // Effect 1: Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [144.9631, -37.8136],
      zoom: 12,
    });
  }, []);

  // Effect 2: Render Contract Sites (each site may contain multiple equipment)
  useEffect(() => {
    if (!map.current || initialAssets.length === 0) return;
    
    // Clear old markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Each asset represents a contract site with multiple equipment items
    // 如果同一位置有多个工地，只显示有任务的
    const uniqueLocations = new Map<string, Asset>();
    
    initialAssets.forEach(asset => {
      const key = `${asset.location.lat.toFixed(6)},${asset.location.lng.toFixed(6)}`;
      const existing = uniqueLocations.get(key);
      
      // 如果该位置已有工地，选择有任务的那个
      if (existing) {
        const assetHasTasks = asset.transport_tasks && asset.transport_tasks.length > 0;
        const existingHasTasks = existing.transport_tasks && existing.transport_tasks.length > 0;
        
        if (assetHasTasks && !existingHasTasks) {
          // 当前有任务，existing没有 → 替换
          uniqueLocations.set(key, asset);
          console.log(`📍 Same location: Replacing ${existing.id} (no tasks) with ${asset.id} (has tasks)`);
        }
      } else {
        uniqueLocations.set(key, asset);
      }
    });
    
    const assetsToDisplay = Array.from(uniqueLocations.values());
    
    assetsToDisplay.forEach(asset => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = STATUS_COLORS[asset.status] || '#64748b';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'width 0.2s, height 0.2s, box-shadow 0.2s';
      
      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      });

      // Build equipment list
      const equipmentList = asset.equipment && asset.equipment.length > 0
        ? asset.equipment.slice(0, 3).map((eq: any) => 
            `<li style="font-size: 11px; margin-bottom: 2px;">${eq.description} ${eq.quantity > 1 ? `<strong>(×${eq.quantity})</strong>` : ''}</li>`
          ).join('')
        : '<li style="font-size: 11px; color: #94a3b8;">No equipment data</li>';
      
      // Build transport tasks list
      const transportList = asset.transport_tasks && asset.transport_tasks.length > 0
        ? asset.transport_tasks.slice(0, 5).map((task: any) => {
            const isDelivery = task.type.toLowerCase().includes('delivery');
            const icon = isDelivery ? '📦' : '🔄';
            return `<li style="font-size: 11px; margin-bottom: 2px;">${icon} ${task.type}</li>`;
          }).join('')
        : '';
      
      const transportSection = transportList 
        ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
             <strong style="font-size: 12px; color: #475569;">Transport Tasks:</strong>
             <ul style="margin: 4px 0; padding-left: 20px; list-style: none;">
               ${transportList}
             </ul>
           </div>`
        : '<div style="margin-top: 6px; font-size: 11px; color: #10b981;">✓ No pending transport</div>';
      
      // Status badge with clearer descriptions
      const statusLabels: Record<string, string> = {
        'pending_delivery': '📦 Setup Required',      // 需要设备设置
        'pending_collection': '🔄 Pickup Required',   // 需要设备回收
        'active_operations': '⚡ Multi-Task Site',    // 多项任务工地
        'deployed': '✓ Deployed',                    // 已部署稳定
        'competitor_rental': '⚠️ External Rental',    // 外部租赁
      };

      const popupContent = `
        <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; width: 240px; box-sizing: border-box; overflow: hidden;">
          <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold; color: #0f172a;">
            🏗️ ${asset.id}
          </h3>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
            ${asset.customer ? `👤 Customer: <strong>${asset.customer}</strong>` : 'Contract Site'}
            ${asset.location?.suburb ? `<br/>📍 ${asset.location.suburb}` : ''}
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
            <div style="background: ${STATUS_COLORS[asset.status]}15; padding: 4px 8px; border-radius: 5px; border-left: 3px solid ${STATUS_COLORS[asset.status]}; display: inline-flex; flex-direction: column; max-width: 140px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 600; margin-bottom: 2px;">Status</div>
              <div style="color: ${STATUS_COLORS[asset.status]}; font-weight: 700; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${statusLabels[asset.status] || asset.status.replace(/_/g, ' ')}
              </div>
            </div>
            <div style="margin-top: 2px;">
              <strong style="font-size: 11px; color: #475569;">Equipment Deployed:</strong>
              <ul style="margin: 3px 0; padding-left: 18px;">
                ${equipmentList}
              </ul>
              </div>
            ${transportSection}
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        className: 'asset-popup'
      }).setHTML(popupContent);
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([asset.location.lng, asset.location.lat])
        .setPopup(popup)
        .addTo(map.current!);
      
      markers.current.push(marker);
    });

    // Add main depot marker (Melbourne CBD - Real depot location)
    const depotEl = document.createElement('div');
    depotEl.style.backgroundColor = '#8b5cf6'; // purple
    depotEl.style.width = '35px';
    depotEl.style.height = '35px';
    depotEl.style.borderRadius = '6px';
    depotEl.style.border = '3px solid white';
    depotEl.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.5)';
    depotEl.style.display = 'flex';
    depotEl.style.alignItems = 'center';
    depotEl.style.justifyContent = 'center';
    depotEl.style.cursor = 'pointer';
    depotEl.style.transition = 'box-shadow 0.2s';
    depotEl.innerHTML = '<span style="color: white; font-weight: bold; font-size: 16px;">🏭</span>';
    
    // Add hover effect for depot
    depotEl.addEventListener('mouseenter', () => {
      depotEl.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.7)';
    });
    depotEl.addEventListener('mouseleave', () => {
      depotEl.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.5)';
    });

    const depotPopup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: false
    }).setHTML('<div style="padding: 8px; font-weight: bold;">Main Depot (CBD)<br/><small>Equipment Storage & Distribution</small></div>');

    const depotMarker = new mapboxgl.Marker(depotEl)
      .setLngLat([144.9631, -37.8136]) // Real Melbourne CBD depot coordinates
      .setPopup(depotPopup)
      .addTo(map.current!);
    
    markers.current.push(depotMarker);
  }, [initialAssets]);

  // Effect 3: Render Real-time Optimization Progress (Dashed Lines)
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !optimizationProgress) return;
    
    console.log(`🔄 Rendering optimization progress: Generation ${optimizationProgress.generation}`);
    
    // 清除之前的进度虚线
    const clearProgressLines = () => {
      for (let i = 0; i < 4; i++) {
        if (mapInstance.getLayer(`progress-route-${i}`)) {
          mapInstance.removeLayer(`progress-route-${i}`);
        }
        if (mapInstance.getSource(`progress-route-${i}`)) {
          mapInstance.removeSource(`progress-route-${i}`);
        }
      }
    };
    
    clearProgressLines();
    
    // 渲染当前代的候选解为虚线（确保所有车都显示）
    const fetchAndRenderProgressRoutes = async () => {
      console.log(`🎨 Rendering generation ${optimizationProgress.generation} with ${optimizationProgress.routes.length} routes`);
      
      // 并行获取所有路线的真实道路（加速渲染）
      const routePromises = optimizationProgress.routes.map(async (route: any, i: number) => {
        const waypoints = route.route.map((p: any) => [p.lng, p.lat] as [number, number]);
        
        // 简化waypoints如果超过25个
        let simplifiedWaypoints = waypoints;
        if (waypoints.length > 25) {
          const simplified: [number, number][] = [waypoints[0]];
          const step = Math.max(1, Math.floor((waypoints.length - 2) / 23));
          for (let j = step; j < waypoints.length - 1; j += step) {
            if (simplified.length < 24) simplified.push(waypoints[j]);
          }
          simplified.push(waypoints[waypoints.length - 1]);
          simplifiedWaypoints = simplified;
        }
        
        try {
          const coordinates = simplifiedWaypoints.map((point: [number, number]) => `${point[0]},${point[1]}`).join(';');
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.routes && data.routes[0]) {
              return { index: i, coordinates: data.routes[0].geometry.coordinates };
            }
          }
        } catch (error) {
          console.error(`Error fetching route ${i}:`, error);
        }
        
        // Fallback: 简单插值
        const interpolated: [number, number][] = [];
        for (let j = 0; j < simplifiedWaypoints.length - 1; j++) {
          const start = simplifiedWaypoints[j];
          const end = simplifiedWaypoints[j + 1];
          for (let k = 0; k <= 10; k++) {
            const t = k / 10;
            interpolated.push([
              start[0] + (end[0] - start[0]) * t,
              start[1] + (end[1] - start[1]) * t
            ]);
          }
        }
        return { index: i, coordinates: interpolated };
      });
      
      // 等待所有路线都获取完成
      const allRoutes = await Promise.all(routePromises);
      
      // 渲染所有路线
      allRoutes.forEach(({ index, coordinates }) => {
        if (!coordinates || coordinates.length === 0) return;
        
        const geojsonSource: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates },
        };
        
        const layerId = `progress-route-${index}`;
        
        // 如果已存在，先移除
        if (mapInstance.getSource(layerId)) {
          if (mapInstance.getLayer(layerId)) {
            mapInstance.removeLayer(layerId);
          }
          mapInstance.removeSource(layerId);
        }
        
        mapInstance.addSource(layerId, { type: 'geojson', data: geojsonSource });
        
        // 使用对应车辆的颜色
        const routeColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
        
        mapInstance.addLayer({
          id: layerId,
          type: 'line',
          source: layerId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': routeColor, // 保持各自颜色，不变绿
            'line-width': optimizationProgress.isBest ? 5 : 3, // 最优解稍粗一点
            'line-opacity': optimizationProgress.isBest ? 0.6 : 0.35, // 最优解更明显
            'line-dasharray': [6, 3],
          },
        });
        
        console.log(`✅ Rendered progress route ${index} (${optimizationProgress.routes[index].vehicleId}) in ${routeColor}`);
      });
    };
    
    fetchAndRenderProgressRoutes();
    
    return () => {
      clearProgressLines();
    };
  }, [optimizationProgress]);

  // Effect 4: Render Final Optimization Routes (Solid Lines)
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    // Function to clear existing routes (including alternatives)
    const clearRoutes = () => {
      // Clear main routes
      ROUTE_COLORS.forEach((_, index) => {
        if (mapInstance.getLayer(`route-line-${index}`)) {
          mapInstance.removeLayer(`route-line-${index}`);
        }
        if (mapInstance.getLayer(`route-outline-${index}`)) {
          mapInstance.removeLayer(`route-outline-${index}`);
        }
        if (mapInstance.getSource(`route-${index}`)) {
          mapInstance.removeSource(`route-${index}`);
        }
      });
      
      // Clear alternative routes (dashed lines)
      for (let altIndex = 0; altIndex < 3; altIndex++) {
        for (let routeIndex = 0; routeIndex < 4; routeIndex++) {
          const layerId = `alt-route-${altIndex}-${routeIndex}`;
          if (mapInstance.getLayer(`${layerId}-bg`)) {
            mapInstance.removeLayer(`${layerId}-bg`);
          }
          if (mapInstance.getLayer(layerId)) {
            mapInstance.removeLayer(layerId);
          }
          if (mapInstance.getSource(layerId)) {
            mapInstance.removeSource(layerId);
          }
        }
      }
      
      // Clear vehicle markers - 确保完全清理
      if (window.truckMarkers && Array.isArray(window.truckMarkers)) {
        console.log(`Clearing ${window.truckMarkers.length} existing truck markers`);
        window.truckMarkers.forEach((marker, idx) => {
          if (marker && typeof marker.remove === 'function') {
            console.log(`Removing truck marker ${idx}`);
            marker.remove();
          }
        });
        window.truckMarkers = [];
      }
      // 清理旧的图层和源
      if (mapInstance.getLayer('vehicle-markers')) {
        mapInstance.removeLayer('vehicle-markers');
      }
      if (mapInstance.getSource('vehicle-markers')) {
        mapInstance.removeSource('vehicle-markers');
      }
    };

    // Function to fetch real road directions using Mapbox Directions API
    const fetchRealRoute = async (waypoints: [number, number][]): Promise<{ coordinates: [number, number][]; distance: number }> => {
      // 启用Mapbox API获取真实道路
      const USE_MAPBOX_API = true;
      
      // Mapbox API限制：最多25个waypoints
      if (waypoints.length > 25) {
        console.warn(`⚠️ Too many waypoints (${waypoints.length}), simplifying to 25...`);
        // 简化waypoints：保留起点、终点和均匀采样的中间点
        const simplified: [number, number][] = [waypoints[0]]; // 起点
        
        const step = Math.floor((waypoints.length - 2) / 23); // 中间23个点
        for (let i = 1; i < waypoints.length - 1; i += step) {
          if (simplified.length < 24) {
            simplified.push(waypoints[i]);
          }
        }
        
        simplified.push(waypoints[waypoints.length - 1]); // 终点
        console.log(`Simplified ${waypoints.length} waypoints to ${simplified.length}`);
        waypoints = simplified;
      }
      
      if (!USE_MAPBOX_API) {
        console.log('Using direct waypoints (Mapbox API disabled for debugging)');
        // 在waypoints之间创建更多插值点，使动画更平滑
        const interpolatedRoute: [number, number][] = [];
        
        for (let i = 0; i < waypoints.length - 1; i++) {
          const start = waypoints[i];
          const end = waypoints[i + 1];
          const steps = 10; // 每两个waypoint之间插入10个点
          
          for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            interpolatedRoute.push([
              start[0] + (end[0] - start[0]) * t,
              start[1] + (end[1] - start[1]) * t
            ]);
          }
        }
        
        // 添加最后一个点
        if (!interpolatedRoute.some(p => p[0] === waypoints[waypoints.length - 1][0] && p[1] === waypoints[waypoints.length - 1][1])) {
          interpolatedRoute.push(waypoints[waypoints.length - 1]);
        }
        
        console.log(`Interpolated ${waypoints.length} waypoints to ${interpolatedRoute.length} points`);
        return { coordinates: interpolatedRoute, distance: 0 };
      }
      
      // 即使只有2个点，也要调用API获取真实道路路径
      // 之前的逻辑会导致直线连接，现在所有情况都调用API
      
      // Convert waypoints to string format for API
      const coordinates = waypoints.map(point => `${point[0]},${point[1]}`).join(';');
      
      // Add overview=full to get detailed route geometry
      // Use small radius (25m) for first and last points to prevent excessive snapping
      // Use default for middle waypoints to ensure they connect to roads
      const radiuses = waypoints.map((_, idx) => {
        if (idx === 0 || idx === waypoints.length - 1) {
          return '25'; // 25 meters for start/end points
        }
        return ''; // Default (150m) for intermediate points
      }).join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&radiuses=${radiuses}&access_token=${mapboxgl.accessToken}`;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          
          if (data.routes && data.routes.length > 0 && data.routes[0].geometry) {
            const routeCoords = data.routes[0].geometry.coordinates;
            const realDistance = data.routes[0].distance / 1000; // 转换为km
            return { coordinates: routeCoords, distance: realDistance };
          }
        }
      } catch (error) {
        console.error('Error fetching directions:', error);
      }
      
      // Fallback: 创建平滑插值路径（不是直线）
      console.warn('⚠️ Mapbox API failed, using interpolated fallback route');
      const interpolatedRoute: [number, number][] = [];
      
      for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];
        const steps = 20; // 每两个waypoint之间插入20个点
        
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          interpolatedRoute.push([
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t
          ]);
        }
      }
      
      console.log(`Fallback interpolated ${waypoints.length} waypoints to ${interpolatedRoute.length} points`);
      return { coordinates: interpolatedRoute, distance: 0 };
    };

    // Wait for map to be loaded
    const drawRoutes = async () => {
      clearRoutes(); // Clear previous routes before drawing new ones

      if (!optimizationResults) return;

      const bounds = new mapboxgl.LngLatBounds();
      
      // 初始化卡车标记数组
      if (!window.truckMarkers) {
        window.truckMarkers = [];
      }

      // 虚线已经在Effect 3中实时渲染了，这里直接渲染最优解实线
      console.log(`✅ Rendering final best solution (solid lines)`);

      // 按顺序处理每个路径，确保索引正确
      for (let index = 0; index < optimizationResults.optimizedRoutes.length; index++) {
        const route = optimizationResults.optimizedRoutes[index];
        const waypoints = route.route.map(p => [p.lng, p.lat] as [number, number]);
        
        
        // Fetch real road directions
        const routeResult = await fetchRealRoute(waypoints);
        const routeCoordinates = routeResult.coordinates;
        const realRoadDistance = routeResult.distance;
        
        console.log(`${route.vehicleId}: ${routeCoordinates.length} points, ${realRoadDistance.toFixed(1)} km`);
        
        
        const geojsonSource: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: routeCoordinates },
        };

        // Add route source and layer
        mapInstance.addSource(`route-${index}`, { type: 'geojson', data: geojsonSource });
        
        // Add route outline for better visibility
        mapInstance.addLayer({
          id: `route-outline-${index}`,
          type: 'line',
          source: `route-${index}`,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ffffff',
            'line-width': 10,
            'line-opacity': 0.8,
          },
        });
        
        // Add main route line with better styling
        mapInstance.addLayer({
          id: `route-line-${index}`,
          type: 'line',
          source: `route-${index}`,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': ROUTE_COLORS[index % ROUTE_COLORS.length],
            'line-width': 6,
            'line-opacity': 1,
          },
        });

        // 注释掉调试标记，减少地图上的混乱
        // for (let i = 0; i < routeCoordinates.length; i += 5) {
        //   const debugEl = document.createElement('div');
        //   debugEl.style.width = '8px';
        //   debugEl.style.height = '8px';
        //   debugEl.style.borderRadius = '50%';
        //   debugEl.style.backgroundColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
        //   debugEl.style.opacity = '0.5';
        //   
        //   new mapboxgl.Marker(debugEl)
        //     .setLngLat(routeCoordinates[i])
        //     .addTo(mapInstance);
        // }
        
        // Add start and end markers for each route
        if (routeCoordinates.length > 0) {
          // Start marker
          const startEl = document.createElement('div');
          startEl.style.width = '24px';
          startEl.style.height = '24px';
          startEl.style.borderRadius = '50%';
          startEl.style.backgroundColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
          startEl.style.border = '3px solid white';
          startEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
          startEl.style.display = 'flex';
          startEl.style.alignItems = 'center';
          startEl.style.justifyContent = 'center';
          startEl.innerHTML = `<span style="color: white; font-weight: bold; font-size: 10px;">S</span>`;
          
          new mapboxgl.Marker(startEl)
            .setLngLat(routeCoordinates[0])
            .addTo(mapInstance);
          
          // End marker (if different from start)
          if (routeCoordinates.length > 1) {
            const endEl = document.createElement('div');
            endEl.style.width = '24px';
            endEl.style.height = '24px';
            endEl.style.borderRadius = '50%';
            endEl.style.backgroundColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
            endEl.style.border = '3px solid white';
            endEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            endEl.style.display = 'flex';
            endEl.style.alignItems = 'center';
            endEl.style.justifyContent = 'center';
            endEl.innerHTML = `<span style="color: white; font-weight: bold; font-size: 10px;">E</span>`;
            
            new mapboxgl.Marker(endEl)
              .setLngLat(routeCoordinates[routeCoordinates.length - 1])
              .addTo(mapInstance);
          }
        }

        // Add truck icon with better design
        const vehicleEl = document.createElement('div');
        // 设置固定尺寸和正确的类名，避免缩放问题
        vehicleEl.className = 'mapboxgl-marker mapboxgl-marker-anchor-center';
        vehicleEl.style.width = '40px';
        vehicleEl.style.height = '40px';
        vehicleEl.style.position = 'absolute';
        vehicleEl.style.pointerEvents = 'none'; // 防止干扰地图交互
        vehicleEl.style.userSelect = 'none';    // 防止文本选择
        vehicleEl.setAttribute('data-truck-id', route.vehicleId); // 添加标识符用于调试
        vehicleEl.innerHTML = `
          <div style="
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            border-radius: 8px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            border: 2px solid ${ROUTE_COLORS[index % ROUTE_COLORS.length]};
            position: relative;
          ">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="${ROUTE_COLORS[index % ROUTE_COLORS.length]}">
              <path d="M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L21.46,12H17V9.5M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M20,8H17V4H3C1.89,4 1,4.89 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8Z"/>
            </svg>
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: ${ROUTE_COLORS[index % ROUTE_COLORS.length]};
              color: white;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            ">${route.vehicleId.replace('Truck-', '')}</div>
          </div>
        `;
        
        // Create marker with offset to center the truck
        // 确保卡车从路径的第一个点开始
        const startPosition = routeCoordinates[0];
        console.log(`${route.vehicleId} starting at:`, startPosition);
        
        // 创建标记时使用正确的配置
        const vehicleMarker = new mapboxgl.Marker({
          element: vehicleEl,
          anchor: 'center',
          pitchAlignment: 'map',  // 确保标记跟随地图倾斜
          rotationAlignment: 'map' // 确保标记跟随地图旋转
        })
          .setLngLat(startPosition)
          .addTo(mapInstance);
        
        // 立即将标记添加到全局数组中，确保 Mapbox 正确管理
        if (!window.truckMarkers) {
          window.truckMarkers = [];
        }
        window.truckMarkers.push(vehicleMarker);
        console.log(`Added ${route.vehicleId} to global markers array. Total markers: ${window.truckMarkers.length}`);
        
        // 创建平滑动画函数 - 基于距离的恒定速度
        const createAnimation = (marker: mapboxgl.Marker, path: [number, number][], vehicleId: string) => {
          if (!path || path.length < 2) {
            console.warn(`No valid route for ${vehicleId}`);
            return;
          }
          
          // 计算路径总距离
          const calculateDistance = (p1: [number, number], p2: [number, number]) => {
            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            return Math.sqrt(dx * dx + dy * dy);
          };
          
          let totalDistance = 0;
          const segmentDistances: number[] = [];
          for (let i = 0; i < path.length - 1; i++) {
            const dist = calculateDistance(path[i], path[i + 1]);
            segmentDistances.push(dist);
            totalDistance += dist;
          }
          
          console.log(`${vehicleId}: ${path.length} points, total distance: ${totalDistance.toFixed(6)}`);
          
          // 设置恒定车速（所有车辆相同的速度 - 5倍加速）
          const constantSpeed = 0.001 * 15; // 5倍加速（度/秒）
          const estimatedDurationSeconds = totalDistance / constantSpeed;
          let segmentProgress = 0;
          
          const startTime = performance.now();
          
          const animate = (currentTime: number) => {
            const elapsed = (currentTime - startTime) / 1000; // 转换为秒
            const targetDistance = Math.min(elapsed * constantSpeed, totalDistance);
            
            // 找到当前应该在的路径段
            let accumulatedDistance = 0;
            let segmentIndex = 0;
            
            for (let i = 0; i < segmentDistances.length; i++) {
              if (accumulatedDistance + segmentDistances[i] >= targetDistance) {
                segmentIndex = i;
                segmentProgress = (targetDistance - accumulatedDistance) / segmentDistances[i];
                break;
              }
              accumulatedDistance += segmentDistances[i];
            }
            
            // 如果到达终点
            if (targetDistance >= totalDistance) {
              marker.setLngLat(path[path.length - 1]);
              console.log(`${vehicleId} completed journey in ${elapsed.toFixed(1)}s`);
              return;
            }
            
            // 计算当前位置
            const start = path[segmentIndex];
            const end = path[segmentIndex + 1];
            const position: [number, number] = [
              start[0] + (end[0] - start[0]) * segmentProgress,
              start[1] + (end[1] - start[1]) * segmentProgress
            ];
            
            marker.setLngLat(position);
            
            // 进度日志（每5秒记录一次）
            if (Math.floor(elapsed) % 5 === 0 && Math.floor(elapsed) !== Math.floor((currentTime - startTime - 16) / 1000)) {
              const progressPercent = Math.floor((targetDistance / totalDistance) * 100);
              console.log(`${vehicleId}: ${progressPercent}% (${elapsed.toFixed(1)}s)`);
            }
            
            requestAnimationFrame(animate);
          };
          
          // 延迟启动
          setTimeout(() => {
            console.log(`Starting ${vehicleId} at constant speed (${constantSpeed.toFixed(6)} units/sec, ETA: ${estimatedDurationSeconds.toFixed(1)}s)`);
            requestAnimationFrame(animate);
          }, 2000);
        };
        
        // 调用动画函数
        createAnimation(vehicleMarker, [...routeCoordinates], route.vehicleId);

        routeCoordinates.forEach(coord => bounds.extend(coord));
      }

      // 虚线进度在优化完成后会自动清除（optimizationProgress设为null）

      if (!bounds.isEmpty()) {
        mapInstance.fitBounds(bounds, { padding: 100, duration: 1500 });
      }
      
      // 添加地图事件监听器来验证标记行为
      mapInstance.on('zoom', () => {
        if (window.truckMarkers && window.truckMarkers.length > 0) {
          console.log(`Map zoom changed. ${window.truckMarkers.length} truck markers should adjust automatically.`);
        }
      });
      
      mapInstance.on('move', () => {
        // 验证标记是否跟随地图移动
        if (window.truckMarkers && window.truckMarkers.length > 0) {
          // 标记正常工作
        }
      });
    };
    
    if (mapInstance.isStyleLoaded()) {
      drawRoutes();
    } else {
      mapInstance.once('load', drawRoutes);
    }
  }, [optimizationResults]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
  );
};

export default MapView;