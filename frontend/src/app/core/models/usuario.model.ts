export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  perfilId: number;
  perfilNombre: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  nombreCompleto: string;
  perfilId?: number;
}
