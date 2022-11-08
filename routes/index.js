const express = require('express');
const router = express.Router();

// version1 api routers
router.use('/v1', require('./v1'))

module.exports = router;