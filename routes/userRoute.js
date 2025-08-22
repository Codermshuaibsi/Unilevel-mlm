const express = require('express');
const { investment } = require('../controllers/userController');

const investrouter = express.Router();


investrouter.post('/invest', investment)




module.exports = investrouter;