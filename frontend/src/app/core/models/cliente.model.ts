export type TipoCliente = 'PRIMARIA' | 'SECUNDARIA' | 'NOCTURNO';

export const TIPOS_CLIENTE: { valor: TipoCliente; etiqueta: string }[] = [
  { valor: 'PRIMARIA', etiqueta: 'Primaria' },
  { valor: 'SECUNDARIA', etiqueta: 'Secundaria' },
  { valor: 'NOCTURNO', etiqueta: 'Nocturno' }
];

export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  cedula?: string;
  tipoCliente?: TipoCliente;
  activo: boolean;
  saldoActual: number; // positivo = debe dinero
}

export interface ClienteInput {
  nombre: string;
  telefono?: string;
  cedula?: string;
  tipoCliente?: TipoCliente;
}
