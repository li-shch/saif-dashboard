import { ShieldCheck, Zap } from 'lucide-react';

const Header = () => {
  return (
    <header style={{
      height: '64px',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #f1f5f9',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          position: 'relative',
          padding: '10px',
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
        }}>
          <ShieldCheck style={{ width: '28px', height: '28px', color: 'white' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>
            SAIF
            <span style={{ 
              marginLeft: '12px', 
              fontSize: '14px', 
              fontWeight: 'normal', 
              color: '#64748b' 
            }}>
              Sustainable Asset Intelligence Framework
            </span>
          </h1>
        </div>
      </div>
      
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: '1px solid #93c5fd',
          borderRadius: '999px'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af' }}>
            📊 Real Data
          </span>
          <span style={{ fontSize: '11px', color: '#3b82f6' }}>
            Jun 2024
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '1px solid #fbbf24',
          borderRadius: '999px'
        }}>
          <Zap style={{ width: '14px', height: '14px', color: '#d97706' }} />
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#b45309' }}>
            Designed by Pentastorm
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;