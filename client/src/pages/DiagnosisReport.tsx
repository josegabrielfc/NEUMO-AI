import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, ShieldAlert, Heart, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import type { Diagnosis } from '../types';
import { getDiagnosisById } from '../services/api';

export default function DiagnosisReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getDiagnosisById(Number(id));
        setDiagnosis(data);
      } catch (err: any) {
        setError(err.message || 'Error al recuperar el reporte clínico.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiagnosis();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString.replace(' ', 'T') + 'Z');
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="card" style={styles.stateCard}>
        <p style={styles.stateText}>Cargando reporte clínico...</p>
      </div>
    );
  }

  if (error || !diagnosis) {
    return (
      <div className="card" style={{ ...styles.stateCard, borderColor: 'var(--danger-border)' }}>
        <p style={{ ...styles.stateText, color: 'var(--danger)' }}>
          {error || 'El diagnóstico solicitado no existe o fue eliminado.'}
        </p>
        <button onClick={() => navigate('/history')} className="btn btn-outline" style={{ marginTop: '16px' }}>
          Volver al Historial
        </button>
      </div>
    );
  }

  const isPneumonia = diagnosis.resultado === 'NEUMONÍA';

  return (
    <div style={styles.container} className="printable-report">
      {/* Back button and Print options */}
      <div style={styles.actionHeader} className="no-print">
        <button onClick={() => navigate('/history')} className="btn btn-ghost" style={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Volver al Historial</span>
        </button>
        <button onClick={handlePrint} className="btn btn-secondary">
          <Printer size={16} />
          <span>Imprimir Reporte</span>
        </button>
      </div>

      {/* Main Report Card */}
      <div className="card" style={styles.reportCard}>
        {/* Hospital Header for Print */}
        <div style={styles.hospitalHeader}>
          <div>
            <h1 style={styles.hospitalName}>Clínica Los Andes</h1>
            <p style={styles.hospitalDept}>Unidad de Radiología e Imagenología Diagnóstica</p>
          </div>
          <div style={styles.reportTitleBlock}>
            <h2 style={styles.reportMainTitle}>REPORTE CLÍNICO DE DIAGNÓSTICO</h2>
            <p style={styles.reportId}>Estudio ID: # {diagnosis.id.toString().padStart(6, '0')}</p>
          </div>
        </div>

        <div style={styles.divider}></div>

        {/* Patient Block */}
        <div style={styles.sectionBlock}>
          <div style={styles.sectionHeaderTitle}>
            <User size={18} color="var(--primary)" />
            <h3 style={styles.sectionTitle}>1. INFORMACIÓN DEL PACIENTE</h3>
          </div>
          <div style={styles.patientGrid}>
            <div style={styles.gridItem}>
              <span style={styles.label}>Nombres:</span>
              <span style={styles.val}>{diagnosis.nombres}</span>
            </div>
            <div style={styles.gridItem}>
              <span style={styles.label}>Apellidos:</span>
              <span style={styles.val}>{diagnosis.apellidos}</span>
            </div>
            <div style={styles.gridItem}>
              <span style={styles.label}>Identificación:</span>
              <span style={styles.val}>{diagnosis.identificacion}</span>
            </div>
            <div style={styles.gridItem}>
              <span style={styles.label}>Edad / Sexo:</span>
              <span style={styles.val}>{diagnosis.edad} años / {diagnosis.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
            </div>
          </div>
          
          <div style={{ ...styles.gridItemFull, marginTop: '12px' }}>
            <span style={styles.label}>Síntomas Registrados:</span>
            <span style={styles.val}>
              {diagnosis.sintomas.length > 0 ? diagnosis.sintomas.join(', ') : 'Ninguno reportado'}
            </span>
          </div>

          {diagnosis.descripcion && (
            <div style={{ ...styles.gridItemFull, marginTop: '12px' }}>
              <span style={styles.label}>Descripción Adicional / Antecedentes:</span>
              <span style={styles.valText}>{diagnosis.descripcion}</span>
            </div>
          )}
        </div>

        <div style={styles.divider}></div>

        {/* Study details & Prediction */}
        <div style={styles.sectionBlock}>
          <div style={styles.sectionHeaderTitle}>
            <FileText size={18} color="var(--primary)" />
            <h3 style={styles.sectionTitle}>2. DETALLES DEL ESTUDIO Y ANÁLISIS DE IA</h3>
          </div>
          
          <div style={styles.studyGrid}>
            <div style={styles.studyMeta}>
              <div style={styles.gridItem}>
                <span style={styles.label}>Fecha y Hora de Carga:</span>
                <div style={styles.iconVal}>
                  <Calendar size={14} color="var(--gray)" />
                  <span style={styles.val}>{formatDate(diagnosis.created_at)}</span>
                </div>
              </div>
              <div style={styles.gridItem}>
                <span style={styles.label}>Archivo de Radiografía:</span>
                <span style={styles.val}>{diagnosis.imagen_nombre}</span>
              </div>
              <div style={styles.gridItem}>
                <span style={styles.label}>Algoritmo Predictor:</span>
                <span style={styles.val}>NEUMO-AI MobileNetV2 (Keras/TF)</span>
              </div>
            </div>

            {/* Visual prediction results */}
            <div style={styles.studyResultBlock}>
              <div style={styles.resultBadgeContainer}>
                <span style={styles.label}>Diagnóstico Preliminar:</span>
                <span className={`badge ${isPneumonia ? 'badge-pneumonia' : 'badge-normal'}`} style={styles.reportBadge}>
                  {diagnosis.resultado}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.divider}></div>

        {/* Clinical Interpretation & Warning */}
        <div style={styles.sectionBlock}>
          <div style={styles.sectionHeaderTitle}>
            <Heart size={18} color="var(--primary)" />
            <h3 style={styles.sectionTitle}>3. IMPRESIÓN Y RECOMENDACIONES CLÍNICAS</h3>
          </div>

          <div style={styles.interpretText}>
            {isPneumonia ? (
              <div style={styles.alertBoxDanger}>
                <div style={styles.alertHeader}>
                  <ShieldAlert size={20} color="var(--danger)" />
                  <h4 style={{ color: 'var(--danger)', fontSize: '15px', fontWeight: 600 }}>
                    ADVERTENCIA MÉDICA CRÍTICA — SOSPECHA DE NEUMONÍA
                  </h4>
                </div>
                <p style={styles.alertDesc}>
                  El análisis computarizado del tórax mediante el modelo de red neuronal convolucional ha detectado opacidades pulmonares anormales altamente consistentes con un cuadro de **NEUMONÍA**.
                </p>
                <div style={styles.clinicalNotes}>
                  <p><strong>Recomendaciones para el Personal Médico:</strong></p>
                  <ul>
                    <li>Realizar auscultación pulmonar inmediata en búsqueda de estertores o murmullo vesicular disminuido.</li>
                    <li>Monitorear la saturación de oxígeno por pulsioximetría.</li>
                    <li>Iniciar de manera prioritaria el esquema de terapia antibiótica o antiviral empírica según guías clínicas locales.</li>
                    <li>Correlacionar de forma inmediata con estudios clínicos de laboratorio (Hemograma, PCR, Procalcitonina).</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div style={styles.alertBoxSuccess}>
                <div style={styles.alertHeader}>
                  <CheckCircle size={20} color="var(--success)" />
                  <h4 style={{ color: 'var(--success)', fontSize: '15px', fontWeight: 600 }}>
                    ESTUDIO PRELIMINAR COMPATIBLE CON LA NORMALIDAD
                  </h4>
                </div>
                <p style={styles.alertDesc}>
                  El modelo predictivo no ha detectado densidades consolidadas significativas o infiltrados alveolares que indiquen la presencia de neumonía bacteriana o viral.
                </p>
                <div style={styles.clinicalNotes}>
                  <p><strong>Recomendaciones para el Personal Médico:</strong></p>
                  <ul>
                    <li>Si la clínica respiratoria del paciente es severa (disnea, fiebre persistente), no descarte falsos negativos y considere realizar un TAC de tórax de alta resolución o seguimiento clínico estrecho en 24-48 horas.</li>
                    <li>Tratamiento sintomático general y control ambulatorio según evolución del cuadro respiratorio.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report Footer / Signature Area */}
        <div style={styles.reportFooter}>
          <div style={styles.signatureRow}>
            <div style={styles.signatureBlock}>
              <div style={styles.signatureLine}></div>
              <p style={styles.signerName}>Dr. Radiólogo de Turno</p>
              <p style={styles.signerDetail}>Firma del Profesional e Intérprete</p>
            </div>
            <div style={styles.signatureBlock}>
              <div style={styles.signatureLine}></div>
              <p style={styles.signerName}>NEUMO-AI Diagnostic System</p>
              <p style={styles.signerDetail}>Validación Automatizada de Software</p>
            </div>
          </div>
          <p style={styles.disclaimer}>
            * NOTA: Este es un informe preliminar generado mediante un sistema informático de diagnóstico asistido por IA (MobileNetV2). Debe ser interpretado e integrado con la clínica del paciente exclusivamente por un profesional médico calificado.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    padding: '8px 12px',
  },
  reportCard: {
    backgroundColor: 'var(--white)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    padding: '40px',
  },
  hospitalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  hospitalName: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--dark)',
  },
  hospitalDept: {
    fontSize: '13px',
    color: 'var(--gray)',
    fontWeight: 500,
  },
  reportTitleBlock: {
    textAlign: 'right',
  },
  reportMainTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--gray-dark)',
    letterSpacing: '0.5px',
  },
  reportId: {
    fontSize: '13px',
    color: 'var(--primary)',
    fontWeight: 600,
    marginTop: '4px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--gray-light)',
    width: '100%',
    margin: '24px 0',
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionHeaderTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '14px',
    color: 'var(--gray-dark)',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  patientGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 40px',
  },
  gridItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  gridItemFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--gray)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  val: {
    fontSize: '14.5px',
    fontWeight: 600,
    color: 'var(--dark)',
  },
  valText: {
    fontSize: '14px',
    color: 'var(--gray-dark)',
    lineHeight: 1.5,
  },
  iconVal: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  studyGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '40px',
    alignItems: 'start',
  },
  studyMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  studyResultBlock: {
    backgroundColor: 'var(--bg)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    border: '1px solid var(--gray-light)',
  },
  resultBadgeContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportBadge: {
    fontSize: '14px',
    padding: '6px 16px',
  },
  interpretText: {
    marginTop: '4px',
  },
  alertBoxDanger: {
    backgroundColor: 'var(--danger-light)',
    border: '1px solid var(--danger-border)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
  },
  alertBoxSuccess: {
    backgroundColor: 'var(--success-light)',
    border: '1px solid var(--success-border)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  alertDesc: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: 'var(--gray-dark)',
    marginBottom: '16px',
  },
  clinicalNotes: {
    fontSize: '13px',
    color: 'var(--gray-dark)',
    borderTop: '1px solid rgba(17, 17, 17, 0.05)',
    paddingTop: '16px',
  },
  reportFooter: {
    marginTop: '60px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  signatureRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '40px',
    marginTop: '20px',
  },
  signatureBlock: {
    flex: 1,
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1px solid var(--gray)',
    width: '200px',
    margin: '0 auto 8px',
  },
  signerName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--dark)',
  },
  signerDetail: {
    fontSize: '11px',
    color: 'var(--gray)',
  },
  disclaimer: {
    fontSize: '10.5px',
    color: 'var(--gray)',
    lineHeight: 1.4,
    textAlign: 'justify',
    borderTop: '1px solid var(--gray-light)',
    paddingTop: '16px',
  },
  stateCard: {
    padding: '60px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
  },
  stateText: {
    color: 'var(--gray)',
    fontSize: '15px',
    fontWeight: 500,
  },
};
