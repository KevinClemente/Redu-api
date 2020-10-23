const {Router} = require('express'); //voy a importar algo del modulo express y eso sera la funcion Router
const router  = Router() //esto lo guardare en una constante llamada router tambien pero en minuscula
const jwt = require('jsonwebtoken');
//importando funciones
const {getUsers,getTutor , createUsers,login,ensureToken,protec} = require('../controllers/index.controller');
 
//asignando rutas
router.get('/users', getUsers); //de aca se cortaron las funciones de ./controllers/index.controller
router.post('/singup', createUsers);
router.post('/singin', login);
router.get('/tutors',getTutor);
 
router.get('/profile',ensureToken,protec);
 
module.exports = router;