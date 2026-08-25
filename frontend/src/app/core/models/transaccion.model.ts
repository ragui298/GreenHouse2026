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
