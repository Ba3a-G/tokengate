import { pool } from '../../utils/db';
import { IsValidClient } from '../../types';

export default class ClientsService {
    async getClientS<T>(client_id: string, client_secret: string, fields: string[] = ['*']): Promise<T | null> {
        const query = {
            text: `SELECT ${fields.join(',')} FROM clients WHERE client_id = $1 AND client_secret = $2`,
            values: [client_id, client_secret]
        };

        try {
            const { rows } = await pool.query(query);
            return rows[0];
        } catch (err) {
            console.error('Failed to fetch client', err);
            return null;
        }

    };

    async verifyClientSecretS(client_id: string, client_secret: string): Promise<boolean> {
        const query = {
            text: `SELECT * FROM clients WHERE client_id = $1 AND client_secret = $2`,
            values: [client_id, client_secret]
        };

        try {
            const { rows } = await pool.query(query);
            return rows.length == 1;
        } catch (err) {
            console.error('Failed to verify client secret', err);
            return false;
        }
    }

    async isValidClient(client_id: string, redirect_uri: string, origin: string, scopes: string[]): Promise<IsValidClient> {
        const query = {
            text: `SELECT * FROM clients WHERE client_id = $1`,
            values: [client_id]
        };

        try {
            const { rows } = await pool.query(query);
            rows[0].origins = rows[0].origins.map((o: string) => o.replace(/(http:\/\/|https:\/\/)/, ''));
            let originMatch: boolean = rows[0].origins.includes(origin);
            let redirectUriMatch: boolean = rows[0].redirect_uris.includes(redirect_uri);
            let scopesMatch: boolean = scopes.every(scope => rows[0].scopes.includes(scope));

            if (originMatch && redirectUriMatch && scopesMatch) {
                return {
                    success: true,
                    client_id: true,
                    origin: originMatch,
                    redirect_uri: redirectUriMatch,
                    scopes: scopesMatch
                };
            } else {
                return {
                    success: false,
                    client_id: true,
                    origin: originMatch,
                    redirect_uri: redirectUriMatch,
                    scopes: scopesMatch
                };
            }
        } catch (err) {
            console.error('Failed to verify client', err);
            return {
                success: false,
                client_id: false,
                origin: false,
                redirect_uri: false,
                scopes: false
            };
        }
    }

}