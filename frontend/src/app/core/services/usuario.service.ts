import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActualizarUsuarioRequest, RegisterRequest, Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  crear(request: RegisterRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, request);
  }

  asignarPerfiles(id: number, perfilIds: number[]): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}/perfiles`, { perfilIds });
  }

  actualizar(id: number, datos: ActualizarUsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, datos);
  }
}
