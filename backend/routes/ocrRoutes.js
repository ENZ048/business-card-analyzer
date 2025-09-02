const express = require('express');
const router = express.Router();
const { processBusinessCard } = require('../controllers/ocrController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.array('cards', 10), processBusinessCard);

module.exports = router;
