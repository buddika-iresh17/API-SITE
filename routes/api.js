const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// API Status Check
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

//==============    API       ======

// Movie API Routes
const cinesubzRouter = require('./cinesubz');
router.use('/cinesubz', cinesubzRouter);

module.exports = router;