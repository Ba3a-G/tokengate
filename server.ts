import express, { Request, Response, Application } from 'express';
import 'dotenv/config';
import cookieParser from 'cookie-parser';

import { connectToDatabase } from './utils/db';
import UserAuthController from './resources/auth/users.controller';

const port: number = 3000;
const app: Application = express();
const userAuthController: UserAuthController = new UserAuthController();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req: Request, res: Response): void => {
    res.send('Hello World!');
});

app.post('/login', userAuthController.handleLogin);
app.get('/oauth', userAuthController.handleOauthRequest);

const startServer = async (): Promise<void> => {
    // await connectToDatabase();
    app.listen(port, (): void => {
        console.log(`Server running on port ${port}`);
    });
}

startServer();