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
  private readonly transaccionService = inject(TransaccionService);
  private readonly authService = inject(AuthService);

  readonly puedeEliminar = this.authService.tieneAcceso('TRANSACCIONES_ELIMINAR');

  readonly transacciones = signal<Transaccion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly filtroTipo = signal<TipoTransaccion | 'TODOS'>('TODOS');
  readonly filtroTipoCliente = signal<TipoCliente | 'TODOS'>('TODOS');
  readonly tiposCliente = TIPOS_CLIENTE;
  readonly expandidaId = signal<number | null>(null);

  readonly transaccionesFiltradas = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const tipo = this.filtroTipo();
    const tipoCliente = this.filtroTipoCliente();
    return this.transacciones().filter(t => {
      const coincideNombre = !termino || t.cliente.nombre.toLowerCase().includes(termino);
      const coincideTipo = tipo === 'TODOS' || t.tipo === tipo;
      const coincideTipoCliente = tipoCliente === 'TODOS' || t.cliente.tipoCliente === tipoCliente;
      return coincideNombre && coincideTipo && coincideTipoCliente;
    });
  });

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

  toggleDetalle(transaccion: Transaccion): void {
    this.expandidaId.set(this.expandidaId() === transaccion.id ? null : transaccion.id);
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
