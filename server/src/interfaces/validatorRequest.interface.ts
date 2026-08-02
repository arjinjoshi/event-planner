import { Request } from "express";

export type Source = "body" | "query" | "params" | "headers";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  is_email_verified: boolean;
  is_two_factor_enabled: boolean;
}

export interface ValidatedRequest<B = any, Q = any, P = any> extends Request {
  user?: AuthUser;
  validated?: {
    body?: B;
    query?: Q;
    params?: P;
    headers?: any;
  };
}
