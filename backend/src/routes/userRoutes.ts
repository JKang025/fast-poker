import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();
const { MongoClient, ServerApiVersion} = require("mongodb");
import { getCollection, closeConnection, DbUser } from '../utils/mongoDB'
import {Collection} from 'mongodb'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


const COLLECTIONNAME = "users";
const SECRETKEY = 'aggag1i32'


router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        console.log('Request body:', req.body);
        // Check if username is provided
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        // Check if the user exists
        let { exists, user } = await checkUsername(username);
        
        // If the user doesn't exist, create a new one
        if (!exists) { 
            const { user : newUser } = await createUser(username);
            const nonNullUser = newUser as DbUser;
            if(password){
                await addPassword(nonNullUser, password)
            }
            user = nonNullUser
        } 

        console.log('hehe')

        // login
        const nonNullUser = user as DbUser;
        const { success, token }  = await login(nonNullUser, password)

        if (success) {
            return res.status(200).json({ token });
        } else {
            return res.status(401).json({ message: 'Invalid password' });
        }
        
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/setpassword', async (req: Request, res: Response) => {
    try {
        const { username, newPassword } = req.body;

        // Check if username and newPassword are provided
        if (!username || !newPassword) {
            return res.status(400).json({ message: 'Username and new password are required' });
        }

        // Check if the user exists
        const { exists, user } = await checkUsername(username);

        if (!exists || !user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user already has a password
        if (user.password) {
            return res.status(400).json({ message: 'Password is already set for this user' });
        }

        // Set the new password
        await addPassword(user, newPassword);

        return res.status(200).json({ message: 'Password set successfully' });
    } catch (error) {
        console.error('Error setting password:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});



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
    return {user: newUser}
}

async function addPassword(user: DbUser, plainPassword: string){
    const collection: Collection<DbUser> = await getCollection('users');

    // Hash the password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Updating user in database with password
    await collection.updateOne(
        { _id: user._id },  
        { $set: { password: hashedPassword, updatedAt: new Date() } }  
    );

    // Update user object as well
    user.password = hashedPassword

    console.log(`Password added for user ${user.username}`);
}

async function login(user: DbUser, given_password?: string){
    let passwordIsValid = true;


    if (given_password && user.password) {
        passwordIsValid = await bcrypt.compare(given_password, user.password);
    } 

    if (passwordIsValid) {
        const token = jwt.sign({ id: user._id }, SECRETKEY, { expiresIn: 86400 }); // 24 hours
        return { success: true, token: token };
    } else {
        return { success: false, token: null };
    }
}

export default router;