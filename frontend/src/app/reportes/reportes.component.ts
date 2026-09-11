import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransaccionService } from '../core/services/transaccion.service';
import { Transaccion } from '../core/models/transaccion.model';
import { Cliente, TipoCliente, TIPOS_CLIENTE } from '../core/models/cliente.model';

interface GrupoReporte {
  cliente: Cliente;
  transacciones: Transaccion[];
  consumoSemana: number;
  // Cargos y abonos del período por separado, para el desglose del
  // resumen (Consumo / Abonos) y para el mensaje de WhatsApp.
  totalCargos: number;
  totalAbonos: number;
  // Si no se pidió un rango de fechas (Desde vacío), no hay un "antes de"
  // bien definido -- en ese caso no se muestra saldo inicial ni total,
  // solo el consumo, como funcionaba el reporte antes de esto.
  tieneSaldoInicial: boolean;
  saldoInicial: number;
  saldoFinal: number;
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
  readonly saldosIniciales = signal<Record<number, number>>({});
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
    const tieneRango = !!this.fechaDesdeAplicada();
    const saldos = this.saldosIniciales();

    // El backend ya devuelve solo las transacciones del rango pedido (si
    // se pidió uno) -- acá nada más se filtra por jornada/nombre.
    const filtradas = this.transacciones().filter(t => {
      const coincideTipoCliente = tipoCliente === 'TODOS' || t.cliente.tipoCliente === tipoCliente;
      const coincideNombre = !nombre || t.cliente.nombre.toLowerCase().includes(nombre);
      return coincideTipoCliente && coincideNombre;
    });

    const porCliente = new Map<number, GrupoReporte>();
    for (const t of filtradas) {
      const existente = porCliente.get(t.cliente.id);
      if (existente) {
        existente.transacciones.push(t);
      } else {
        porCliente.set(t.cliente.id, {
          cliente: t.cliente,
          transacciones: [t],
          consumoSemana: 0,
          totalCargos: 0,
          totalAbonos: 0,
          tieneSaldoInicial: tieneRango,
          saldoInicial: 0,
          saldoFinal: 0
        });
      }
    }

    for (const grupo of porCliente.values()) {
      grupo.transacciones.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      grupo.totalCargos = grupo.transacciones
        .filter(t => t.tipo === 'CARGO')
        .reduce((acc, t) => acc + t.monto, 0);
      grupo.totalAbonos = grupo.transacciones
        .filter(t => t.tipo === 'ABONO')
        .reduce((acc, t) => acc + t.monto, 0);
      grupo.consumoSemana = grupo.totalCargos - grupo.totalAbonos;
      grupo.saldoInicial = tieneRango ? (saldos[grupo.cliente.id] ?? 0) : 0;
      grupo.saldoFinal = grupo.saldoInicial + grupo.consumoSemana;
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
    this.transaccionService.reportarTodas(this.fechaDesde() || undefined, this.fechaHasta() || undefined).subscribe({
      next: (respuesta) => {
        this.transacciones.set(respuesta.transacciones);
        this.saldosIniciales.set(respuesta.saldosIniciales);
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

  // "Debe" si el saldo es positivo, "A favor" si es negativo, "Al día" si
  // es exactamente cero (este último caso no se muestra en pantalla, pero
  // la función queda completa por si se necesita en otro lado).
  etiquetaSaldo(monto: number): string {
    if (monto > 0) return 'Debe';
    if (monto < 0) return 'A favor';
    return 'Al día';
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
    // en los recibos y en el mensaje de WhatsApp. Sin Math.abs(): si el
    // monto es negativo (saldo a favor), el signo queda en el número.
    const [entero, decimales] = monto.toFixed(2).split('.');
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
    // se manejan céntimos): "5.000" en vez de "5.000,00". Sin Math.abs():
    // un saldo a favor sale como "-5.000", no "5.000".
    return monto.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Junta la fecha una sola vez seguida de sus transacciones, sin repetirla
  // en cada línea. Se llama por separado para consumos y para abonos, ya
  // que el mensaje de WhatsApp ahora los muestra en bloques distintos.
  private agruparTransaccionesPorFecha(transacciones: Transaccion[]): string[] {
    const lineas: string[] = [];
    let fechaAnterior = '';
    for (const t of transacciones) {
      const fechaCorta = this.formatoFechaCorta(t.fecha);
      if (fechaCorta !== fechaAnterior) {
        lineas.push(fechaCorta);
        fechaAnterior = fechaCorta;
      }
      const detalle = t.descripcion?.trim() || (t.tipo === 'CARGO' ? 'Cargo' : 'Abono');
      lineas.push(`${detalle} ${this.formatoMontoMensaje(t.monto)}`);
    }
    return lineas;
  }

  enviarPorWhatsapp(grupo: GrupoReporte): void {
    const soloDigitos = grupo.cliente.telefono?.replace(/\D/g, '') ?? '';
    if (!soloDigitos) {
      this.error.set(`${grupo.cliente.nombre} no tiene un número de teléfono registrado.`);
      return;
    }

    const cargos = grupo.transacciones.filter(t => t.tipo === 'CARGO');
    const abonos = grupo.transacciones.filter(t => t.tipo === 'ABONO');

    const partes: string[] = [
      '-- CONSUMO EN SODA --',
      `NOMBRE: ${grupo.cliente.nombre.toUpperCase()}`
    ];

    // A diferencia de formatoMontoMensaje() a secas (que deja el signo tal
    // cual), acá el signo se expresa con la palabra entre paréntesis, así
    // que el monto siempre va en valor absoluto.
    if (grupo.tieneSaldoInicial && grupo.saldoInicial !== 0) {
      const etiquetaInicial = grupo.saldoInicial > 0 ? 'Adeudado' : 'A favor';
      partes.push(`SALDO ANTERIOR: ${this.formatoMontoMensaje(Math.abs(grupo.saldoInicial))} (${etiquetaInicial})`);
    }

    if (cargos.length > 0) {
      partes.push(
        '',
        '',
        '------CONSUMOS-------------',
        ...this.agruparTransaccionesPorFecha(cargos),
        '---------------------------------',
        '---------------------------------',
        `TOTAL CONSUMIDO : ${this.formatoMontoMensaje(grupo.totalCargos)}`,
        '---------------------------------'
      );
    }

    if (abonos.length > 0) {
      partes.push(
        '',
        '',
        '++++++++++++++++++++',
        '+++++ABONOS+++++++++',
        ...this.agruparTransaccionesPorFecha(abonos),
        '++++++++++++++++++++',
        '++++++++++++++++++++',
        `TOTAL ABONOS : ${this.formatoMontoMensaje(grupo.totalAbonos)}`,
        '++++++++++++++++++++'
      );
    }

    const saldoActual = grupo.saldoFinal;
    const emojiActual = saldoActual > 0 ? '🔴' : saldoActual < 0 ? '✅' : '⚪';
    const etiquetaActual = saldoActual > 0 ? ' (Adeudado)' : saldoActual < 0 ? ' (A favor)' : '';
    partes.push(
      '',
      '',
      '',
      '---------------------------------',
      '---------------------------------',
      `${emojiActual} SALDO ACTUAL : ${this.formatoMontoMensaje(Math.abs(saldoActual))}${etiquetaActual}`,
      '',
      '*Muchas gracias y bendiciones*'
    );

    const mensaje = partes.join('\n');

    // Números de Costa Rica se guardan a 8 dígitos sin código de país (506).
    const numero = soloDigitos.length === 8 ? `506${soloDigitos}` : soloDigitos;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');

    if (!this.estaEnviado(grupo.cliente.id)) {
      this.toggleEnviado(grupo.cliente.id);
    }
  }
}
