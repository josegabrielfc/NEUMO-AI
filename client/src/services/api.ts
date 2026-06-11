import type { Patient, PredictionResult, HistoryResponse, Diagnosis } from '../types';

const API_BASE = '/api';

export async function predictPneumonia(patient: Patient, imageFile: File): Promise<PredictionResult> {
  const formData = new FormData();
  
  // Append patient fields
  formData.append('nombres', patient.nombres);
  formData.append('apellidos', patient.apellidos);
  formData.append('identificacion', patient.identificacion);
  formData.append('edad', String(patient.edad));
  formData.append('sexo', patient.sexo);
  formData.append('sintomas', JSON.stringify(patient.sintomas));
  formData.append('descripcion', patient.descripcion);
  
  // Append file
  formData.append('image', imageFile);
  
  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al procesar el diagnóstico');
  }
  
  return response.json();
}

export async function getDiagnoses(page: number = 1, limit: number = 20): Promise<HistoryResponse> {
  const response = await fetch(`${API_BASE}/diagnoses?page=${page}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener el historial de diagnósticos');
  }
  
  return response.json();
}

export async function getDiagnosisById(id: number): Promise<Diagnosis> {
  const response = await fetch(`${API_BASE}/diagnoses/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Diagnóstico no encontrado');
    }
    throw new Error('Error al obtener el detalle del diagnóstico');
  }
  
  return response.json();
}

export async function deleteDiagnosis(id: number): Promise<boolean> {
  const response = await fetch(`${API_BASE}/diagnoses/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Error al eliminar el diagnóstico');
  }
  
  const data = await response.json();
  return data.success;
}
