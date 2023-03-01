const handle = (error, req, res, next) => {
    const message = error.message || 'Internal server error';
    res.status(500).json({
        message: message
    });
};

module.exports = handle;