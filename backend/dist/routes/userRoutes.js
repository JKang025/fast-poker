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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { MongoClient, ServerApiVersion } = require("mongodb");
const mongoDB_1 = require("../utils/mongoDB");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const COLLECTIONNAME = "users";
const SECRETKEY = 'aggag1i32';
router.get('/login', (req, res) => {
    const { username } = req.body;
    run().catch(console.dir);
    res.send('User list');
});
function run() {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
function checkUsername(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const collection = yield (0, mongoDB_1.getCollection)('users');
        const user = yield collection.findOne({ username: username });
        return { exists: user !== null, user };
    });
}
function createUser(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const collection = yield (0, mongoDB_1.getCollection)(COLLECTIONNAME);
        const newUser = {
            username: username,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = yield collection.insertOne(newUser);
        console.log(`A document was inserted with the _id: ${result.insertedId}`);
    });
}
function addPassword(user) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
function login(given_password, user) {
    return __awaiter(this, void 0, void 0, function* () {
        let passwordIsValid = true;
        if (user.password) {
            passwordIsValid = yield bcrypt_1.default.compare(given_password, user.password);
        }
        else {
            passwordIsValid = false;
        }
        if (passwordIsValid) {
            const token = jsonwebtoken_1.default.sign({ id: user._id }, SECRETKEY, { expiresIn: 86400 }); // 24 hours
            return { success: true, token: token };
        }
        else {
            return { success: false };
        }
    });
}
// MIDDLEWARE
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Authorization: Bearer TOKEN
    if (token == null)
        return res.sendStatus(401); // if there's no token, return 401
    jsonwebtoken_1.default.verify(token, SECRETKEY, (err, decoded) => {
        if (err)
            return res.sendStatus(403); // if the token has expired or is invalid, return 403
        req.userId = decoded.userId; // Add the user ID to the request object
        next(); // pass the execution off to whatever request the client intended
    });
}
exports.default = router;
