import { Request, Response } from 'express';
import JwtHelper from '../../utils/jwtHelper';
import redis from '../../utils/redis';
import ClientsService from './index.service';
import { AccessToken, RefreshToken } from '../../types';

let jwtHelper: JwtHelper = new JwtHelper();
let clientsService: ClientsService = new ClientsService();

export default class ClientAuthController {
    async exchangeCodeForToken(req: Request, res: Response): Promise<void> {
        let { code, client_id, client_secret }: { code: string; client_id: string; client_secret: string } = req.body;
        if (!code || !client_id || !client_secret) {
            res.status(400).json({
                ok: false,
                message: 'Missing required parameters'
            });
            return;
        }
        
        if (!await clientsService.verifyClientSecretS(client_id, client_secret)) {
            res.status(401).json({
                ok: false,
                message: 'Invalid client secret'
            });
            return;
        }

        let [storedClientId, userId] = redis.get(code) as [string, string];
        if (!storedClientId || storedClientId !== client_id) {
            res.status(401).json({
                ok: false,
                message: 'Invalid code'
            });
            return;
        }

        let accessToken: AccessToken = {
            token: jwtHelper.sign({ "type": "access_token", client_id, user_id: userId }),
            expires_in: 3600
        };
        let refreshToken: RefreshToken = {
            token: jwtHelper.sign({ "type": "refresh_token", client_id, user_id: userId }),
            expires_in: 86400
        };
        res.status(200).json({
            ok: true,
            accessToken,
            refreshToken
        });
    }
}