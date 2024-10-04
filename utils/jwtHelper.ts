import jwt, { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';

export default class JwtHelper {
    private secret: string;

    constructor() {
        // || should NEVER be used but who cares it's just a POC
        this.secret = process.env.JWT_SECRET || 'supersecretkey';
    }

    sign<T extends object>(payload: T, options?: SignOptions): string {
        return jwt.sign(payload, this.secret, options);
    }

    verify<T extends JwtPayload>(token: string, options?: VerifyOptions): T | null {
        try {
            return jwt.verify(token, this.secret, options) as T;
        } catch (err) {
            return null;
        }
    }

    decode<T extends JwtPayload>(token: string): T | null {
        return jwt.decode(token) as T;
    }
}