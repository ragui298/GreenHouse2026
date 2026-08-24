import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { ClienteService } from '../core/services/cliente.service';
import { Cliente } from '../core/models/cliente.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly authService = inject(AuthService);

  readonly nombreUsuario = this.authService.nombreCompleto;
  readonly clientes = signal<Cliente[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly totalAdeudado = computed(() =>
    this.clientes().reduce((sum, c) => sum + (c.saldoActual > 0 ? c.saldoActual : 0), 0)
  );

  readonly clientesConDeuda = computed(() =>
    this.clientes().filter(c => c.saldoActual > 0).length
  );

  readonly clientesTop = computed(() =>
    [...this.clientes()]
      .filter(c => c.saldoActual > 0)
      .sort((a, b) => b.saldoActual - a.saldoActual)
      .slice(0, 5)
  );

  ngOnInit(): void {
    this.cargando.set(true);
    this.clienteService.listar().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el resumen.');
        this.cargando.set(false);
      }
    });
  }

  formatoColones(monto: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 0
    }).format(monto);
  }
}
