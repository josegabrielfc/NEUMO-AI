import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, Activity, RefreshCw, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import type { Patient, PredictionResult } from '../types';
import { predictPneumonia } from '../services/api';
import ConfidenceBar from '../components/ConfidenceBar';

const initialPatient: Patient = {
  nombres: '',
  apellidos: '',
  identificacion: '',
  edad: '',
  sexo: '',
  sintomas: [],
  descripcion: '',
};

export default function NewDiagnosis() {
  const navigate = useNavigate();
  
  // State
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPatient(prev => ({
      ...prev,
      [name]: name === 'edad' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSymptomChange = (symptom: string) => {
    setPatient(prev => {
      const sintomas = prev.sintomas.includes(symptom)
        ? prev.sintomas.filter(s => s !== symptom)
        : [...prev.sintomas, symptom];
      return { ...prev, sintomas };
    });
  };

  // Image validation helper
  const validateAndSetFile = (file: File) => {
    setError(null);
    
    // Validate file type (RF-01)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Formato de archivo inválido. Solo se admiten imágenes JPG, JPEG o PNG.');
      return;
    }
    
    // Validate file size (RF-01 - 10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('El tamaño de la imagen excede el límite de 10 MB.');
      return;
    }
    
    setImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Form validations
    if (!patient.nombres || !patient.apellidos || !patient.identificacion || patient.edad === '' || !patient.sexo) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }
    
    if (!imageFile) {
      setError('Por favor cargue una radiografía de tórax para analizar.');
      return;
    }
    
    setLoading(true);
    setLoadingStage('Normalizando tamaño (224x224)...');
    
    try {
      // Simulate steps for nice clinical UI feel
      setTimeout(() => setLoadingStage('Ejecutando modelo Deep Learning (MobileNetV2)...'), 1000);
      setTimeout(() => setLoadingStage('Extrayendo características pulmonares...'), 2000);
      
      const res = await predictPneumonia(patient, imageFile);
      
      setTimeout(() => {
        setResult(res);
        setLoading(false);
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Error en el procesamiento de la imagen.');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPatient(initialPatient);
    setImageFile(null);
    setImagePreview('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Nuevo Análisis Clínico</h2>
        <p style={styles.subtitle}>Ingrese los datos del paciente y cargue la radiografía de tórax para iniciar la detección asistida.</p>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <AlertTriangle size={20} color="var(--danger)" />
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {loading && (
        <div style={styles.loadingContainer}>
          <Activity size={48} color="var(--primary)" style={styles.pulseIcon} />
          <h3 style={styles.loadingTitle}>Procesando Estudio</h3>
          <p style={styles.loadingText}>{loadingStage}</p>
          <div style={styles.progressBarBg}>
            <div style={styles.progressBarFill}></div>
          </div>
        </div>
      )}

      {!loading && !result && (
        <form onSubmit={handleSubmit} style={styles.grid}>
          {/* Left panel: Patient Data Form */}
          <div className="card" style={styles.formCard}>
            <h3 style={styles.sectionTitle}>Datos del Paciente</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombres <span className="required">*</span></label>
                <input
                  type="text"
                  name="nombres"
                  value={patient.nombres}
                  onChange={handleTextChange}
                  className="input-text"
                  placeholder="Ej. Juan"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Apellidos <span className="required">*</span></label>
                <input
                  type="text"
                  name="apellidos"
                  value={patient.apellidos}
                  onChange={handleTextChange}
                  className="input-text"
                  placeholder="Ej. Pérez"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Identificación (Cédula/DNI) <span className="required">*</span></label>
              <input
                type="text"
                name="identificacion"
                value={patient.identificacion}
                onChange={handleTextChange}
                className="input-text"
                placeholder="Identificación única del paciente"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Edad <span className="required">*</span></label>
                <input
                  type="number"
                  name="edad"
                  value={patient.edad}
                  onChange={handleTextChange}
                  className="input-text"
                  placeholder="Ej. 45"
                  min="0"
                  max="150"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sexo <span className="required">*</span></label>
                <select
                  name="sexo"
                  value={patient.sexo}
                  onChange={handleTextChange}
                  className="select-input"
                  required
                >
                  <option value="">Seleccione...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Síntomas Actuales</label>
              <div className="checkbox-group">
                {['Fiebre', 'Tos', 'Dificultad respiratoria', 'Dolor torácico'].map(symptom => (
                  <label key={symptom} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={patient.sintomas.includes(symptom)}
                      onChange={() => handleSymptomChange(symptom)}
                      className="checkbox-input"
                    />
                    <span>{symptom}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción o Hallazgos Adicionales</label>
              <textarea
                name="descripcion"
                value={patient.descripcion}
                onChange={handleTextChange}
                className="textarea-input"
                style={{ height: '80px', resize: 'vertical' }}
                placeholder="Observaciones clínicas previas..."
              />
            </div>
          </div>

          {/* Right panel: Image Uploader */}
          <div className="card" style={styles.uploaderCard}>
            <h3 style={styles.sectionTitle}>Radiografía de Tórax</h3>
            
            {!imagePreview ? (
              <div
                className={`uploader-box ${isDragOver ? 'dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ flexGrow: 1, minHeight: '300px' }}
              >
                <UploadCloud className="uploader-icon" />
                <p className="uploader-title">Arrastre el archivo aquí</p>
                <p className="uploader-desc">o haga clic para examinar archivos</p>
                <p style={styles.formatInfo}>Soporta: JPG, JPEG, PNG (Máx. 10MB)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div style={styles.previewWrapper}>
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Vista previa radiografía" className="image-preview" />
                  <button type="button" onClick={handleRemoveImage} className="remove-image-btn" title="Quitar imagen">
                    ×
                  </button>
                </div>
                <div style={styles.fileDetails}>
                  <p style={styles.fileName}>{imageFile?.name}</p>
                  <p style={styles.fileSize}>{(imageFile!.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
              <Activity size={18} />
              <span>Ejecutar Diagnóstico IA</span>
            </button>
          </div>
        </form>
      )}

      {/* Result presentation panel */}
      {result && (
        <div style={styles.resultContainer}>
          <div className="card" style={styles.resultGrid}>
            
            {/* Visual preview of X-ray */}
            <div style={styles.resultImageCol}>
              <h4 style={styles.resultSubTitle}>Imagen Analizada</h4>
              <img src={imagePreview} alt="Radiografía analizada" style={styles.analyzedImage} />
              <div style={styles.imgLabel}>
                <span>Tamaño: 224x224 (Redimensionado)</span>
              </div>
            </div>

            {/* AI Diagnostics details */}
            <div style={styles.resultDetailsCol}>
              <div style={styles.resultHeaderBadge}>
                <span style={styles.resultLabel}>Resultado del Diagnóstico</span>
                <span className={`badge ${result.resultado === 'NEUMONÍA' ? 'badge-pneumonia' : 'badge-normal'}`}>
                  {result.resultado}
                </span>
              </div>

              <div style={styles.divider}></div>

              <div style={styles.patientMetaBlock}>
                <h4 style={styles.resultSubTitle}>Detalles del Paciente</h4>
                <p><strong>Nombre completo:</strong> {result.nombres} {result.apellidos}</p>
                <p><strong>Identificación:</strong> {result.identificacion}</p>
                <p><strong>Edad / Sexo:</strong> {result.edad} años / {result.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                {result.sintomas.length > 0 && (
                  <p><strong>Síntomas:</strong> {result.sintomas.join(', ')}</p>
                )}
              </div>

              <div style={styles.divider}></div>

              {/* Confidence metric */}
              <ConfidenceBar resultado={result.resultado} confianza={result.confianza} />

              <div style={styles.divider}></div>

              {/* Recommendations and Warnings */}
              <div style={styles.recommendationCard}>
                {result.resultado === 'NEUMONÍA' ? (
                  <div style={styles.recDanger}>
                    <div style={styles.recIconTitle}>
                      <AlertTriangle color="var(--danger)" size={20} />
                      <strong style={{ color: 'var(--danger)' }}>¡Alerta Clínica!</strong>
                    </div>
                    <p style={styles.recText}>
                      Se han identificado hallazgos compatibles con consolidación alveolar sugestiva de **Neumonía** con un nivel de confianza del {result.confianza}%. Se recomienda remitir de inmediato al paciente para valoración por el médico especialista, toma de laboratorios clínicos y correlación diagnóstica urgente.
                    </p>
                  </div>
                ) : (
                  <div style={styles.recSuccess}>
                    <div style={styles.recIconTitle}>
                      <CheckCircle color="var(--success)" size={20} />
                      <strong style={{ color: 'var(--success)' }}>Estudio Preliminar Normal</strong>
                    </div>
                    <p style={styles.recText}>
                      No se observan opacidades focales u otros signos de consolidación que sugieran una neumonía activa. Se recomienda correlacionar con la evolución clínica del paciente.
                    </p>
                  </div>
                )}
              </div>

              <div style={styles.actionRow}>
                <button onClick={handleReset} className="btn btn-outline">
                  <RefreshCw size={16} />
                  <span>Nuevo Diagnóstico</span>
                </button>
                <button 
                  onClick={() => navigate(`/report/${result.id}`)} 
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                >
                  <FileText size={16} />
                  <span>Ver Reporte Detallado</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    marginBottom: '8px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--dark)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--gray)',
    marginTop: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '32px',
    alignItems: 'start',
  },
  formCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  uploaderCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minHeight: '480px',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--dark)',
    marginBottom: '16px',
    borderBottom: '1px solid var(--gray-light)',
    paddingBottom: '8px',
  },
  formatInfo: {
    fontSize: '11px',
    color: 'var(--gray)',
    marginTop: '4px',
  },
  previewWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    flexGrow: 1,
    justifyContent: 'center',
  },
  fileDetails: {
    textAlign: 'center',
  },
  fileName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--dark)',
    wordBreak: 'break-all',
  },
  fileSize: {
    fontSize: '11px',
    color: 'var(--gray)',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    borderRadius: 'var(--radius-md)',
  },
  errorAlert: {
    backgroundColor: 'var(--danger-light)',
    border: '1px solid var(--danger-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  errorText: {
    color: 'var(--danger)',
    fontSize: '14px',
    fontWeight: 500,
  },
  loadingContainer: {
    backgroundColor: 'var(--white)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    padding: '60px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: '400px',
  },
  pulseIcon: {
    animation: 'pulse 1.5s infinite ease-in-out',
    marginBottom: '20px',
  },
  loadingTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--dark)',
    marginBottom: '8px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--gray)',
    marginBottom: '24px',
  },
  progressBarBg: {
    width: '240px',
    height: '6px',
    backgroundColor: 'var(--gray-light)',
    borderRadius: '3px',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    width: '60%',
    height: '100%',
    backgroundColor: 'var(--primary)',
    borderRadius: '3px',
    animation: 'loading-bar 2s infinite ease-in-out',
  },
  resultContainer: {
    marginTop: '8px',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '40px',
    padding: '40px',
  },
  resultImageCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  resultSubTitle: {
    fontSize: '14px',
    color: 'var(--gray)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  analyzedImage: {
    width: '100%',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--gray-light)',
    maxHeight: '340px',
    objectFit: 'cover',
  },
  imgLabel: {
    fontSize: '12px',
    color: 'var(--gray)',
    textAlign: 'center',
  },
  resultDetailsCol: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '16px',
  },
  resultHeaderBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultLabel: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--dark)',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--gray-light)',
    width: '100%',
  },
  patientMetaBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px',
  },
  recommendationCard: {
    borderRadius: 'var(--radius-md)',
    padding: '20px',
  },
  recIconTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  recDanger: {
    backgroundColor: 'var(--danger-light)',
    border: '1px solid var(--danger-border)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
  },
  recSuccess: {
    backgroundColor: 'var(--success-light)',
    border: '1px solid var(--success-border)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
  },
  recText: {
    fontSize: '13.5px',
    lineHeight: '1.45',
    color: 'var(--gray-dark)',
  },
  actionRow: {
    display: 'flex',
    gap: '16px',
    marginTop: '8px',
  },
};
