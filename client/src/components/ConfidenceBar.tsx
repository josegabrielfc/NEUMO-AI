interface ConfidenceBarProps {
  resultado: 'NORMAL' | 'NEUMONÍA';
  confianza: number; // 0.0 to 100.0
}

export default function ConfidenceBar({ resultado, confianza }: ConfidenceBarProps) {
  const isPneumonia = resultado === 'NEUMONÍA';
  
  // Format percentage
  const pct = `${confianza.toFixed(1)}%`;
  
  return (
    <div className="confidence-wrapper">
      <div className="confidence-header">
        <span className="form-label" style={{ color: 'var(--gray-dark)' }}>
          Nivel de Certeza / Confianza
        </span>
        <span 
          style={{ 
            fontWeight: 700, 
            color: isPneumonia ? 'var(--danger)' : 'var(--success)',
            fontSize: '14px'
          }}
        >
          {pct}
        </span>
      </div>
      
      <div className="confidence-bg">
        <div 
          className={`confidence-fill ${isPneumonia ? 'pneumonia' : 'normal'}`}
          style={{ width: `${confianza}%` }}
        />
      </div>
    </div>
  );
}
