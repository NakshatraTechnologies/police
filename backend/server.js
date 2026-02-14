import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from "./routes/auth.js";
import formRoutes from "./routes/forms.js";
import publicRoutes from "./routes/public.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/public", publicRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend build in production
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME || "fromdata" })
    .then((conn) => {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`MongoDB Connected (db: ${conn.connection.name})`);

        // SPA fallback — serve index.html for all non-API routes
        app.use((req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(console.error);
