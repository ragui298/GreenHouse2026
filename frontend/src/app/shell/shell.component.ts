import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  recurso: string | null; // null = siempre visible
  icono: string; // path SVG simple
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly nombreUsuario = this.authService.nombreCompleto;
  readonly perfil = this.authService.perfil;

  private readonly items: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', recurso: null, icono: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z' },
    { label: 'Clientes', path: '/clientes', recurso: 'CLIENTES', icono: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0' },
    { label: 'Mantenimiento usuarios', path: '/mantenimiento/usuarios', recurso: 'USUARIOS', icono: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 4h6m-3-3v6' },
    { label: 'Mantenimiento clientes', path: '/mantenimiento/clientes', recurso: 'CLIENTES', icono: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z' },
    { label: 'Mantenimiento productos', path: '/mantenimiento/productos', recurso: 'PRODUCTOS', icono: 'M20 7 12 3 4 7m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ];

  readonly itemsVisibles = computed(() =>
    this.items.filter(item => item.recurso === null || this.authService.tieneAcceso(item.recurso))
  );

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
