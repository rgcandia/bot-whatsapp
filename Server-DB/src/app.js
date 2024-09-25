//Módulo app.js Servidor express
const express =  require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const routes = require('./routes/route.js');
const cors = require('cors');
const server =  express();
//Config
server.name = 'Api-Bot-Whatsapp';
server.use(express.json());
server.use(cookieParser());
server.use(morgan('dev'));
server.use(cors());
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});
// Inicio Router
server.use('/', routes);
//Exporto módulo
module.exports = server;
