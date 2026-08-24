export interface Recurso {
  id: number;
  clave: string;
  nombre: string;
  descripcion?: string;
}

export interface Perfil {
  id: number;
  nombre: string;
  descripcion?: string;
  recursos: Recurso[];
}

export interface PerfilInput {
  nombre: string;
  descripcion?: string;
}
