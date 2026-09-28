import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReporteSemanal, Transaccion, TransaccionEditarRequest, TransaccionRequest } from '../models/transaccion.model';

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

  reportarTodas(desde?: string, hasta?: string): Observable<ReporteSemanal> {
    const params: Record<string, string> = {};
    if (desde) params['desde'] = desde;
    if (hasta) params['hasta'] = hasta;
    return this.http.get<ReporteSemanal>(`${this.apiUrl}/reporte`, { params });
  }

  historialCliente(clienteId: number): Observable<Transaccion[]> {
    return this.http.get<Transaccion[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  editar(id: number, request: TransaccionEditarRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  exportar(desde: string, hasta: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportar`, {
      params: { desde, hasta },
      responseType: 'blob'
    });
  }
}
