
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  iniciarSesion(): void {

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

    this.mensaje = 'Datos ingresados correctamente';

    console.log('Email:', this.email);
  }
}


