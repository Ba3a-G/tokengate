import { Request, Response } from 'express';
import JwtHelper from '../../utils/jwtHelper';
import redis from '../../utils/redis';
import ClientsService from './index.service';
import { AccessToken, RefreshToken } from '../../types';

enum GrantTypes {
    CLIENT_CREDENTIALS = 'client_credentials',
    AUTHORIZATION_CODE = 'authorization_code'
}

let jwtHelper: JwtHelper = new JwtHelper();
let clientsService: ClientsService = new ClientsService();

export default class ClientAuthController {
    constructor() {
        this.token = this.token.bind(this);
    }

    async _generateRefreshToken(client_id: string): Promise<RefreshToken> {
        // ToDo: Decide refresh token strategy. Dummy for now.
        let refreshToken: RefreshToken = {
            token: jwtHelper.sign({ "type": "refresh_token", client_id }),
            expires_in: 86400
        };
        return refreshToken;
    };

    async _tokenClientCredentials(client_id: string, client_secret: string): Promise<AccessToken> {
        let accessToken: AccessToken = {
            token: jwtHelper.sign({ "type": "access_token", client_id }),
            expires_in: 3600
        };
        return accessToken;
    };

    async _tokenAuthorizationCode(code: string, client_id: string, client_secret: string): Promise<AccessToken> {
        let _codeDetails = redis.get(code) as [string, string];
        if (!_codeDetails) {
            throw new Error('Invalid code');
        }

        let [clientId, userId] = _codeDetails;
        if (clientId !== client_id) {
            throw new Error('Invalid code');
        }

        let accessToken: AccessToken = {
            token: jwtHelper.sign({ "type": "access_token", client_id, user_id: userId }),
            expires_in: 3600
        };
        return accessToken;
    };


    async token(req: Request, res: Response): Promise<void> {
        let { code, client_id, client_secret, grant_type }: { code: string; client_id: string; client_secret: string, grant_type: string } = req.body;
        if (!Object.values(GrantTypes).includes(grant_type as GrantTypes)) {
            res.status(400).json({
                ok: false,
                message: 'Grant type not supported'
            });
            return;
        }
        if (!client_id || !client_secret || !grant_type) {
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

        let refreshToken: RefreshToken = await this._generateRefreshToken(client_id);

        if (grant_type === GrantTypes.CLIENT_CREDENTIALS) {
            let accessToken: AccessToken = await this._tokenClientCredentials(client_id, client_secret);
            res.status(200).json({
                ok: true,
                access_token: accessToken.token,
                refresh_token: refreshToken.token,
                token_type: 'Bearer',
                expires_in: accessToken.expires_in
            });
            return;
        } else if (grant_type === GrantTypes.AUTHORIZATION_CODE) {
            try {
                let accessToken: AccessToken = await this._tokenAuthorizationCode(code, client_id, client_secret);
                res.status(200).json({
                    ok: true,
                    access_token: accessToken.token,
                    refresh_token: refreshToken.token,
                    token_type: 'Bearer',
                    expires_in: accessToken.expires_in
                });
                return;
            } catch (err) {
                if (err.message === 'Invalid code') {
                    res.status(401).json({
                        ok: false,
                        message: 'Invalid code'
                    });
                    return;
                } else {
                    console.error(err);
                    res.status(500).json({
                        ok: false,
                        message: 'Internal server error'
                    });
                    return;
                }
            }
        }
    }
}