import { useState, useEffect } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import MapView from './components/MapView';
import ResultsModal from './components/ResultsModal';
import { fetchOptimizationWithProgress, getInitialState, type OptimizationResult, type Asset } from './api/client';

export interface SimulationParams {
  utilizationRate: number;
  hireDuration: number;
}

function App() {
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    utilizationRate: 85,
    hireDuration: 15,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [initialAssets, setInitialAssets] = useState<Asset[]>([]);
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [taskPoolAnalyzed, setTaskPoolAnalyzed] = useState(false); // 任务池是否已分析
  const [optimizationProgress, setOptimizationProgress] = useState<any>(null); // 优化进度（实时候选解）

  // 在应用加载时获取初始的设备状态
  useEffect(() => {
    const loadInitialData = async () => {
      const { assets } = await getInitialState();
      setInitialAssets(assets);
    };
    loadInitialData();
  }, []);

  const handleAnalyzeTaskPool = async () => {
    // 第一阶段：分析任务池
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟分析
      setTaskPoolAnalyzed(true);
    } catch (error) {
      console.error("任务池分析失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    // 第二阶段：路线优化（带实时进度）
    setIsLoading(true);
    setOptimizationProgress(null); // 清空之前的进度
    
    try {
      // 使用带进度回调的优化函数
      const data = await fetchOptimizationWithProgress(
        simulationParams,
        (progress) => {
          // 实时更新优化进度，传递给MapView渲染虚线
          console.log(`📊 Progress callback: Generation ${progress.generation}, Distance=${progress.totalDistance.toFixed(1)}km, Best=${progress.isBest}`);
          setOptimizationProgress(progress);
        }
      );
      
      setResults(data);
      setShowModal(true); // 显示弹窗
    } catch (error) {
      console.error("优化请求失败:", error);
    } finally {
      setIsLoading(false);
      setOptimizationProgress(null); // 优化完成，清空进度
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#f8fafc', 
      color: '#1e293b', 
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header />
      <main style={{ 
        display: 'flex', 
        height: 'calc(100vh - 64px)' 
      }}>
        <div style={{ 
          width: '320px', 
          backgroundColor: 'white',
          boxShadow: '4px 0 6px -1px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 10
        }}>
        <ControlPanel 
          params={simulationParams}
          setParams={setSimulationParams}
          onAnalyzeTaskPool={handleAnalyzeTaskPool}
          onOptimize={handleOptimize}
          isLoading={isLoading}
          taskPoolAnalyzed={taskPoolAnalyzed}
          assets={initialAssets}
        />
        </div>
        <div style={{ flex: 1 }}>
          {/* 将初始设备、优化结果和实时进度都传递给地图 */}
          <MapView 
            initialAssets={initialAssets} 
            optimizationResults={results}
            optimizationProgress={optimizationProgress}
          />
        </div>
      </main>
      
      <ResultsModal results={showModal ? results : null} onClose={() => setShowModal(false)} />
    </div>
  );
}

export default App;