import { ShieldCheck, Sparkles } from 'lucide-react';

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
              Sustainable Asset Intelligence
            </span>
          </h1>
        </div>
      </div>
      
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0',
          borderRadius: '999px'
        }}>
          <Sparkles style={{ width: '16px', height: '16px', color: '#10b981' }} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#059669' }}>
            AI Powered
          </span>
        </div>
        <div style={{ 
          height: '32px', 
          width: '1px', 
          backgroundColor: '#e2e8f0' 
        }}></div>
        <div style={{ fontSize: '14px', color: '#64748b' }}>
          <span style={{ fontWeight: '600', color: '#475569' }}>MVP</span> Demo v1.0
        </div>
      </div>
    </header>
  );
};

export default Header;