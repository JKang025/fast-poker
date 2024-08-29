import express, { Request, Response } from 'express';
import routes from './routes'; // Adjust the path as necessary




const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

app.use(express.json())
app.use('/api', routes); // Use the aggregated routes


app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



