// src/components/ResultsModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot } from 'lucide-react';
import type { OptimizationResult } from '../api/client';

interface ResultsModalProps {
  results: OptimizationResult | null;
  onClose: () => void;
}

const ResultsModal = ({ results, onClose }: ResultsModalProps) => {
  return (
    <AnimatePresence>
      {results && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl m-4 text-left relative"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '42rem',
              margin: '1rem',
              textAlign: 'left',
              position: 'relative',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* 固定头部 */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  color: '#9ca3af',
                  transition: 'color 0.2s',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#4b5563'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  flexShrink: 0,
                  display: 'flex',
                  height: '3rem',
                  width: '3rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <Bot style={{ height: '2rem', width: '2rem', color: 'white' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                    Optimization Complete
                  </h2>
                  <p style={{ marginTop: '0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    {results.explanation ? results.explanation.taskConsolidation : 'Route optimization completed successfully'}
                  </p>
                </div>
              </div>
            </div>

            {/* 优化结果内容 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              backgroundColor: '#f9fafb'
            }}>
              {/* 执行计划总览 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  marginBottom: '1rem'
                }}>
                  Execution Plan Summary
                </h3>
                
                {/* 路线统计 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid #3b82f6'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.25rem' }}>
                      OPTIMIZED ROUTES
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e3a8a' }}>
                      {results.optimizedRoutes.length}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#3b82f6', marginTop: '0.25rem' }}>
                      vehicles deployed
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid #fbbf24'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#92400e', fontWeight: '600', marginBottom: '0.25rem' }}>
                      SITES VISITED
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#b45309' }}>
                      {results.explanation?.totalSitesVisited || 66}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#d97706', marginTop: '0.25rem' }}>
                      this week
                    </div>
                  </div>
                </div>
                
              </div>

              {/* 路线详情 - 展示每条路线访问的工地 */}
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: '700', 
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  🚚 Route Details
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {results.optimizedRoutes.map((route, index) => (
                    <div key={index} style={{
                      background: 'white',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      border: `2px solid ${['#16a34a', '#c026d3', '#db2777', '#0ea5e9'][index]}`,
                      borderLeft: `6px solid ${['#16a34a', '#c026d3', '#db2777', '#0ea5e9'][index]}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1f2937' }}>
                          {route.vehicleId}
                        </div>
                        {route.distance && (
                          <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                            {route.distance.toFixed(1)} km
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                        Visits {route.route.length - 2} sites (depot → sites → depot)
                      </div>
                  </div>
                ))}
                </div>
              </div>
            </div>

            {/* 固定底部 - 总节省展示 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                borderTop: '2px solid #86efac'
              }}
            >
              <div style={{ 
                background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                borderRadius: '0.75rem',
                padding: '1rem',
                border: '2px solid #10b981'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#065f46', marginBottom: '0.75rem', textAlign: 'center' }}>
                  OPTIMIZATION IMPACT
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#047857' }}>
                      ${(results.summary.costSaving / 1000).toFixed(1)}K
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#065f46', marginTop: '0.125rem' }}>
                      Cost Saved
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#047857' }}>
                      {results.summary.distanceSavingKm} km
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#065f46', marginTop: '0.125rem' }}>
                      Distance
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#047857' }}>
                      {results.summary.emissionsSavingKgCO2} kg
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#065f46', marginTop: '0.125rem' }}>
                      CO₂
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '0.625rem', color: '#059669', marginTop: '0.5rem', textAlign: 'center', fontStyle: 'italic' }}>
                  vs. individual site visits (unoptimized baseline)
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultsModal;