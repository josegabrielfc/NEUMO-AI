import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Trash2, Calendar, User, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { Diagnosis } from '../types';
import { getDiagnoses, deleteDiagnosis } from '../services/api';

export default function History() {
  const navigate = useNavigate();
  
  // State
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch history
  const fetchHistory = async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDiagnoses(pageNumber, limit);
      setDiagnoses(data.diagnoses);
      setTotal(data.total);
      setPage(data.page);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el historial de diagnósticos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  // Handlers
  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este registro del historial? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const success = await deleteDiagnosis(id);
      if (success) {
        // If current page list becomes empty and it's not the first page, go back a page
        const newTotal = total - 1;
        const totalPages = Math.ceil(newTotal / limit);
        const targetPage = page > totalPages && page > 1 ? page - 1 : page;
        
        if (targetPage !== page) {
          setPage(targetPage);
        } else {
          fetchHistory(page);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el registro.');
    }
  };

  // Filter diagnoses locally based on Search term (nombres, apellidos, identificacion)
  const filteredDiagnoses = diagnoses.filter(diag => {
    const searchLower = searchTerm.toLowerCase();
    return (
      diag.nombres.toLowerCase().includes(searchLower) ||
      diag.apellidos.toLowerCase().includes(searchLower) ||
      diag.identificacion.includes(searchLower)
    );
  });

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString.replace(' ', 'T') + 'Z'); // Handle sqlite format
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Historial de Diagnósticos</h2>
        <p style={styles.subtitle}>Consulte y administre el registro histórico de los análisis de radiografía realizados.</p>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <AlertCircle size={20} color="var(--danger)" />
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {/* Toolbar / Search matching reference style */}
      <div className="card" style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="var(--gray)" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o identificación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div className="card" style={styles.loadingCard}>
          <p style={styles.loadingText}>Cargando registros...</p>
        </div>
      ) : filteredDiagnoses.length === 0 ? (
        <div className="card" style={styles.emptyCard}>
          <p style={styles.emptyText}>
            {searchTerm ? 'No se encontraron diagnósticos que coincidan con la búsqueda.' : 'No hay diagnósticos registrados en el historial.'}
          </p>
        </div>
      ) : (
        <div className="card" style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>Paciente</th>
                <th style={styles.th}>Identificación</th>
                <th style={styles.th}>Edad/Sexo</th>
                <th style={styles.th}>Fecha de Análisis</th>
                <th style={styles.th}>Resultado</th>
                <th style={styles.th}>Confianza</th>
                <th style={styles.thAction}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiagnoses.map((diag) => (
                <tr key={diag.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.patientCell}>
                      <User size={16} color="var(--gray)" />
                      <span style={styles.patientName}>{diag.nombres} {diag.apellidos}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{diag.identificacion}</td>
                  <td style={styles.td}>{diag.edad} años / {diag.sexo}</td>
                  <td style={styles.td}>
                    <div style={styles.dateCell}>
                      <Calendar size={14} color="var(--gray)" />
                      <span>{formatDate(diag.created_at)}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span className={`badge ${diag.resultado === 'NEUMONÍA' ? 'badge-pneumonia' : 'badge-normal'}`}>
                      {diag.resultado}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: 600, color: diag.resultado === 'NEUMONÍA' ? 'var(--danger)' : 'var(--success)' }}>
                      {diag.confianza.toFixed(1)}%
                    </span>
                  </td>
                  <td style={styles.tdAction}>
                    <div style={styles.actionGroup}>
                      <button
                        onClick={() => navigate(`/report/${diag.id}`)}
                        className="btn btn-outline btn-icon-only"
                        style={styles.actionBtn}
                        title="Ver reporte detallado"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(diag.id)}
                        className="btn btn-outline btn-icon-only"
                        style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                        title="Eliminar registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div style={styles.pagination}>
            <span style={styles.paginationInfo}>
              Mostrando registros {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} de {total}
            </span>
            <div style={styles.paginationBtns}>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="btn btn-outline"
                style={styles.paginationBtn}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>
              <span style={styles.pageNum}>Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="btn btn-outline"
                style={styles.paginationBtn}
              >
                <span>Siguiente</span>
                <ChevronRight size={16} />
              </button>
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
  toolbar: {
    padding: '16px 24px',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--gray-light)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 16px',
    maxWidth: '480px',
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '14px',
    color: 'var(--dark)',
  },
  loadingCard: {
    padding: '60px',
    textAlign: 'center',
  },
  loadingText: {
    color: 'var(--gray)',
    fontSize: '14px',
  },
  emptyCard: {
    padding: '80px 40px',
    textAlign: 'center',
  },
  emptyText: {
    color: 'var(--gray)',
    fontSize: '14px',
  },
  tableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    borderBottom: '1px solid var(--gray-light)',
    backgroundColor: '#FAFAF9',
  },
  th: {
    padding: '16px 24px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--gray)',
    letterSpacing: '0.5px',
  },
  thAction: {
    padding: '16px 24px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--gray)',
    letterSpacing: '0.5px',
    textAlign: 'right',
  },
  tr: {
    borderBottom: '1px solid var(--gray-light)',
    transition: 'var(--transition)',
  },
  td: {
    padding: '16px 24px',
    fontSize: '14px',
    color: 'var(--gray-dark)',
  },
  tdAction: {
    padding: '16px 24px',
    textAlign: 'right',
  },
  patientCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  patientName: {
    fontWeight: 500,
    color: 'var(--dark)',
  },
  dateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionGroup: {
    display: 'inline-flex',
    gap: '8px',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    padding: 0,
    borderRadius: '8px',
  },
  deleteBtn: {
    color: 'var(--gray)',
    borderColor: 'var(--gray-light)',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderTop: '1px solid var(--gray-light)',
    backgroundColor: '#FAFAF9',
  },
  paginationInfo: {
    fontSize: '13px',
    color: 'var(--gray)',
  },
  paginationBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  paginationBtn: {
    padding: '8px 12px',
    fontSize: '13px',
  },
  pageNum: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--dark)',
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
};
