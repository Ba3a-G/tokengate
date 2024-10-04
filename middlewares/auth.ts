import JwtHelper from "../utils/jwtHelper";
import { Request, Response, NextFunction } from "express";
import { JwtPayload, RequestI } from "../types";

let jwtHelper: JwtHelper = new JwtHelper();

export const authMiddleware = (req: RequestI, res: Response, next: NextFunction): void => {
    let token: string | undefined = req.cookies.token;
    let originalUrl: string = req.originalUrl;
    if (!token) {
        res.redirect(`/login?redirectTo=${originalUrl}`);
        return;
    }
    try {
        let decoded: JwtPayload | null= jwtHelper.verify<JwtPayload>(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.error(error);
        res.redirect(`/login?redirectTo=${originalUrl}`);
        return;
    }
};