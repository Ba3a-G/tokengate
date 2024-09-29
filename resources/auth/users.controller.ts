import { Request, Response } from 'express';
import JwtHelper from '../../utils/jwtHelper';
import redis from '../../utils/redis';
import { JwtPayload, QueryParams, User, IsValidClient } from '../../types';
import ClientsService from './index.service';

let jwtHelper: JwtHelper = new JwtHelper();
let clientsService: ClientsService = new ClientsService();

// some data for the dummy user
const user: User = {
    email: 'aryan@gmail.com',
    role: 'admin',
    name: 'Aryan',
    image: 'https://avatars.githubusercontent.com/u/47269261?v=4'
};

export default class UserAuthController {
    constructor() {
        this.handleOauthRequest = this.handleOauthRequest.bind(this);
    }

    private _generateSecretCode = (): string => {
        return Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000).toString();
    };

    private _addToKVStore(code: string, client_id: string, user_id: string): void {
        redis.set(code, [client_id, user_id]);
    };

    public async handleLogin(req: Request, res: Response): Promise<void> {
        let { username, password }: { username: string; password: string } = req.body;
        if (username !== process.env.ROOT_USER || password !== process.env.ROOT_PASS) {
            res.status(401).json({
                ok: false,
                message: 'Invalid credentials'
            });
            return;
        }

        let payload: JwtPayload = { username, email: user.email, role: user.role, name: user.name };
        let token: string = jwtHelper.sign<JwtPayload>(payload);

        res.cookie('token', token, { httpOnly: true });
        res.json({
            ok: true,
            message: 'Logged in successfully',
        });
    }

    public async handleOauthRequest(req: Request, res: Response): Promise<void> {
        const { client_id, redirect_uri, response_type, scope }: QueryParams = req.query as QueryParams;
        let host: string | undefined = req.get('host');

        let requiredParams: { key: string, value: any }[] = [
            { key: 'client_id', value: client_id },
            { key: 'redirect_uri', value: redirect_uri },
            { key: 'host', value: host },
            { key: 'scope', value: scope },
        ];

        let missingParams: string[] = [];

        requiredParams.forEach(param => {
            if (!param.value) {
                missingParams.push(param.key);
            }
        });

        if (missingParams.length) {
            res.status(400).json({
                ok: false,
                message: 'Missing required parameters',
                required: missingParams
            });
            return;
        }

        // ToDos:
        // 1. Check if the client_id, redirect_uri, and origin are valid
        // 2. Check if the scopes are allowed
        let scopes: string[] = scope ? scope.split(' ') : [];
        let isValidClient: IsValidClient = await clientsService.isValidClient(client_id as string, redirect_uri as string, host as string, scopes);

        if (!isValidClient.success) {
            console.log(scopes, host)
            res.status(401).json({
                ok: false,
                message: 'Invalid client',
                ...isValidClient
            });
            return;
        }

        // Check if the user is logged in
        let token: string | undefined = req.cookies.token;
        let decoded: JwtPayload | null = token ? jwtHelper.verify<JwtPayload>(token) : null;
        if (!decoded) {
            let originalUrl: string = req.originalUrl;
            res.redirect(`/login?redirectTo=${originalUrl}`);
            return;
        }

        let code: string = this._generateSecretCode();
        this._addToKVStore(code, client_id as string, decoded.email);
        console.log(redis.keys());

        res.redirect(`${redirect_uri}?code=${code}`);
    }
}