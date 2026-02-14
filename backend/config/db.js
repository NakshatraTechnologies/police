const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        const dbName = process.env.DB_NAME || "formdata";

        await mongoose.connect(uri, {
            dbName, // forces DB name even if URI doesn't include it
        });

        console.log(`MongoDB connected (db: ${dbName})`);
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
