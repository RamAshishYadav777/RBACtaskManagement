const mongoose = require('mongoose');

const dbConnect = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('✅ Database Connected Successfully');
    } catch (error) {
        console.error('❌ Database Connection Failed:', error.message);
        process.exit(1);
    }
};

module.exports = dbConnect;
