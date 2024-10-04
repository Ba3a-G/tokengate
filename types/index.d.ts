import { Request } from 'express';

export interface JwtPayload {
    username: string;
    email: string;
    role: string;
    name: string;
    image?: string;
}

export interface AuthCodeGrantQueryParams {
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
    state?: string;
}

export interface User {
    email: string;
    role: string;
    name: string;
    image?: string;
}

export interface AccessToken {
    token: string;
    expires_in: number;
}

export interface RefreshToken {
    token: string;
    expires_in: number;
}

export interface IsValidClient {
    success: boolean;
    client_id: boolean;
    origin: boolean;
    redirect_uri: boolean;
    scopes?: boolean;
}

export interface RequestI extends Request {
    user?: JwtPayload | null;
}