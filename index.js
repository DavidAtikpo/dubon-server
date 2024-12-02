import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from "body-parser";
import express from "express";
import dbConnect from "./config/dbConfig.js";
import Order from './Routers/Order.js'
import User from './Routers/User.js'
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import Products from './Routers/Products.js'
import morgan from "morgan";
import cors from 'cors';
import session from 'express-session';
import cartRoute from './Routers/cartRoute.js';
import wishlistRoute from './Routers/wishlistRoute.js';
import Training from './Routers/Training.js'
import Admin from './Routers/Admin.js'
import searchRouter from './Routers/searchRouter.js'
import category from './Routers/category.js'
import Seller from "./Routers/Seller.js"
import http from 'http';
import Event from './Routers/Event.js'
import paymentRoutes from './Routers/payementRoute.js';
import MongoStore from 'connect-mongo';

// Initialize dotenv with absolute path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Express
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Connect to the database
dbConnect();

// Session configuration
app.use(session({
    secret: process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 jour
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Middleware setup
app.use(cookieParser());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({
    origin: ["http://localhost:3000", "https://dubonservice-event.vercel.app"],
    methods: ["POST", "GET", "DELETE", "PUT"],
    credentials: true
}));

// Routes
app.get("/", (req, res) => {
    res.json("Hello")
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/user", User);
app.use("/api/admin", Admin);
app.use("/api/product", Products);
app.use("/api", Seller);
app.use("/api", Training);
app.use('/api/category', category);
app.use('/api/orders', Order);
app.use("/api", Event);
app.use("/api/", cartRoute);
app.use('/api', wishlistRoute);
app.use('/api', searchRouter);
app.use('/api/payments', paymentRoutes);

// Error handling
app.use(errorHandler.notFound);
app.use(errorHandler.errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at PORT ${PORT}`);
});
