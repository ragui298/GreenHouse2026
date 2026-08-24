export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  cedula?: string;
  activo: boolean;
  saldoActual: number; // positivo = debe dinero
}

export interface ClienteInput {
  nombre: string;
  telefono?: string;
  cedula?: string;
}
