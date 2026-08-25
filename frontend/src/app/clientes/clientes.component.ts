import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../core/services/cliente.service';
import { ProductoService } from '../core/services/producto.service';
import { TransaccionService } from '../core/services/transaccion.service';
import { AuthService } from '../core/services/auth.service';
import { Cliente } from '../core/models/cliente.model';
import { Producto } from '../core/models/producto.model';
import { TipoTransaccion } from '../core/models/transaccion.model';

interface LineaProducto {
  productoId: number | null;
  cantidad: number;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly productoService = inject(ProductoService);
  private readonly transaccionService = inject(TransaccionService);
  private readonly authService = inject(AuthService);

  readonly puedeRegistrarTransaccion = this.authService.tieneAcceso('TRANSACCIONES');

  readonly clientes = signal<Cliente[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');

  readonly productos = signal<Producto[]>([]);
  readonly registrandoClienteId = signal<number | null>(null);
  readonly guardandoTransaccion = signal(false);
  readonly errorTransaccion = signal<string | null>(null);

  readonly tipo = signal<TipoTransaccion>('CARGO');
  readonly usarProductos = signal(false);
  readonly montoSimple = signal<number | null>(null);
  readonly descripcion = signal('');
  readonly lineas = signal<LineaProducto[]>([{ productoId: null, cantidad: 1 }]);

  readonly clientesFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const lista = this.clientes();
    if (!termino) return lista;
    return lista.filter(c => c.nombre.toLowerCase().includes(termino));
  });

  readonly montoCalculado = computed(() => {
    if (!this.usarProductos()) return this.montoSimple() ?? 0;
    const productos = this.productos();
    return this.lineas().reduce((total, linea) => {
      const producto = productos.find(p => p.id === linea.productoId);
      if (!producto || !linea.cantidad) return total;
      return total + producto.precio * linea.cantidad;
    }, 0);
  });

  ngOnInit(): void {
    this.cargarClientes();
    this.productoService.listar().subscribe({
      next: (productos) => this.productos.set(productos)
    });
  }

  cargarClientes(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.clienteService.listar().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los clientes.');
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

  abrirRegistro(cliente: Cliente): void {
    this.registrandoClienteId.set(cliente.id);
    this.tipo.set('CARGO');
    this.usarProductos.set(false);
    this.montoSimple.set(null);
    this.descripcion.set('');
    this.lineas.set([{ productoId: null, cantidad: 1 }]);
    this.errorTransaccion.set(null);
  }

  cancelarRegistro(): void {
    this.registrandoClienteId.set(null);
  }

  cambiarTipo(tipo: TipoTransaccion): void {
    this.tipo.set(tipo);
    if (tipo === 'ABONO') {
      this.usarProductos.set(false);
    }
  }

  agregarLinea(): void {
    this.lineas.set([...this.lineas(), { productoId: null, cantidad: 1 }]);
  }

  quitarLinea(index: number): void {
    const nuevas = this.lineas().slice();
    nuevas.splice(index, 1);
    this.lineas.set(nuevas.length ? nuevas : [{ productoId: null, cantidad: 1 }]);
  }

  actualizarLineaProducto(index: number, productoId: string): void {
    const nuevas = this.lineas().slice();
    nuevas[index] = { ...nuevas[index], productoId: productoId ? Number(productoId) : null };
    this.lineas.set(nuevas);
  }

  actualizarLineaCantidad(index: number, cantidad: string): void {
    const nuevas = this.lineas().slice();
    nuevas[index] = { ...nuevas[index], cantidad: Number(cantidad) || 0 };
    this.lineas.set(nuevas);
  }

  guardarTransaccion(cliente: Cliente): void {
    this.errorTransaccion.set(null);

    if (this.usarProductos()) {
      const detalles = this.lineas()
        .filter(l => l.productoId && l.cantidad > 0)
        .map(l => ({ productoId: l.productoId!, cantidad: l.cantidad }));

      if (detalles.length === 0) {
        this.errorTransaccion.set('Agregá al menos un producto con cantidad.');
        return;
      }

      this.enviar(cliente, { clienteId: cliente.id, tipo: this.tipo(), descripcion: this.descripcion() || undefined, detalles });
    } else {
      const monto = this.montoSimple();
      if (!monto || monto <= 0) {
        this.errorTransaccion.set('Ingresá un monto mayor a cero.');
        return;
      }

      this.enviar(cliente, { clienteId: cliente.id, tipo: this.tipo(), monto, descripcion: this.descripcion() || undefined });
    }
  }

  private enviar(cliente: Cliente, request: { clienteId: number; tipo: TipoTransaccion; monto?: number; descripcion?: string; detalles?: { productoId: number; cantidad: number }[] }): void {
    this.guardandoTransaccion.set(true);
    this.transaccionService.registrar(request).subscribe({
      next: () => {
        this.guardandoTransaccion.set(false);
        this.cancelarRegistro();
        this.cargarClientes();
      },
      error: () => {
        this.guardandoTransaccion.set(false);
        this.errorTransaccion.set('No se pudo registrar la transacción.');
      }
    });
  }
}
