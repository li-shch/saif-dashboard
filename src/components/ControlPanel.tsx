import { Package, LoaderCircle, AlertCircle, CheckCircle } from 'lucide-react';
import type { SimulationParams } from '../App';
import type { Asset } from '../api/client';
import { WEEKLY_PRIORITY_CAPACITY } from '../api/progressiveOptimizer';

interface ControlPanelProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  onAnalyzeTaskPool: () => void;
  onOptimize: () => void;
  isLoading: boolean;
  taskPoolAnalyzed: boolean;
  assets?: Asset[];
}

const ControlPanel = ({ params: _params, setParams: _setParams, onAnalyzeTaskPool, onOptimize, isLoading, taskPoolAnalyzed, assets = [] }: ControlPanelProps) => {
  // 计算真实任务数（从数据动态统计）
  const deliveryCount = assets.reduce((sum, asset) => 
    sum + (asset.transport_tasks?.filter((t: any) => 
      t.type.toLowerCase().includes('delivery')).length || 0), 0);
  
  const collectionCount = assets.reduce((sum, asset) => 
    sum + (asset.transport_tasks?.filter((t: any) => 
      t.type.toLowerCase().includes('collection')).length || 0), 0);
  
  const totalTasks = deliveryCount + collectionCount;
  const activeSites = assets.filter(a => a.transport_tasks && a.transport_tasks.length > 0).length;
  const totalCustomers = new Set(assets.map(a => a.customer).filter(Boolean)).size;
  
  // 计算AI生成的任务（基于真实数据推断）
  const competitorRentals = assets.filter(a => a.status === 'competitor_rental').length;
  const swapTasks = Math.min(competitorRentals, 3); // 最多3个交换任务
  const inspectionTasks = Math.floor(assets.length * 0.03); // 约3%需要检查
  const aiGeneratedTasks = swapTasks + inspectionTasks;
  
  // 计算本周优先工地包含的任务数
  const prioritySitesWithTasks = assets
    .filter(a => a.transport_tasks && a.transport_tasks.length > 0)
    .sort((a, b) => {
      // 简化的优先级：任务多的在前
      const scoreA = (a.transport_tasks?.length || 0) * 10 + 
        (a.transport_tasks?.some((t: any) => t.type.toLowerCase().includes('delivery')) ? 50 : 0);
      const scoreB = (b.transport_tasks?.length || 0) * 10 +
        (b.transport_tasks?.some((t: any) => t.type.toLowerCase().includes('delivery')) ? 50 : 0);
      return scoreB - scoreA;
    })
    .slice(0, WEEKLY_PRIORITY_CAPACITY);
  
  const weeklyTasks = prioritySitesWithTasks.reduce((sum, site) => 
    sum + (site.transport_tasks?.length || 0), 0);
  
  // 工地状态颜色映射
  const STATUS_COLORS: Record<string, string> = {
    'pending_delivery': '#f59e0b',
    'pending_collection': '#8b5cf6',
    'active_operations': '#3b82f6',
    'deployed': '#22c55e',
    'competitor_rental': '#ef4444',
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending_delivery': return <span style={{ fontSize: '14px' }}>📦</span>;      // Setup Required
      case 'pending_collection': return <span style={{ fontSize: '14px' }}>🔄</span>;   // Pickup Required  
      case 'active_operations': return <span style={{ fontSize: '14px' }}>⚡</span>;     // Multi-Task Site
      case 'deployed': return <CheckCircle style={{ width: '14px', height: '14px' }} />;
      case 'competitor_rental': return <AlertCircle style={{ width: '14px', height: '14px' }} />;
      default: return <Package style={{ width: '14px', height: '14px' }} />;
    }
  };

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 标题 - 固定高度 */}
      <div style={{ padding: '16px 24px 12px 24px', flexShrink: 0 }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #475569, #64748b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0'
        }}>
          Control Center
        </h2>
      </div>

      {/* 内容区域 - 可滚动 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 24px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* 任务池卡片 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f1f5f9',
          padding: '20px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              padding: '6px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
            }}>
              <Package style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '0', lineHeight: '1.2' }}>
                Task Pool
              </h3>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                {activeSites} sites • {totalCustomers} customers
              </p>
            </div>
          </div>

          {/* 第一阶段：分析任务池按钮 */}
          {!taskPoolAnalyzed && (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                borderRadius: '10px',
                padding: '14px',
                border: '1px solid #7dd3fc',
                marginBottom: '14px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0369a1' }}>
                  Ready for AI Analysis
            </div>
          </div>

              <button
                onClick={onAnalyzeTaskPool}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: isLoading ? 'linear-gradient(135deg, #cbd5e1, #94a3b8)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '700',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isLoading ? 'none' : '0 10px 15px -3px rgba(14, 165, 233, 0.3)',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Analyze Task Pool</span>
                )}
              </button>
            </div>
          )}

          {/* 分析后：显示任务详情 */}
          {taskPoolAnalyzed && (
            <>
              {/* 任务分类 - 4种类型在一行 */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <div style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  borderRadius: '6px',
                  padding: '6px',
                  border: '1px solid #fbbf24',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '8px', color: '#92400e', fontWeight: '600', marginBottom: '2px' }}>
                    DEL
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#b45309' }}>
                    {deliveryCount}
                  </div>
                </div>
                
                <div style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #e9d5ff, #d8b4fe)',
                  borderRadius: '6px',
                  padding: '6px',
                  border: '1px solid #a855f7',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '8px', color: '#581c87', fontWeight: '600', marginBottom: '2px' }}>
                    COL
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#7e22ce' }}>
                    {collectionCount}
                  </div>
                </div>

                <div style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #fecaca, #fca5a5)',
                  borderRadius: '6px',
                  padding: '6px',
                  border: '1px solid #f87171',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '8px', color: '#7f1d1d', fontWeight: '600', marginBottom: '2px' }}>
                    SWAP
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#991b1b' }}>
                    {swapTasks}
                  </div>
                </div>

                <div style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #fed7aa, #fdba74)',
                  borderRadius: '6px',
                  padding: '6px',
                  border: '1px solid #fb923c',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '8px', color: '#7c2d12', fontWeight: '600', marginBottom: '2px' }}>
                    INSP
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#9a3412' }}>
                    {inspectionTasks}
                  </div>
                </div>
              </div>

              {/* 待完成任务总数 */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '6px',
                padding: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '8px',
                fontSize: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>Total Pending Tasks</span>
                <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{totalTasks + aiGeneratedTasks}</span>
              </div>

              {/* 本周执行计划 */}
              <div style={{
                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                borderRadius: '8px',
                padding: '10px',
                border: '2px solid #3b82f6',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: '700', marginBottom: '8px' }}>
                  THIS WEEK'S PLAN
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#1e40af', fontWeight: '600' }}>
                      SITES
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a8a' }}>
                      {WEEKLY_PRIORITY_CAPACITY}
                    </div>
                    <div style={{ fontSize: '7px', color: '#64748b' }}>
                      of {activeSites}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#1e40af', fontWeight: '600' }}>
                      TASKS
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a8a' }}>
                      {weeklyTasks}
                    </div>
                    <div style={{ fontSize: '7px', color: '#64748b' }}>
                      operations
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#1e40af', fontWeight: '600' }}>
                      COST
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a8a' }}>
                      ${(WEEKLY_PRIORITY_CAPACITY * 225 / 1000).toFixed(1)}K
                    </div>
                    <div style={{ fontSize: '7px', color: '#64748b' }}>
                      baseline
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
                  AI-prioritized for this week
            </div>
          </div>
            </>
          )}
        </div>

        {/* 资产状态卡片 - 固定高度，内部滚动 */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.1)',
          border: '1px solid #bbf7d0',
          padding: '20px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '200px',
          maxHeight: '300px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexShrink: 0 }}>
            <div style={{
              padding: '6px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
            }}>
              <Package style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '0', lineHeight: '1.2' }}>
                Active Transport Sites
              </h3>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                Sites with pending tasks
              </p>
            </div>
          </div>
          
          {/* 资产列表 - 可滚动 */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginRight: '-8px',
            paddingRight: '8px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {assets.length === 0 ? (
                <div style={{
                  background: 'white',
                  borderRadius: '10px',
                  padding: '20px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13px'
                }}>
                  Loading task pool...
                </div>
              ) : (
                // 只显示有运输任务的工地，并按任务数量排序
                assets
                  .filter(asset => asset.transport_tasks && asset.transport_tasks.length > 0)
                  .sort((a, b) => (b.transport_tasks?.length || 0) - (a.transport_tasks?.length || 0))
                  .map(asset => {
                  const deliveryCount = asset.transport_tasks?.filter((t: any) => 
                    t.type.toLowerCase().includes('delivery')).length || 0;
                  const collectionCount = asset.transport_tasks?.filter((t: any) => 
                    t.type.toLowerCase().includes('collection')).length || 0;
                  const equipmentCount = asset.equipment?.length || 0;
                  
                  return (
                  <div key={asset.id} style={{
                    background: 'white',
                    borderRadius: '10px',
                      padding: '10px',
                    display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                      border: `1px solid ${STATUS_COLORS[asset.status]}40`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                            🏗️ {asset.id}
                      </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                            {asset.customer || 'Site'} {asset.location?.suburb && `• ${asset.location.suburb}`}
                      </div>
                    </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: '600',
                          backgroundColor: `${STATUS_COLORS[asset.status]}15`,
                          border: `1px solid ${STATUS_COLORS[asset.status]}`,
                          color: STATUS_COLORS[asset.status]
                        }}>
                          {getStatusIcon(asset.status)}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '8px', 
                        fontSize: '10px',
                        paddingTop: '4px',
                        borderTop: '1px solid #f1f5f9'
                      }}>
                        {equipmentCount > 0 && (
                          <div style={{ color: '#64748b' }}>
                            📦 {equipmentCount} items
                          </div>
                        )}
                        {deliveryCount > 0 && (
                          <div style={{ color: '#f59e0b', fontWeight: '600' }}>
                            ↓{deliveryCount}
                          </div>
                        )}
                        {collectionCount > 0 && (
                          <div style={{ color: '#8b5cf6', fontWeight: '600' }}>
                            ↑{collectionCount}
                          </div>
                        )}
                        {deliveryCount === 0 && collectionCount === 0 && (
                          <div style={{ color: '#10b981', fontSize: '9px' }}>
                            ✓ Stable
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 优化按钮 - 固定在底部（只在任务池分析后显示） */}
      {taskPoolAnalyzed && (
      <div style={{ padding: '0 24px 24px 24px', flexShrink: 0 }}>
        <button 
          onClick={onOptimize}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px',
            background: isLoading 
              ? 'linear-gradient(135deg, #cbd5e1, #94a3b8)' 
                : 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            borderRadius: '12px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: isLoading 
              ? 'none' 
                : '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(16, 185, 129, 0.3)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isLoading 
              ? 'none' 
                : '0 10px 15px -3px rgba(16, 185, 129, 0.3)';
          }}
        >
          {isLoading ? (
            <>
              <LoaderCircle style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                <span>Optimizing Routes...</span>
            </>
          ) : (
              <span>Optimize Routes</span>
          )}
        </button>
      </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: white;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: white;
          cursor: pointer;
          border-radius: 50%;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        /* 自定义滚动条 */
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;