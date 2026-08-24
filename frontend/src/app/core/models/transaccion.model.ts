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

export interface Transaccion {
  id: number;
  tipo: TipoTransaccion;
  monto: number;
  descripcion?: string;
  fecha: string;
}
