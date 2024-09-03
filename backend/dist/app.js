"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes")); // Adjust the path as necessary
const app = (0, express_1.default)();
const PORT = 8080;
app.set('view engine', 'ejs');
app.use(express_1.default.json());
app.use('/api', routes_1.default); // Use the aggregated routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
