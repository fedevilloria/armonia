import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  nombre: string = '';
  apellido: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  mensaje: string = '';
registroExitoso: boolean = false;
  mostrarPassword: boolean = false;
  mostrarConfirmPassword: boolean = false;

  registrarUsuario(): void {

    // 1. Controlar campos obligatorios
    if (!this.nombre || !this.apellido || !this.email) {
      this.mensaje = 'Debe completar todos los campos';
      return;
    }

    // 2. Controlar que haya una contraseña
    if (!this.password) {
      this.mensaje = 'Debe ingresar una contraseña';
      return;
    }

    // 3. Controlar mínimo de 6 caracteres
    if (this.password.length < 6) {
      this.mensaje = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    // 4. Controlar requisitos de la contraseña
    const patronPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;

    if (!patronPassword.test(this.password)) {
      this.mensaje =
        'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial';
      return;
    }

    // 5. Controlar que se haya confirmado la contraseña
    if (!this.confirmPassword) {
      this.mensaje = 'Debe confirmar la contraseña';
      return;
    }

    // 6. Controlar que ambas contraseñas coincidan
    if (this.password !== this.confirmPassword) {
      this.mensaje = 'Las contraseñas no coinciden';
      return;
    }

    // 7. Validar email
    const patronEmail =
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]{3,}(\.[a-zA-Z]{2,})?$/;

    if (!patronEmail.test(this.email)) {
      this.mensaje = 'Ingresá un email válido';
      return;
    }
   // 8. Guardar la cuenta temporalmente en el navegador
const usuario = {
  nombre: this.nombre,
  apellido: this.apellido,
  email: this.email.trim().toLowerCase(),
  password: this.password
};

localStorage.setItem('usuarioArmonia', JSON.stringify(usuario));

// Mostrar pantalla de registro exitoso
this.registroExitoso = true;
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  alternarConfirmPassword(): void {
    this.mostrarConfirmPassword = !this.mostrarConfirmPassword;
  }
  volverAlLogin(): void {
  window.location.href = '/login';
}
}