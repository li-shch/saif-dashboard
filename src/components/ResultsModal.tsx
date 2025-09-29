// src/components/ResultsModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, TrendingUp, Leaf, Route } from 'lucide-react';
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
                    AI Optimization Complete
                  </h2>
                  <p style={{ marginTop: '0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    SAIF has analyzed {results.decisionsMade.length} assets and generated optimal routes
                  </p>
                </div>
              </div>
            </div>

            {/* 可滚动的决策列表 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
              minHeight: '300px',
              maxHeight: '400px'
            }}>
              <h3 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem'
              }}>
                Decision Details
              </h3>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {results.decisionsMade.map((decision, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    style={{
                      backgroundColor: 'white',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>
                          <span style={{ 
                            color: decision.decision === 'EXECUTE_SWAP' ? '#8b5cf6' : 
                                   decision.decision === 'STAY_ON_SITE' ? '#10b981' :
                                   decision.decision === 'RETRIEVE_TO_DEPOT' ? '#3b82f6' : '#f59e0b',
                            fontWeight: '700'
                          }}>
                            {decision.decision.replace(/_/g, ' ')}
                          </span>
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>
                          Asset: <strong>{decision.assetId}</strong>
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.5rem' }}>
                          {decision.reason}
                        </p>
                        {decision.relatedAssetId && (
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                            <span style={{ 
                              backgroundColor: '#f3f4f6', 
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem'
                            }}>
                              Related: {decision.relatedAssetId}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
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
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#166534', marginBottom: '0.25rem' }}>
                  TOTAL OPTIMIZATION IMPACT
                </p>
                <p style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold', 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em',
                  lineHeight: '1'
                }}>
                  ${results.summary.costSaving.toFixed(2)}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.125rem' }}>
                  Cost Savings
                </p>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '2.5rem',
                marginTop: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Route style={{ width: '18px', height: '18px', color: '#16a34a' }} />
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '700', color: '#15803d' }}>
                      {results.summary.distanceSavingKm} km
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#166534' }}>Distance Saved</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Leaf style={{ width: '18px', height: '18px', color: '#16a34a' }} />
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '700', color: '#15803d' }}>
                      {results.summary.emissionsSavingKgCO2} kg
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#166534' }}>CO₂ Reduced</p>
                  </div>
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