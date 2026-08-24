import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'mantenimiento/usuarios',
        loadComponent: () => import('./mantenimiento-usuarios/mantenimiento-usuarios.component').then(m => m.MantenimientoUsuariosComponent)
      },
      {
        path: 'mantenimiento/clientes',
        loadComponent: () => import('./mantenimiento-clientes/mantenimiento-clientes.component').then(m => m.MantenimientoClientesComponent)
      },
      {
        path: 'mantenimiento/productos',
        loadComponent: () => import('./mantenimiento-productos/mantenimiento-productos.component').then(m => m.MantenimientoProductosComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
