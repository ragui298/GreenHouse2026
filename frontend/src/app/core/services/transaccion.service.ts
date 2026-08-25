import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Transaccion, TransaccionRequest } from '../models/transaccion.model';

@Injectable({ providedIn: 'root' })
export class TransaccionService {
  private readonly apiUrl = `${environment.apiUrl}/transacciones`;

  constructor(private http: HttpClient) {}

  registrar(request: TransaccionRequest): Observable<Transaccion> {
    return this.http.post<Transaccion>(this.apiUrl, request);
  }

  listarTodas(): Observable<Transaccion[]> {
    return this.http.get<Transaccion[]>(this.apiUrl);
  }

  historialCliente(clienteId: number): Observable<Transaccion[]> {
    return this.http.get<Transaccion[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
