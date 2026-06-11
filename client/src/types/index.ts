export interface Patient {
  nombres: string;
  apellidos: string;
  identificacion: string;
  edad: number | '';
  sexo: 'M' | 'F' | '';
  sintomas: string[];
  descripcion: string;
}

export interface Diagnosis {
  id: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
  edad: number;
  sexo: 'M' | 'F';
  sintomas: string[];
  descripcion: string;
  resultado: 'NORMAL' | 'NEUMONÍA';
  confianza: number;
  imagen_nombre: string;
  created_at: string;
}

export interface PredictionResult {
  success: boolean;
  id: number;
  resultado: 'NORMAL' | 'NEUMONÍA';
  confianza: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
  edad: number;
  sexo: 'M' | 'F';
  sintomas: string[];
  descripcion: string;
  imagen_nombre: string;
}

export interface HistoryResponse {
  diagnoses: Diagnosis[];
  total: number;
  page: number;
  limit: number;
}
