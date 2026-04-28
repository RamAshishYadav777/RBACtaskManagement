const validateApiKey = (req, res, next) => {
    // skip validation for preflight requests
    if (req.method === 'OPTIONS') {
        return next();
    }

    const apiKey = req.header('x-secret-key');
    const validKey = process.env.APP_SECRET_KEY;

    if (!apiKey || apiKey !== validKey) {
        console.warn(`[Security] API Key Mismatch! Received: ${apiKey ? '***' + apiKey.slice(-4) : 'NONE'} | Expected: ***${validKey.slice(-4)} | URL: ${req.originalUrl}`);
        return res.status(403).json({
            success: false,
            message: 'Access denied: Invalid or missing X-Secret-Key'
        });
    }


    next();
};

module.exports = validateApiKey;
