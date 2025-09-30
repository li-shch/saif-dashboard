/**
 * 渐进式路线优化器 - 支持实时进度回调
 * 在优化过程中不断生成候选解并通过回调传递给UI
 */

interface Location {
  lat: number;
  lng: number;
}

interface Site {
  id: string;
  location: Location;
  transport_tasks: any[];
}

interface RouteCandidate {
  vehicleId: string;
  route: Location[];
  distance: number;
  generation: number; // 第几代
}

interface OptimizationProgress {
  generation: number;
  routes: RouteCandidate[];
  totalDistance: number;
  isBest: boolean; // 是否是目前最优解
}

export type ProgressCallback = (progress: OptimizationProgress) => void;

/**
 * 计算两点间的真实距离（km）
 */
function calculateDistance(a: Location, b: Location): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  
  const a1 = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));
  return R * c;
}

/**
 * 计算路线总距离
 */
function calculateRouteDistance(route: Location[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += calculateDistance(route[i], route[i + 1]);
  }
  return total;
}

// 本周优先工地容量配置
export const WEEKLY_PRIORITY_CAPACITY = 43;

/**
 * 任务优先级筛选 - 从所有工地中选择本周需要访问的
 * 架构中的"任务聚合与优先级引擎"
 */
function selectWeeklyPriorityTasks(sites: Site[], weeklyCapacity: number = WEEKLY_PRIORITY_CAPACITY): Site[] {
  // 1. 过滤出有任务的工地
  const sitesWithTasks = sites.filter(site => 
    site.transport_tasks && site.transport_tasks.length > 0
  );
  
  // 2. 计算优先级分数
  const sitesWithPriority = sitesWithTasks.map(site => {
    let priorityScore = 0;
    
    // 因素1: 任务数量多的优先（需要处理的事情多）
    priorityScore += site.transport_tasks.length * 10;
    
    // 因素2: 有Delivery任务优先（客户等待设备）
    const hasDelivery = site.transport_tasks.some((t: any) => 
      t.type.toLowerCase().includes('delivery'));
    if (hasDelivery) priorityScore += 50;
    
    // 因素3: Collection任务次优（回收设备）
    const hasCollection = site.transport_tasks.some((t: any) => 
      t.type.toLowerCase().includes('collection'));
    if (hasCollection) priorityScore += 30;
    
    // 因素4: 竞争对手租赁高优先级（减少成本）
    if (site.transport_tasks.some((t: any) => t.type === 'competitor_rental')) {
      priorityScore += 100;
    }
    
    return { site, priorityScore };
  });
  
  // 3. 按优先级排序并选择top N
  const selectedSites = sitesWithPriority
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, weeklyCapacity)
    .map(item => item.site);
  
  console.log(`📊 Task prioritization: Selected ${selectedSites.length} highest priority sites from ${sitesWithTasks.length} total`);
  
  return selectedSites;
}

/**
 * 从每个工地选择一个代表任务（合并同工地的多个任务）
 */
function consolidateSiteTasks(sites: Site[]): Site[] {
  return sites.filter(site => 
    site.transport_tasks && site.transport_tasks.length > 0
  );
}

/**
 * K-means聚类
 */
function clusterSites(sites: Site[], k: number): Site[][] {
  if (sites.length === 0) return [];
  if (sites.length <= k) {
    return sites.map(s => [s]);
  }
  
  const clusters: Site[][] = Array(k).fill(null).map(() => []);
  
  // 初始化聚类中心
  const centers: Location[] = [];
  const sorted = [...sites].sort((a, b) => a.location.lat - b.location.lat);
  
  for (let i = 0; i < k; i++) {
    const index = Math.floor((i / k) * sites.length);
    centers.push(sorted[index].location);
  }
  
  // 分配站点到最近的聚类
  sites.forEach(site => {
    let minDist = Infinity;
    let clusterIndex = 0;
    
    centers.forEach((center, index) => {
      const dist = calculateDistance(center, site.location);
      if (dist < minDist) {
        minDist = dist;
        clusterIndex = index;
      }
    });
    
    clusters[clusterIndex].push(site);
  });
  
  return clusters.filter(c => c.length > 0);
}

/**
 * 生成一条路线（贪心最近邻 + 随机扰动）
 */
function generateRoute(depot: Location, sites: Site[], randomFactor: number = 0): Location[] {
  if (sites.length === 0) return [depot, depot];
  
  const route: Location[] = [depot];
  const remaining = [...sites];
  let current = depot;
  
  while (remaining.length > 0) {
    let selectedIndex = 0;
    
    if (Math.random() < randomFactor) {
      // 随机选择（增加多样性）
      selectedIndex = Math.floor(Math.random() * remaining.length);
    } else {
      // 选择最近的
      let minDist = Infinity;
      remaining.forEach((site, index) => {
        const dist = calculateDistance(current, site.location);
        if (dist < minDist) {
          minDist = dist;
          selectedIndex = index;
        }
      });
    }
    
    current = remaining[selectedIndex].location;
    route.push(current);
    remaining.splice(selectedIndex, 1);
  }
  
  route.push(depot); // 返回仓库
  return route;
}

/**
 * 2-opt局部优化
 */
function improve2Opt(route: Location[], maxIterations: number = 50): Location[] {
  if (route.length <= 3) return route;
  
  let bestRoute = [...route];
  let improved = true;
  let iterations = 0;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    const bestDist = calculateRouteDistance(bestRoute);
    
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1)
        ];
        
        const newDist = calculateRouteDistance(newRoute);
        if (newDist < bestDist - 0.01) {
          bestRoute = newRoute;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
  
  // 确保起终点是仓库
  if (bestRoute.length > 0) {
    bestRoute[bestRoute.length - 1] = bestRoute[0];
  }
  
  return bestRoute;
}

/**
 * 渐进式优化 - 带实时进度回调
 */
export async function optimizeWithProgress(
  sites: Site[],
  depot: Location,
  numVehicles: number,
  progressCallback: ProgressCallback
): Promise<RouteCandidate[]> {
  
  console.log(`🚀 Starting progressive optimization with ${sites.length} sites`);
  
  // 1. 过滤出有任务的工地（严格检查）
  const consolidatedSites = consolidateSiteTasks(sites);
  console.log(`📊 Found ${consolidatedSites.length} sites with pending tasks`);
  
  // 2. 优先级筛选 - 选择本周要访问的工地（架构中的任务优先级引擎）
  const prioritySites = selectWeeklyPriorityTasks(consolidatedSites, WEEKLY_PRIORITY_CAPACITY);
  console.log(`🎯 Task Prioritization Engine selected ${prioritySites.length} high-priority sites for this week`);
  
  // 3. 聚类分组（对筛选后的优先工地进行聚类）
  const clusters = clusterSites(prioritySites, numVehicles);
  console.log(`🗂️ Clustered ${prioritySites.length} priority sites into ${clusters.length} groups`);
  
  let bestSolution: RouteCandidate[] = [];
  let bestTotalDistance = Infinity;
  
  // 3. 进化迭代（增强版：种群进化）
  const generations = 10; // 增加到15代
  const populationSize = 8; // 每代生成5个候选解（平衡性能和效果）
  
  for (let gen = 0; gen < generations; gen++) {
    const randomFactor = gen < 4 ? 0.4 : gen < 8 ? 0.2 : 0.05; // 逐步降低随机性
    
    // 每代生成多个候选解（种群）
    const population: RouteCandidate[][] = [];
    
    for (let individual = 0; individual < populationSize; individual++) {
      // 为每个聚类生成路线
      const routes: RouteCandidate[] = [];
      
      for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex++) {
        const clusterSites = clusters[clusterIndex];
        if (clusterSites.length === 0) continue;
        
        // 生成路线（每个个体用不同的随机因子）
        const individualRandomFactor = randomFactor * (1 + individual * 0.3);
        let route = generateRoute(depot, clusterSites, individualRandomFactor);
        
        // 应用2-opt改进（后期更激进）
        if (gen > 3) {
          const iterations = gen > 8 ? 50 : 30; // 后期增强优化
          route = improve2Opt(route, iterations);
        }
        
        const distance = calculateRouteDistance(route);
        
        routes.push({
          vehicleId: `Truck-${String.fromCharCode(65 + clusterIndex)}`,
          route,
          distance,
          generation: gen
        });
      }
      
      population.push(routes);
    }
    
    // 从种群中选择最优个体
    const bestInGeneration = population.reduce((best, current) => {
      const bestDist = best.reduce((sum, r) => sum + r.distance, 0);
      const currentDist = current.reduce((sum, r) => sum + r.distance, 0);
      return currentDist < bestDist ? current : best;
    });
    
    const generationBestDistance = bestInGeneration.reduce((sum, r) => sum + r.distance, 0);
    
    // 更新全局最优
    const isBest = generationBestDistance < bestTotalDistance;
    if (isBest) {
      bestSolution = bestInGeneration;
      bestTotalDistance = generationBestDistance;
    }
    
    // 实时回调进度（显示当代最优）
    progressCallback({
      generation: gen + 1,
      routes: bestInGeneration,
      totalDistance: generationBestDistance,
      isBest
    });
    
    // 延迟以便UI渲染
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms延迟（15代总时长7.5秒）
    
    console.log(`Generation ${gen + 1}/${generations}: Best=${generationBestDistance.toFixed(1)}km ${isBest ? '✨ NEW BEST' : ''}`);
  }
  
  console.log(`🏆 Optimization complete. Best solution: ${bestTotalDistance.toFixed(1)}km`);
  
  return bestSolution;
}

/**
 * 解释为什么任务数多于工地数
 */
export function getTaskConsolidationExplanation(sites: Site[]): {
  totalHistoricalTasks: number;
  uniqueSites: number;
  consolidatedOperations: number;
  explanation: string;
} {
  const sitesWithTasks = sites.filter(s => s.transport_tasks && s.transport_tasks.length > 0);
  
  const totalHistoricalTasks = sitesWithTasks.reduce((sum, s) => 
    sum + s.transport_tasks.length, 0);
  
  const consolidatedOperations = sitesWithTasks.length;
  
  return {
    totalHistoricalTasks,
    uniqueSites: sitesWithTasks.length,
    consolidatedOperations,
    explanation: `${totalHistoricalTasks} historical task records consolidated into ${consolidatedOperations} site visits. Multiple tasks to the same site are grouped into a single efficient visit.`
  };
}
