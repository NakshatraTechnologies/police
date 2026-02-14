import mongoose from 'mongoose';
import Form from './models/Form.js';
import dotenv from 'dotenv';

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log("Connected to DB");

        const forms = await Form.find({});
        if (forms.length > 0) {
            console.log("Found forms:", forms.length);
            console.log("Sample Form keys:", Object.keys(forms[0].toObject()));
            console.log("First Form isFavorite:", forms[0].isFavorite);
        } else {
            console.log("No forms found");
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

check();
