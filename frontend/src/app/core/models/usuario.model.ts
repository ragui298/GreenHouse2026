export interface PerfilResumen {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  telefono?: string;
  cedula?: string;
  perfiles: PerfilResumen[];
}

export interface RegisterRequest {
  username: string;
  password: string;
  nombreCompleto: string;
  perfilIds?: number[];
}

export interface ActualizarUsuarioRequest {
  nombreCompleto: string;
  telefono?: string;
  cedula?: string;
  password?: string;
}
