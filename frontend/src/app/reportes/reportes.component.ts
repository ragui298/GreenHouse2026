import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransaccionService } from '../core/services/transaccion.service';
import { Transaccion } from '../core/models/transaccion.model';
import { Cliente, TipoCliente, TIPOS_CLIENTE } from '../core/models/cliente.model';

interface GrupoReporte {
  cliente: Cliente;
  transacciones: Transaccion[];
  total: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent {
  private readonly transaccionService = inject(TransaccionService);

  readonly transacciones = signal<Transaccion[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly reporteGenerado = signal(false);

  // Lo que el usuario va tocando en los filtros. No dispara ninguna consulta
  // ni recalcula nada por sí solo: solo se "aplica" cuando se presiona
  // "Generar reporte", para no hacer trabajo de más mientras todavía está
  // terminando de elegir los filtros.
  readonly filtroTipoCliente = signal<TipoCliente | 'TODOS'>('TODOS');
  readonly busquedaNombre = signal('');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');
  readonly tiposCliente = TIPOS_CLIENTE;

  // Copia de los filtros de arriba tomada en el momento de generar el
  // reporte. El cálculo de "grupos" usa esta copia, no los signals de
  // arriba, para que cambiar un filtro no actualice nada hasta el próximo
  // clic en "Generar reporte".
  private readonly filtroTipoClienteAplicado = signal<TipoCliente | 'TODOS'>('TODOS');
  private readonly busquedaNombreAplicada = signal('');
  private readonly fechaDesdeAplicada = signal('');
  private readonly fechaHastaAplicada = signal('');

  // Clientes marcados como "ya le mandé el mensaje", para el checklist.
  // Se guarda en localStorage atado al rango de fechas del reporte, para
  // que las marcas de un período no aparezcan como enviadas en el próximo.
  private static readonly CLAVE_STORAGE = 'greenhouse_reportes_enviados';
  readonly enviados = signal<Set<string>>(this.cargarEnviadosGuardados());

  readonly grupos = computed<GrupoReporte[]>(() => {
    const tipoCliente = this.filtroTipoClienteAplicado();
    const nombre = this.busquedaNombreAplicada().trim().toLowerCase();
    const desde = this.fechaDesdeAplicada() ? new Date(`${this.fechaDesdeAplicada()}T00:00:00`) : null;
    const hasta = this.fechaHastaAplicada() ? new Date(`${this.fechaHastaAplicada()}T23:59:59`) : null;

    const filtradas = this.transacciones().filter(t => {
      const coincideTipoCliente = tipoCliente === 'TODOS' || t.cliente.tipoCliente === tipoCliente;
      const coincideNombre = !nombre || t.cliente.nombre.toLowerCase().includes(nombre);
      const fecha = new Date(t.fecha);
      const coincideDesde = !desde || fecha >= desde;
      const coincideHasta = !hasta || fecha <= hasta;
      return coincideTipoCliente && coincideNombre && coincideDesde && coincideHasta;
    });

    const porCliente = new Map<number, GrupoReporte>();
    for (const t of filtradas) {
      const existente = porCliente.get(t.cliente.id);
      if (existente) {
        existente.transacciones.push(t);
      } else {
        porCliente.set(t.cliente.id, { cliente: t.cliente, transacciones: [t], total: 0 });
      }
    }

    for (const grupo of porCliente.values()) {
      grupo.transacciones.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      grupo.total = grupo.transacciones.reduce(
        (acc, t) => acc + (t.tipo === 'CARGO' ? t.monto : -t.monto),
        0
      );
    }

    return Array.from(porCliente.values()).sort((a, b) => a.cliente.nombre.localeCompare(b.cliente.nombre));
  });

  readonly cantidadEnviados = computed(() =>
    this.grupos().filter(g => this.estaEnviado(g.cliente.id)).length
  );

  generarReporte(): void {
    // Recién acá se "congelan" los filtros y se consulta el backend.
    this.filtroTipoClienteAplicado.set(this.filtroTipoCliente());
    this.busquedaNombreAplicada.set(this.busquedaNombre());
    this.fechaDesdeAplicada.set(this.fechaDesde());
    this.fechaHastaAplicada.set(this.fechaHasta());

    this.cargando.set(true);
    this.error.set(null);
    this.transaccionService.reportarTodas().subscribe({
      next: (transacciones) => {
        this.transacciones.set(transacciones);
        this.reporteGenerado.set(true);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las transacciones.');
        this.cargando.set(false);
      }
    });
  }

  private cargarEnviadosGuardados(): Set<string> {
    try {
      const guardado = localStorage.getItem(ReportesComponent.CLAVE_STORAGE);
      return guardado ? new Set(JSON.parse(guardado)) : new Set();
    } catch {
      return new Set();
    }
  }

  private guardarEnviados(): void {
    try {
      localStorage.setItem(ReportesComponent.CLAVE_STORAGE, JSON.stringify([...this.enviados()]));
    } catch {
      // Si localStorage no está disponible, el checklist simplemente no persiste.
    }
  }

  private claveEnviado(clienteId: number): string {
    return `${clienteId}::${this.fechaDesdeAplicada()}::${this.fechaHastaAplicada()}`;
  }

  estaEnviado(clienteId: number): boolean {
    return this.enviados().has(this.claveEnviado(clienteId));
  }

  toggleEnviado(clienteId: number): void {
    const clave = this.claveEnviado(clienteId);
    const actualizado = new Set(this.enviados());
    if (actualizado.has(clave)) {
      actualizado.delete(clave);
    } else {
      actualizado.add(clave);
    }
    this.enviados.set(actualizado);
    this.guardarEnviados();
  }

  etiquetaTipo(tipo?: TipoCliente): string {
    return this.tiposCliente.find(t => t.valor === tipo)?.etiqueta ?? 'Sin jornada';
  }

  formatoFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(fecha));
  }

  formatoMonto(monto: number): string {
    // No usamos Intl.NumberFormat acá porque el separador de miles de
    // 'es-CR' varía según el motor (a veces da espacio en vez de punto).
    // Se arma a mano para que siempre salga "1.234,56", como se acostumbra
    // en los recibos y en el mensaje de WhatsApp.
    const [entero, decimales] = Math.abs(monto).toFixed(2).split('.');
    const enteroConPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${enteroConPuntos},${decimales}`;
  }

  private formatoFechaCorta(fecha: string): string {
    // A mano en vez de Intl.DateTimeFormat: sin el año, algunos motores
    // dejan de rellenar con cero (da "7/9" en vez de "07/09").
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
  }

  private formatoMontoMensaje(monto: number): string {
    // Para el mensaje de WhatsApp los montos van sin decimales (acá nunca
    // se manejan céntimos): "5.000" en vez de "5.000,00".
    return Math.abs(monto).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  enviarPorWhatsapp(grupo: GrupoReporte): void {
    const soloDigitos = grupo.cliente.telefono?.replace(/\D/g, '') ?? '';
    if (!soloDigitos) {
      this.error.set(`${grupo.cliente.nombre} no tiene un número de teléfono registrado.`);
      return;
    }

    // Se agrupa por fecha: la fecha aparece una sola vez, seguida de los
    // consumos de ese día, sin repetirla en cada línea.
    const lineas: string[] = [];
    let fechaAnterior = '';
    for (const t of grupo.transacciones) {
      const fechaCorta = this.formatoFechaCorta(t.fecha);
      if (fechaCorta !== fechaAnterior) {
        lineas.push(fechaCorta);
        fechaAnterior = fechaCorta;
      }
      const detalle = t.descripcion?.trim() || (t.tipo === 'CARGO' ? 'Cargo' : 'Abono');
      const signo = t.tipo === 'ABONO' ? '-' : '';
      lineas.push(`${detalle} ${signo}${this.formatoMontoMensaje(t.monto)}`);
    }

    const etiquetaTotal = grupo.total < 0 ? 'A favor' : 'Total';
    const mensaje = [
      '- Consumo Soda Colegio',
      ...lineas,
      '------------------------------',
      `${etiquetaTotal} ${this.formatoMontoMensaje(grupo.total)}`,
      '',
      'Bendiciones Muchas Gracias!!'
    ].join('\n');

    // Números de Costa Rica se guardan a 8 dígitos sin código de país (506).
    const numero = soloDigitos.length === 8 ? `506${soloDigitos}` : soloDigitos;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');

    if (!this.estaEnviado(grupo.cliente.id)) {
      this.toggleEnviado(grupo.cliente.id);
    }
  }
}
