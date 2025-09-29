import { useState, useEffect } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import MapView from './components/MapView';
import ResultsModal from './components/ResultsModal';
import { fetchOptimizationPlan, getInitialState, type OptimizationResult, type Asset } from './api/client';

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

  // 在应用加载时获取初始的设备状态
  useEffect(() => {
    const loadInitialData = async () => {
      const { assets } = await getInitialState();
      setInitialAssets(assets);
    };
    loadInitialData();
  }, []);

  const handleOptimize = async () => {
    setIsLoading(true);
    try {
      const data = await fetchOptimizationPlan(simulationParams);
      setResults(data);
      setShowModal(true); // 显示弹窗
    } catch (error) {
      console.error("优化请求失败:", error);
    } finally {
      setIsLoading(false);
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
            onOptimize={handleOptimize}
            isLoading={isLoading}
            assets={initialAssets}
          />
        </div>
        <div style={{ flex: 1 }}>
          {/* 将初始设备和优化结果都传递给地图 */}
          <MapView initialAssets={initialAssets} optimizationResults={results} />
        </div>
      </main>
      
      <ResultsModal results={showModal ? results : null} onClose={() => setShowModal(false)} />
    </div>
  );
}

export default App;