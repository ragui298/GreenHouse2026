import { Cliente } from './cliente.model';
import { Producto } from './producto.model';

export type TipoTransaccion = 'CARGO' | 'ABONO';

export interface DetalleRequest {
  productoId: number;
  cantidad: number;
}

export interface TransaccionRequest {
  clienteId: number;
  tipo: TipoTransaccion;
  monto?: number;
  descripcion?: string;
  detalles?: DetalleRequest[];
}

export interface DetalleTransaccion {
  id: number;
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

export interface Transaccion {
  id: number;
  cliente: Cliente;
  tipo: TipoTransaccion;
  monto: number;
  descripcion?: string;
  fecha: string;
  detalles: DetalleTransaccion[];
}

// Respuesta de /api/transacciones/reporte cuando se pide un rango de
// fechas: las transacciones de ese rango, más lo que cada cliente ya
// arrastraba de ANTES de "desde" (positivo = debe, negativo = a favor).
export interface ReporteSemanal {
  transacciones: Transaccion[];
  saldosIniciales: Record<number, number>;
}
