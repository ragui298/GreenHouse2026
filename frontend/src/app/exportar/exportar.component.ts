import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransaccionService } from '../core/services/transaccion.service';

@Component({
  selector: 'app-exportar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exportar.component.html',
  styleUrl: './exportar.component.css'
})
export class ExportarComponent {
  private readonly transaccionService = inject(TransaccionService);

  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');
  readonly exportando = signal(false);
  readonly error = signal<string | null>(null);

  exportar(): void {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();

    if (!desde || !hasta) {
      this.error.set('Elegí las dos fechas (desde y hasta).');
      return;
    }
    if (desde > hasta) {
      this.error.set('La fecha "Desde" no puede ser posterior a "Hasta".');
      return;
    }

    this.error.set(null);
    this.exportando.set(true);
    this.transaccionService.exportar(desde, hasta).subscribe({
      next: (blob) => {
        this.exportando.set(false);
        this.descargar(blob, `transacciones_${desde}_a_${hasta}.xlsx`);
      },
      error: (err) => {
        this.exportando.set(false);
        this.error.set(
          err?.status === 0
            ? 'No se pudo exportar: se perdió la conexión con el servidor (puede haber estado inactivo). Probá de nuevo.'
            : 'No se pudo generar el archivo.'
        );
      }
    });
  }

  private descargar(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    window.URL.revokeObjectURL(url);
  }
}
