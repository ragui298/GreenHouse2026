import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterRequest, Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;
  private readonly registerUrl = `${environment.apiUrl}/auth/register`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  crear(request: RegisterRequest): Observable<string> {
    return this.http.post(this.registerUrl, request, { responseType: 'text' });
  }

  cambiarPerfil(id: number, perfilId: number): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}/perfil`, { perfilId });
  }
}
