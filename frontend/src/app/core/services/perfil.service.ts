import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Perfil, PerfilInput, Recurso } from '../models/perfil.model';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly apiUrl = `${environment.apiUrl}/perfiles`;
  private readonly recursosUrl = `${environment.apiUrl}/recursos`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(this.apiUrl);
  }

  crear(perfil: PerfilInput): Observable<Perfil> {
    return this.http.post<Perfil>(this.apiUrl, perfil);
  }

  actualizar(id: number, perfil: PerfilInput): Observable<Perfil> {
    return this.http.put<Perfil>(`${this.apiUrl}/${id}`, perfil);
  }

  asignarRecursos(id: number, recursoIds: number[]): Observable<Perfil> {
    return this.http.put<Perfil>(`${this.apiUrl}/${id}/recursos`, { recursoIds });
  }

  listarRecursos(): Observable<Recurso[]> {
    return this.http.get<Recurso[]>(this.recursosUrl);
  }
}
