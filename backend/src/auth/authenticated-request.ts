import type { Request } from 'express';

export interface AuthenticatedUser {
  sub: number;
  rol: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  professionalId?: number;
}
