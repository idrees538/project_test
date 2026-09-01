const app = require('./app');
const connectDatabase = require('./config/database');
const cloudinary = require('cloudinary');
const PORT = process.env.PORT || 3099;
const HOST = process.env.HOST || '0.0.0.0';

// UncaughtException Error
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
});

// connectDatabase();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Bind IPv4 explicitly. Without a host Node binds the IPv6 wildcard, which
// on some setups accepts the connection but never serves it.
const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`)
});

// Unhandled Promise Rejection
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
});
