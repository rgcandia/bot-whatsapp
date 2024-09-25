//Módulo router.js Manejador de rutas
const {Router} = require('express');
const get_user =  require('./handlers/handler_get_user');
const post_user = require('./handlers/handler_post_user.js');
const router = Router();
// Config
// Ejemplo: router.use('/auth', authRouter);
router.get('/user',get_user);
router.post('/user',post_user);
//Exporto módulo
module.exports = router;
