
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  mensaje: string = '';

  mostrarPassword: boolean = false;
  cargando: boolean = false;

  constructor(private authService: AuthService) {}

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  iniciarSesion(): void {

    if (this.cargando) {
      return;
    }

    if (!this.email.trim() || !this.password) {
      this.mensaje = 'Debe completar todos los campos';
      return;
    }

    const patronEmail =
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]{3,}(\.[a-zA-Z]{2,})?$/;

    if (!patronEmail.test(this.email.trim())) {
      this.mensaje = 'Ingresá un email válido';
      return;
    }

    if (this.password.length < 6) {
      this.mensaje = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.cargando = true;
    this.mensaje = 'Iniciando sesión...';

    this.authService.login(
      this.email.trim(),
      this.password
    ).subscribe({

      next: (respuesta) => {
        this.cargando = false;
        this.mensaje = 'Inicio de sesión exitoso';
      },

      error: (error) => {
        this.cargando = false;

        if (error.status === 401) {
          this.mensaje = 'Correo o contraseña incorrectos';
        } else if (error.status === 0) {
          this.mensaje = 'No se pudo conectar con el servidor';
        } else {
          this.mensaje = 'Ocurrió un error al iniciar sesión';
        }
      }

    });
  }
}
