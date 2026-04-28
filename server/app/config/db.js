const mongoose = require('mongoose');

const dbConnect = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        const conn = await mongoose.connect(uri);
        console.log(`[DB] Connected: ${conn.connection.host}`);
        // 1 = connected
        console.log(`[DB] State: ${mongoose.connection.readyState}`);
        mongoose.connection.on('error', (err) => {
            console.error(`[DB] Error: ${err.message}`);
        });
    } catch (error) {
        console.error(`[DB] Failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = dbConnect;
