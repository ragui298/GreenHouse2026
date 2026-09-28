import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransaccionService } from '../core/services/transaccion.service';
import { AuthService } from '../core/services/auth.service';
import { Transaccion, TipoTransaccion } from '../core/models/transaccion.model';
import { TipoCliente, TIPOS_CLIENTE } from '../core/models/cliente.model';

@Component({
  selector: 'app-transacciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transacciones.component.html',
  styleUrl: './transacciones.component.css'
})
export class TransaccionesComponent implements OnInit {
  private static readonly LIMITE_DEFAULT = 150;

  private readonly transaccionService = inject(TransaccionService);
  private readonly authService = inject(AuthService);

  readonly puedeEliminar = this.authService.tieneAcceso('TRANSACCIONES_ELIMINAR');
  readonly puedeEditar = this.authService.tieneAcceso('TRANSACCIONES_EDITAR');

  // Transacción que se está corrigiendo (null = formulario cerrado).
  readonly editando = signal<Transaccion | null>(null);
  readonly montoEdicion = signal<number | null>(null);
  readonly fechaEdicion = signal('');
  readonly guardandoEdicion = signal(false);
  readonly errorEdicion = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly transacciones = signal<Transaccion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly filtroTipo = signal<TipoTransaccion | 'TODOS'>('TODOS');
  readonly filtroTipoCliente = signal<TipoCliente | 'TODOS'>('TODOS');
  readonly tiposCliente = TIPOS_CLIENTE;
  readonly expandidaId = signal<number | null>(null);

  readonly hayFiltrosActivos = computed(() =>
    this.busqueda().trim() !== '' || this.filtroTipo() !== 'TODOS' || this.filtroTipoCliente() !== 'TODOS'
  );

  readonly transaccionesFiltradas = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const tipo = this.filtroTipo();
    const tipoCliente = this.filtroTipoCliente();
    const filtradas = this.transacciones().filter(t => {
      const coincideNombre = !termino || t.cliente.nombre.toLowerCase().includes(termino);
      const coincideTipo = tipo === 'TODOS' || t.tipo === tipo;
      const coincideTipoCliente = tipoCliente === 'TODOS' || t.cliente.tipoCliente === tipoCliente;
      return coincideNombre && coincideTipo && coincideTipoCliente;
    });

    if (!this.hayFiltrosActivos()) {
      // La lista llega del backend ordenada por fecha descendente, así que
      // los primeros N ya son justo los últimos N registros. Sin esto, con
      // el historial completo creciendo mes a mes la tabla se vuelve
      // interminable; si se necesita algo más viejo, para eso están los
      // filtros (ahí sí se busca sobre todo el historial ya cargado).
      return filtradas.slice(0, TransaccionesComponent.LIMITE_DEFAULT);
    }
    return filtradas;
  });

  readonly mostrandoLimitado = computed(() =>
    !this.hayFiltrosActivos() && this.transacciones().length > TransaccionesComponent.LIMITE_DEFAULT
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.transaccionService.listarTodas().subscribe({
      next: (transacciones) => {
        this.transacciones.set(transacciones);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las transacciones.');
        this.cargando.set(false);
      }
    });
  }

  etiquetaTipoCliente(tipo?: TipoCliente): string {
    return this.tiposCliente.find(t => t.valor === tipo)?.etiqueta ?? 'Sin jornada';
  }

  detalleTransaccion(t: Transaccion): string {
    if (t.descripcion?.trim()) {
      return t.descripcion.trim();
    }
    if (t.detalles.length > 0) {
      return `${t.detalles.length} producto${t.detalles.length > 1 ? 's' : ''}`;
    }
    return '—';
  }

  toggleDetalle(transaccion: Transaccion): void {
    this.expandidaId.set(this.expandidaId() === transaccion.id ? null : transaccion.id);
  }

  editar(transaccion: Transaccion): void {
    this.editando.set(transaccion);
    this.montoEdicion.set(transaccion.monto);
    // El backend manda la fecha en hora de Costa Rica sin zona
    // ('2026-09-28T11:20:04.123'); el input datetime-local usa justo ese
    // formato hasta los minutos, así que alcanza con recortarla.
    this.fechaEdicion.set(transaccion.fecha.slice(0, 16));
    this.errorEdicion.set(null);
    this.exito.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.errorEdicion.set(null);
  }

  fechaMaxima(): string {
    const ahora = new Date();
    const dosDigitos = (n: number) => String(n).padStart(2, '0');
    return `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}T23:59`;
  }

  guardarEdicion(): void {
    const transaccion = this.editando();
    const monto = Number(this.montoEdicion());
    const fecha = this.fechaEdicion();
    if (!transaccion) {
      return;
    }
    if (!monto || monto <= 0) {
      this.errorEdicion.set('El monto tiene que ser mayor a cero.');
      return;
    }
    if (!fecha) {
      this.errorEdicion.set('Elegí una fecha.');
      return;
    }

    this.guardandoEdicion.set(true);
    this.errorEdicion.set(null);
    this.transaccionService.editar(transaccion.id, { monto, fecha }).subscribe({
      next: () => {
        this.guardandoEdicion.set(false);
        this.editando.set(null);
        this.exito.set(`Transacción de ${transaccion.cliente.nombre} actualizada.`);
        this.cargar();
      },
      error: (err) => {
        this.guardandoEdicion.set(false);
        if (err?.status === 400 && err.error?.error) {
          this.errorEdicion.set(err.error.error);
        } else if (err?.status === 0) {
          this.errorEdicion.set('No se pudo guardar: se perdió la conexión con el servidor (puede haber estado inactivo). Probá de nuevo.');
        } else {
          this.errorEdicion.set('No se pudo guardar la transacción.');
        }
      }
    });
  }

  eliminar(transaccion: Transaccion): void {
    if (!confirm(`¿Eliminar esta transacción de ${transaccion.cliente.nombre}? Esto va a afectar su saldo.`)) {
      return;
    }
    this.transaccionService.eliminar(transaccion.id).subscribe({
      next: () => this.cargar(),
      error: () => this.error.set('No se pudo eliminar la transacción.')
    });
  }

  formatoColones(monto: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 0
    }).format(monto);
  }

  formatoFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(fecha));
  }
}
