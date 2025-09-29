import { SlidersHorizontal, Package, LoaderCircle, Zap, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import type { SimulationParams } from '../App';
import type { Asset } from '../api/client';

interface ControlPanelProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  onOptimize: () => void;
  isLoading: boolean;
  assets?: Asset[];
}

const ControlPanel = ({ params, setParams, onOptimize, isLoading, assets = [] }: ControlPanelProps) => {

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, utilizationRate: Number(e.target.value) });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, hireDuration: Number(e.target.value) });
  };

  // 状态颜色映射
  const STATUS_COLORS: Record<string, string> = {
    'available': '#22c55e',
    'in_use': '#3b82f6',
    'needs_inspection': '#f97316',
    'rented_from_competitor': '#ef4444',
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'available': return <CheckCircle style={{ width: '14px', height: '14px' }} />;
      case 'in_use': return <Package style={{ width: '14px', height: '14px' }} />;
      case 'needs_inspection': return <AlertCircle style={{ width: '14px', height: '14px' }} />;
      case 'rented_from_competitor': return <MapPin style={{ width: '14px', height: '14px' }} />;
      default: return null;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
      <div style={{ padding: '20px 24px 16px 24px', flexShrink: 0 }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #475569, #64748b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '2px'
        }}>
          Control Center
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Optimize your asset performance
        </p>
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
        {/* 模拟参数卡片 */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f1f5f9',
          padding: '20px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              padding: '8px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '10px',
              boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
            }}>
              <SlidersHorizontal style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                Simulation Parameters
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Fine-tune your optimization settings
              </p>
            </div>
          </div>

          {/* 利用率滑块 */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>
                Asset Utilization Rate
              </label>
              <span style={{
                padding: '2px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'white',
                background: params.utilizationRate < 70 ? '#ef4444' : 
                           params.utilizationRate < 90 ? '#f59e0b' : 
                           params.utilizationRate < 110 ? '#10b981' : '#3b82f6'
              }}>
                {params.utilizationRate}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="130"
              value={params.utilizationRate}
              onChange={handleRateChange}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                outline: 'none',
                WebkitAppearance: 'none',
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(params.utilizationRate - 50) / 80 * 100}%, #e5e7eb ${(params.utilizationRate - 50) / 80 * 100}%, #e5e7eb 100%)`
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#94a3b8' }}>
              <span>Low</span>
              <span>Optimal</span>
              <span>High</span>
            </div>
          </div>

          {/* 租期输入 */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '10px' }}>
              Predicted Hire Duration
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={params.hireDuration}
                onChange={handleDurationChange}
                style={{
                  width: '100%',
                  padding: '10px 45px 10px 14px',
                  backgroundColor: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  textAlign: 'center',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <span style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '13px',
                color: '#64748b',
                pointerEvents: 'none'
              }}>
                days
              </span>
            </div>
          </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexShrink: 0 }}>
            <div style={{
              padding: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '10px',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
            }}>
              <Package style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                Asset Status
              </h3>
              <p style={{ fontSize: '11px', color: '#475569' }}>
                Real-time monitoring
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
                  Loading assets...
                </div>
              ) : (
                assets.map(asset => (
                  <div key={asset.id} style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                        {asset.id}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Type: {asset.type}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {asset.health_score && (
                        <div style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: asset.health_score > 80 ? '#22c55e' : asset.health_score > 60 ? '#f59e0b' : '#ef4444'
                        }}>
                          {asset.health_score}%
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: (STATUS_COLORS[asset.status] || '#64748b') + '20',
                        color: STATUS_COLORS[asset.status] || '#64748b'
                      }}>
                        {getStatusIcon(asset.status)}
                        <span style={{ fontSize: '11px', fontWeight: '500' }}>
                          {formatStatus(asset.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 优化按钮 - 固定在底部 */}
      <div style={{ padding: '0 24px 24px 24px', flexShrink: 0 }}>
        <button 
          onClick={onOptimize}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px',
            background: isLoading 
              ? 'linear-gradient(135deg, #cbd5e1, #94a3b8)' 
              : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            borderRadius: '12px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: isLoading 
              ? 'none' 
              : '0 10px 15px -3px rgba(139, 92, 246, 0.3)',
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
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(139, 92, 246, 0.3)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isLoading 
              ? 'none' 
              : '0 10px 15px -3px rgba(139, 92, 246, 0.3)';
          }}
        >
          {isLoading ? (
            <>
              <LoaderCircle style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
              <span>Optimizing...</span>
            </>
          ) : (
            <>
              <Zap style={{ width: '18px', height: '18px' }} />
              <span>Optimize Now</span>
            </>
          )}
        </button>
      </div>

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