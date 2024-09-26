import * as dotenv from 'dotenv';
dotenv.config();
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRETKEY: string = process.env.SECRETKEY || 'defaultSecretKey';

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  // Authorization: Bearer TOKEN

    if (token == null) return res.sendStatus(401); 

    jwt.verify(token, SECRETKEY, (err, decoded: any) => {
        if (err) return res.sendStatus(403); // if the token has expired or is invalid, return 403

        req.userId = decoded.userId; // Add the user ID to the request object
        next(); 
    });
}
