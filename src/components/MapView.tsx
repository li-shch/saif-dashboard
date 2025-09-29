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
}

// --- Helper Functions & Constants ---
const STATUS_COLORS: Record<string, string> = {
  'available': '#22c55e', // green-500
  'in_use': '#3b82f6', // blue-500
  'needs_inspection': '#f97316', // orange-500
  'rented_from_competitor': '#ef4444', // red-500
};

const ROUTE_COLORS = ['#16a34a', '#c026d3', '#db2777', '#0ea5e9', '#f59e0b', '#8b5cf6']; // green, fuchsia, pink, cyan, amber, violet

// --- Component ---
const MapView = ({ initialAssets, optimizationResults }: MapViewProps) => {
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

  // Effect 2: Render Initial Assets
  useEffect(() => {
    if (!map.current || initialAssets.length === 0) return;
    
    // Clear old markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    initialAssets.forEach(asset => {
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

      const popupContent = `
        <div style="padding: 8px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1e293b;">
            ${asset.id}
          </h3>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 14px;">
            <div><strong>Type:</strong> ${asset.type}</div>
            <div><strong>Status:</strong> 
              <span style="color: ${STATUS_COLORS[asset.status]}; font-weight: 600;">
                ${asset.status.replace(/_/g, ' ')}
              </span>
            </div>
            ${asset.health_score ? `
              <div><strong>Health Score:</strong> 
                <span style="color: ${asset.health_score > 80 ? '#22c55e' : asset.health_score > 60 ? '#f59e0b' : '#ef4444'}; font-weight: 600;">
                  ${asset.health_score}%
                </span>
              </div>
            ` : ''}
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

    // Add main depot marker
    const depotEl = document.createElement('div');
    depotEl.style.backgroundColor = '#8b5cf6'; // purple
    depotEl.style.width = '30px';
    depotEl.style.height = '30px';
    depotEl.style.borderRadius = '6px';
    depotEl.style.border = '3px solid white';
    depotEl.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.5)';
    depotEl.style.display = 'flex';
    depotEl.style.alignItems = 'center';
    depotEl.style.justifyContent = 'center';
    depotEl.style.cursor = 'pointer';
    depotEl.style.transition = 'box-shadow 0.2s';
    depotEl.innerHTML = '<span style="color: white; font-weight: bold; font-size: 14px;">D1</span>';
    
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
    }).setHTML('<div style="padding: 8px; font-weight: bold;">Central Depot</div>');

    const depotMarker = new mapboxgl.Marker(depotEl)
      .setLngLat([144.9631, -37.7950])
      .setPopup(depotPopup)
      .addTo(map.current!);
    
    markers.current.push(depotMarker);

    // Add secondary depot marker
    const secondDepotEl = document.createElement('div');
    secondDepotEl.style.backgroundColor = '#0ea5e9'; // cyan
    secondDepotEl.style.width = '30px';
    secondDepotEl.style.height = '30px';
    secondDepotEl.style.borderRadius = '6px';
    secondDepotEl.style.border = '3px solid white';
    secondDepotEl.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.5)';
    secondDepotEl.style.display = 'flex';
    secondDepotEl.style.alignItems = 'center';
    secondDepotEl.style.justifyContent = 'center';
    secondDepotEl.style.cursor = 'pointer';
    secondDepotEl.style.transition = 'box-shadow 0.2s';
    secondDepotEl.innerHTML = '<span style="color: white; font-weight: bold; font-size: 14px;">D2</span>';
    
    secondDepotEl.addEventListener('mouseenter', () => {
      secondDepotEl.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.7)';
    });
    secondDepotEl.addEventListener('mouseleave', () => {
      secondDepotEl.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.5)';
    });

    const secondDepotPopup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: false
    }).setHTML('<div style="padding: 8px; font-weight: bold;">Maintenance Depot</div>');

    const secondDepotMarker = new mapboxgl.Marker(secondDepotEl)
      .setLngLat([144.9500, -37.8250])
      .setPopup(secondDepotPopup)
      .addTo(map.current!);
    
    markers.current.push(secondDepotMarker);

    // Add new job site marker
    const jobSiteEl = document.createElement('div');
    jobSiteEl.style.backgroundColor = '#f59e0b'; // amber
    jobSiteEl.style.width = '30px';
    jobSiteEl.style.height = '30px';
    jobSiteEl.style.borderRadius = '50%';
    jobSiteEl.style.border = '3px solid white';
    jobSiteEl.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.5)';
    jobSiteEl.style.display = 'flex';
    jobSiteEl.style.alignItems = 'center';
    jobSiteEl.style.justifyContent = 'center';
    jobSiteEl.style.cursor = 'pointer';
    jobSiteEl.style.transition = 'box-shadow 0.2s';
    jobSiteEl.innerHTML = '<span style="color: white; font-weight: bold; font-size: 12px;">JOB</span>';
    
    jobSiteEl.addEventListener('mouseenter', () => {
      jobSiteEl.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.7)';
    });
    jobSiteEl.addEventListener('mouseleave', () => {
      jobSiteEl.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.5)';
    });

    const jobSitePopup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: false
    }).setHTML('<div style="padding: 8px; font-weight: bold;">New Job Site</div>');

    const jobSiteMarker = new mapboxgl.Marker(jobSiteEl)
      .setLngLat([144.9820, -37.8145])
      .setPopup(jobSitePopup)
      .addTo(map.current!);
    
    markers.current.push(jobSiteMarker);
  }, [initialAssets]);

  // Effect 3: Render Optimization Routes
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    // Function to clear existing routes
    const clearRoutes = () => {
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
    const fetchRealRoute = async (waypoints: [number, number][]): Promise<[number, number][]> => {
      // 启用Mapbox API获取真实道路
      const USE_MAPBOX_API = true;
      
      // 记录输入的waypoints
      console.log('fetchRealRoute input waypoints:', waypoints);
      
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
        return interpolatedRoute;
      }
      
      // If only 2 points or less, just return them
      if (waypoints.length <= 2) {
        return waypoints;
      }
      
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
            console.log(`Route ${waypoints.length} waypoints -> ${routeCoords.length} points`);
            
            // 验证路径起点和终点
            console.log('API Route start:', routeCoords[0], 'Expected:', waypoints[0]);
            console.log('API Route end:', routeCoords[routeCoords.length - 1], 'Expected:', waypoints[waypoints.length - 1]);
            
            return routeCoords;
          }
        }
      } catch (error) {
        console.error('Error fetching directions:', error);
      }
      
      // Fallback to straight lines if API fails
      console.log('Using fallback straight line route');
      return waypoints;
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

      // 按顺序处理每个路径，确保索引正确
      for (let index = 0; index < optimizationResults.optimizedRoutes.length; index++) {
        const route = optimizationResults.optimizedRoutes[index];
        const waypoints = route.route.map(p => [p.lng, p.lat] as [number, number]);
        
        // Fetch real road directions
        const routeCoordinates = await fetchRealRoute(waypoints);
        
        // Debug log - 详细记录路径信息
        console.log(`\n========== Route ${index} (${route.vehicleId}) ==========`);
        console.log('Original waypoints from client.ts:', route.route);
        console.log('Converted waypoints for Mapbox:', waypoints);
        console.log('Waypoints count:', waypoints.length);
        console.log('Route points returned by API:', routeCoordinates.length);
        console.log('Expected start:', waypoints[0], 'Actual start:', routeCoordinates[0]);
        console.log('Expected end:', waypoints[waypoints.length - 1], 'Actual end:', routeCoordinates[routeCoordinates.length - 1]);
        
        // 验证路径是否正确
        const startMatches = Math.abs(waypoints[0][0] - routeCoordinates[0][0]) < 0.001 && 
                            Math.abs(waypoints[0][1] - routeCoordinates[0][1]) < 0.001;
        const endMatches = Math.abs(waypoints[waypoints.length - 1][0] - routeCoordinates[routeCoordinates.length - 1][0]) < 0.001 && 
                          Math.abs(waypoints[waypoints.length - 1][1] - routeCoordinates[routeCoordinates.length - 1][1]) < 0.001;
        
        if (!startMatches) {
          console.warn(`⚠️ Start point mismatch for ${route.vehicleId}!`);
        }
        if (!endMatches) {
          console.warn(`⚠️ End point mismatch for ${route.vehicleId}!`);
        }
        console.log('=========================================\n');
        
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
          
          // 设置恒定车速（所有车辆相同的速度）
          // 假设地图单位大致对应经纬度，1度约等于111公里
          // 设置速度为每秒移动 0.001 度，相当于约 400km/h 的速度（5倍加速）
          const constantSpeed = 0.001 * 4; // 所有车辆的相同速度（度/秒）
          const estimatedDurationSeconds = totalDistance / constantSpeed;
          let currentDistance = 0;
          let currentSegment = 0;
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
          const firstMarker = window.truckMarkers[0];
          if (firstMarker && firstMarker.getLngLat) {
            // 定期检查第一个标记的位置（用于调试）
            const pos = firstMarker.getLngLat();
            // 只在需要时记录，避免日志过多
          }
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