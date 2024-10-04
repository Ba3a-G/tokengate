import express, { Request, Response, Application } from 'express';
import 'dotenv/config';
import cookieParser from 'cookie-parser';

import { connectToDatabase } from './utils/db';
import UserAuthController from './resources/auth/users.controller';
import ClientAuthController from './resources/auth/clients.controller';
import { authMiddleware } from './middlewares/auth';

const port: number = 3000;
const app: Application = express();
const userAuthController: UserAuthController = new UserAuthController();
const clientAuthController: ClientAuthController = new ClientAuthController();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req: Request, res: Response): void => {
    res.json({
        ok: true,
        message: 'healthy'
    });
});

app.post('/login', userAuthController.handleLogin);
app.get('/oauth', authMiddleware, userAuthController.handleOauthRequest);
app.post('/token', clientAuthController.token);

const startServer = async (): Promise<void> => {
    await connectToDatabase();
    app.listen(port, (): void => {
        console.log(`Server running on port ${port}`);
    });
}

startServer();