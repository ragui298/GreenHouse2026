import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

const FRASES = [
  'Cada día es una nueva oportunidad para hacer las cosas mejor que ayer.',
  'El esfuerzo de hoy es el resultado de mañana.',
  'No se trata de ser perfecto, se trata de no rendirse.',
  'Las grandes cosas nunca vienen de la zona de confort.',
  'Un paso a la vez es todo lo que hace falta para llegar lejos.',
  'El trabajo constante vence al talento que no se esfuerza.',
  'Hoy es un buen día para construir algo de lo que estés orgulloso.',
  'La disciplina de hoy es la libertad de mañana.',
  'Nadie dijo que sería fácil, pero vale la pena.',
  'Cada cliente atendido, cada tarea hecha, suma al negocio que estás construyendo.',
  'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
  'Tu actitud de hoy define tu resultado de mañana.'
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly authService = inject(AuthService);

  readonly nombreUsuario = this.authService.nombreCompleto;
  readonly frase = FRASES[Math.floor(Math.random() * FRASES.length)];
}
