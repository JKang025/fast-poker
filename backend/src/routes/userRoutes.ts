import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
const { MongoClient, ServerApiVersion} = require("mongodb");
import { getCollection, closeConnection, DbUser } from '../utils/mongoDB'
import {Collection} from 'mongodb'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


const COLLECTIONNAME = "users";
const SECRETKEY = 'aggag1i32'


router.get('/login', (req: Request, res: Response) => {

    const { username } = req.body;

    run().catch(console.dir);
    res.send('User list');
});


async function run() {


}

async function checkUsername(username: string): Promise<{ exists: boolean, user: DbUser | null }> {
    const collection: Collection<DbUser> = await getCollection('users');
    const user = await collection.findOne({ username: username });
    return { exists: user !== null, user };
}

async function createUser(username: string) {
    const collection: Collection<DbUser> = await getCollection(COLLECTIONNAME)
    const newUser: DbUser = {
        username: username,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    const result = await collection.insertOne(newUser);
    console.log(`A document was inserted with the _id: ${result.insertedId}`);
}

async function addPassword(user: DbUser){

}

async function login(given_password: string,user: DbUser){
    let passwordIsValid = true;

    if (user.password) {
        passwordIsValid = await bcrypt.compare(given_password, user.password);
    } else {
        passwordIsValid = false;
    }

    if (passwordIsValid) {
        const token = jwt.sign({ id: user._id }, SECRETKEY, { expiresIn: 86400 }); // 24 hours
        return { success: true, token: token };
    } else {
        return { success: false };
    }
}

interface AuthenticatedRequest extends Request {
    userId?: string;
  }


  // MIDDLEWARE
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  // Authorization: Bearer TOKEN

    if (token == null) return res.sendStatus(401); // if there's no token, return 401

    jwt.verify(token, SECRETKEY, (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err) return res.sendStatus(403); // if the token has expired or is invalid, return 403

        req.userId = decoded.userId; // Add the user ID to the request object
        next(); // pass the execution off to whatever request the client intended
    });
}


export default router;