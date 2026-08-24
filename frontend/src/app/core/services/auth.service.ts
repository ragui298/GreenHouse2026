import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'greenhouse_token';
const USER_KEY = 'greenhouse_user';
const PERFIL_KEY = 'greenhouse_perfil';
const RECURSOS_KEY = 'greenhouse_recursos';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly _nombreCompleto = signal<string | null>(localStorage.getItem(USER_KEY));
  private readonly _perfil = signal<string | null>(localStorage.getItem(PERFIL_KEY));
  private readonly _recursos = signal<string[]>(this.leerRecursosGuardados());

  readonly nombreCompleto = computed(() => this._nombreCompleto());
  readonly perfil = computed(() => this._perfil());
  readonly recursos = computed(() => this._recursos());
  readonly estaAutenticado = computed(() => !!this.getToken());

  constructor(private http: HttpClient) {}

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap((respuesta) => {
        localStorage.setItem(TOKEN_KEY, respuesta.token);
        localStorage.setItem(USER_KEY, respuesta.nombreCompleto);
        localStorage.setItem(PERFIL_KEY, respuesta.perfil);
        localStorage.setItem(RECURSOS_KEY, JSON.stringify(respuesta.recursos ?? []));
        this._nombreCompleto.set(respuesta.nombreCompleto);
        this._perfil.set(respuesta.perfil);
        this._recursos.set(respuesta.recursos ?? []);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERFIL_KEY);
    localStorage.removeItem(RECURSOS_KEY);
    this._nombreCompleto.set(null);
    this._perfil.set(null);
    this._recursos.set([]);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  forgotPassword(username: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { username }, { responseType: 'text' });
  }

  // Indica si el perfil del usuario logueado tiene acceso al recurso dado
  // (ej. 'CLIENTES', 'PRODUCTOS', 'USUARIOS'). Se usa para mostrar/ocultar
  // secciones del menú -- el bloqueo real ya lo hace el backend.
  tieneAcceso(claveRecurso: string): boolean {
    return this._recursos().includes(claveRecurso);
  }

  private leerRecursosGuardados(): string[] {
    const guardado = localStorage.getItem(RECURSOS_KEY);
    if (!guardado) return [];
    try {
      return JSON.parse(guardado);
    } catch {
      return [];
    }
  }
}
