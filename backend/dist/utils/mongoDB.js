"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollection = getCollection;
exports.closeConnection = closeConnection;
const mongodb_1 = require("mongodb");
const uri = "mongodb+srv://knightdips:dEqg1tnwN8qspd4t@cluster0.basaftx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
let dbConnection = null;
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (dbConnection) {
            return dbConnection;
        }
        try {
            yield client.connect();
            console.log('Connected successfully to MongoDB');
            dbConnection = client.db("myDB");
            return dbConnection;
        }
        catch (error) {
            console.error('Failed to connect to MongoDB', error);
            process.exit(1);
        }
    });
}
// Generic function to get a collection for any type that extends Document
function getCollection(collectionName) {
    return __awaiter(this, void 0, void 0, function* () {
        const database = yield connectDB();
        return database.collection(collectionName);
    });
}
function closeConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.close();
            console.log('MongoDB connection closed');
        }
        catch (error) {
            console.error('Error closing MongoDB connection:', error);
        }
    });
}
