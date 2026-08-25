export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  nombreCompleto: string;
  perfiles: string[];
  recursos: string[];
}
