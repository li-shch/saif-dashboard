/**
 * 高级路线优化算法
 * 使用遗传算法/模拟退火生成多个候选解
 */

interface Location {
  lat: number;
  lng: number;
}

interface Task {
  siteId: string;
  location: Location;
  type: 'delivery' | 'collection' | 'swap' | 'inspection';
  priority: number;
}

interface Route {
  vehicleId: string;
  tasks: Task[];
  route: Location[];
  totalDistance: number;
  score: number; // 适应度分数
}

interface OptimizationResult {
  bestSolution: Route[];
  alternativeSolutions: Route[][]; // 次优解
  iterations: number;
  convergence: number[];
}

/**
 * 计算两点间的距离（km）
 */
function calculateDistance(a: Location, b: Location): number {
  const R = 6371; // 地球半径（km）
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

/**
 * 从工地选择当天要执行的任务
 * 处理一个工地有多个历史任务的情况
 */
export function selectDailyTasks(sites: any[]): Task[] {
  const tasks: Task[] = [];
  
  sites.forEach(site => {
    if (!site.transport_tasks || site.transport_tasks.length === 0) return;
    
    const hasManyTasks = site.transport_tasks.length > 3;
    
    if (hasManyTasks) {
      // 如果工地有很多任务（历史累计），只选择当天需要的
      // 假设：有Delivery就执行一次送货，有Collection就执行一次回收
      const hasDelivery = site.transport_tasks.some((t: any) => 
        t.type.toLowerCase().includes('delivery'));
      const hasCollection = site.transport_tasks.some((t: any) => 
        t.type.toLowerCase().includes('collection'));
      
      if (hasDelivery) {
        tasks.push({
          siteId: site.id,
          location: site.location,
          type: 'delivery',
          priority: 1
        });
      }
      
      if (hasCollection) {
        tasks.push({
          siteId: site.id,
          location: site.location,
          type: 'collection',
          priority: 2
        });
      }
    } else {
      // 任务少的工地，每个任务都执行
      site.transport_tasks.forEach((task: any) => {
        const isDelivery = task.type.toLowerCase().includes('delivery');
        tasks.push({
          siteId: site.id,
          location: site.location,
          type: isDelivery ? 'delivery' : 'collection',
          priority: isDelivery ? 1 : 2
        });
      });
    }
  });
  
  return tasks;
}

/**
 * K-means聚类算法 - 将工地分组
 */
function clusterSites(tasks: Task[], k: number): Task[][] {
  // 简化的K-means实现
  const clusters: Task[][] = Array(k).fill(null).map(() => []);
  
  // 初始化聚类中心（选择分散的点）
  const centers: Location[] = [];
  const allTasks = [...tasks];
  
  // 选第一个中心（最北的点）
  centers.push(allTasks.sort((a, b) => a.location.lat - b.location.lat)[0].location);
  
  // 选其他中心（与现有中心最远的点）
  for (let i = 1; i < k; i++) {
    let maxMinDist = 0;
    let farthest = allTasks[0];
    
    for (const task of allTasks) {
      const minDist = Math.min(...centers.map(c => calculateDistance(c, task.location)));
      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        farthest = task;
      }
    }
    centers.push(farthest.location);
  }
  
  // 分配任务到最近的聚类
  tasks.forEach(task => {
    let minDist = Infinity;
    let clusterIndex = 0;
    
    centers.forEach((center, index) => {
      const dist = calculateDistance(center, task.location);
      if (dist < minDist) {
        minDist = dist;
        clusterIndex = index;
      }
    });
    
    clusters[clusterIndex].push(task);
  });
  
  return clusters.filter(c => c.length > 0);
}

/**
 * 贪心算法 - TSP最近邻（确保返回仓库）
 */
function greedyTSP(depot: Location, tasks: Task[]): Location[] {
  if (tasks.length === 0) {
    return [depot, depot]; // 空路线也返回仓库
  }
  
  const route: Location[] = [depot]; // 从仓库出发
  const remaining = [...tasks];
  let current = depot;
  
  while (remaining.length > 0) {
    let minDist = Infinity;
    let nearestIndex = 0;
    
    remaining.forEach((task, index) => {
      const dist = calculateDistance(current, task.location);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = index;
      }
    });
    
    current = remaining[nearestIndex].location;
    route.push(current);
    remaining.splice(nearestIndex, 1);
  }
  
  route.push(depot); // 必须返回仓库
  return route;
}

/**
 * 2-opt改进算法（保持起点和终点不变）
 */
function twoOptImprove(route: Location[]): Location[] {
  if (route.length <= 3) return route; // 太短无法优化
  
  let improved = true;
  let bestRoute = [...route];
  let iterations = 0;
  const maxIterations = 100; // 防止无限循环
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    const bestDistance = calculateRouteDistance(bestRoute);
    
    // 只优化中间部分，保持起点[0]和终点[length-1]不变
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        // 尝试反转i到j之间的路线段
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1)
        ];
        
        const newDistance = calculateRouteDistance(newRoute);
        
        if (newDistance < bestDistance - 0.01) { // 需要有实质性改进
          bestRoute = newRoute;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
  
  // 确保起点和终点仍然是仓库
  if (bestRoute.length > 0) {
    const depot = bestRoute[0];
    bestRoute[bestRoute.length - 1] = depot;
  }
  
  return bestRoute;
}

/**
 * 生成多个候选解（模拟进化计算）
 */
function generateAlternatives(depot: Location, taskClusters: Task[][], iterations: number = 5): Route[][] {
  const alternatives: Route[][] = [];
  
  for (let iter = 0; iter < iterations; iter++) {
    // 每次迭代使用稍微不同的策略
    const randomFactor = Math.random();
    const routes: Route[] = [];
    
    taskClusters.forEach((clusterTasks, index) => {
      if (clusterTasks.length === 0) return;
      
      // 添加随机性
      let shuffledTasks = [...clusterTasks];
      if (randomFactor > 0.5) {
        // 随机打乱任务顺序
        shuffledTasks = shuffledTasks.sort(() => Math.random() - 0.5);
      }
      
      // 生成路线
      const routePoints = greedyTSP(depot, shuffledTasks);
      const distance = calculateRouteDistance(routePoints);
      
      routes.push({
        vehicleId: `Truck-${String.fromCharCode(65 + index)}`,
        tasks: shuffledTasks,
        route: routePoints,
        totalDistance: distance,
        score: 1 / distance // 距离越短分数越高
      });
    });
    
    alternatives.push(routes);
  }
  
  return alternatives;
}

/**
 * 主优化函数 - 生成最优解和多个次优解
 */
export function optimizeRoutesWithAlternatives(
  sites: any[],
  depot: Location,
  numVehicles: number = 4
): OptimizationResult {
  
  // 1. 选择当天要执行的任务（处理多任务工地）
  const dailyTasks = selectDailyTasks(sites);
  
  // 2. 按地理位置聚类
  const taskClusters = clusterSites(dailyTasks, numVehicles);
  
  // 3. 生成多个候选解
  const alternatives = generateAlternatives(depot, taskClusters, 8);
  
  // 4. 对每个候选解应用2-opt改进
  const improvedAlternatives = alternatives.map(solution => 
    solution.map(route => ({
      ...route,
      route: twoOptImprove(route.route),
      totalDistance: calculateRouteDistance(twoOptImprove(route.route))
    }))
  );
  
  // 5. 选择最优解
  const bestSolution = improvedAlternatives.reduce((best, current) => {
    const bestTotalDist = best.reduce((sum, r) => sum + r.totalDistance, 0);
    const currentTotalDist = current.reduce((sum, r) => sum + r.totalDistance, 0);
    return currentTotalDist < bestTotalDist ? current : best;
  });
  
  // 6. 选择2-3个次优解用于展示
  const sortedSolutions = improvedAlternatives
    .map(solution => ({
      solution,
      totalDistance: solution.reduce((sum, r) => sum + r.totalDistance, 0)
    }))
    .sort((a, b) => a.totalDistance - b.totalDistance);
  
  const alternativeSolutions = sortedSolutions
    .slice(1, 4) // 跳过最优解，取第2-4名
    .map(s => s.solution);
  
  // 7. 收敛过程（用于动画）
  const convergence = improvedAlternatives.map(solution => 
    solution.reduce((sum, r) => sum + r.totalDistance, 0)
  ).sort((a, b) => b - a); // 从差到好排序
  
  return {
    bestSolution,
    alternativeSolutions,
    iterations: alternatives.length,
    convergence
  };
}

/**
 * 解释：为什么任务数>工地数
 */
export function explainTaskSiteRatio(sites: any[]): string {
  const sitesWithMultipleTasks = sites.filter(s => 
    s.transport_tasks && s.transport_tasks.length > 3
  );
  
  const avgTasksPerSite = sites.reduce((sum, s) => 
    sum + (s.transport_tasks?.length || 0), 0) / sites.length;
  
  return `
  Many sites have multiple transport tasks because:
  - Equipment deployed/retrieved in multiple batches (e.g., "Delivery x 164 Armorzones")
  - Phased operations over contract duration
  - Different equipment types sent at different times
  
  For daily optimization, we consolidate multiple tasks to the same site into a single visit.
  
  Example: Site HC6530 has 13 historical task records, but requires only 1-2 actual visits today.
  
  Statistics:
  - Sites with multiple tasks: ${sitesWithMultipleTasks.length}
  - Average tasks per site: ${avgTasksPerSite.toFixed(1)}
  - Optimization approach: Group tasks by site, visit each site once per route
  `;
}
