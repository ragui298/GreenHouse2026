export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  activo: boolean;
}

export interface ProductoInput {
  nombre: string;
  precio: number;
}
