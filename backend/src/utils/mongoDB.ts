import { MongoClient, Db, ServerApiVersion, Collection, Document } from 'mongodb';

const uri: string = "mongodb+srv://knightdips:dEqg1tnwN8qspd4t@cluster0.basaftx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let dbConnection: Db | null = null;

interface DbUser extends Document{
    _id?: string;
    username: string;
    password?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

async function connectDB(): Promise<Db> {
    if (dbConnection) {
        return dbConnection;
    }

    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        dbConnection = client.db("myDB");
        return dbConnection;
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
}

// Generic function to get a collection for any type that extends Document
async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
    const database = await connectDB();
    return database.collection<T>(collectionName);
}

async function closeConnection() {
    try {
        await client.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
}

export { getCollection, closeConnection, DbUser };
