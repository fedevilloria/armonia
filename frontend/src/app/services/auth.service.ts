
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  access_token: string;
}

interface TokenPayload {
  sub: number;
  rol: string;
  iat?: number;
  exp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = 'http://localhost:3000/auth';
  private readonly tokenKey = 'armonia_token';

  constructor(private http: HttpClient) {}

  login(
    correoElectronico: string,
    contrasena: string
  ): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      {
        correoElectronico,
        contrasena
      }
    ).pipe(
      tap(respuesta => {
        sessionStorage.setItem(
          this.tokenKey,
          respuesta.access_token
        );
      })
    );
  }

  obtenerToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  obtenerPayload(): TokenPayload | null {
    const token = this.obtenerToken();

    if (!token) {
      return null;
    }

    try {
      const base64 = token.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  obtenerRol(): string | null {
    return this.obtenerPayload()?.rol ?? null;
  }

  obtenerIdUsuario(): number | null {
    return this.obtenerPayload()?.sub ?? null;
  }

  estaAutenticado(): boolean {
    const payload = this.obtenerPayload();

    if (!payload || !payload.exp) {
      return false;
    }

    return payload.exp * 1000 > Date.now();
  }

  cerrarSesion(): void {
    sessionStorage.removeItem(this.tokenKey);
  }
}
