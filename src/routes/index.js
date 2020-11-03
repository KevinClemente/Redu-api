const {Router} = require('express'); //voy a importar algo del modulo express y eso sera la funcion Router
const router  = Router() //esto lo guardare en una constante llamada router tambien pero en minuscula
const jwt = require('jsonwebtoken');
//importando funciones
const {getUsers, createUsers,login,ensureToken,protec,getTutors,getSubject} = require('../controllers/index.controller');
 
//asignando rutas
router.get('/users', getUsers); //de aca se cortaron las funciones de ./controllers/index.controller
router.post('/singup', createUsers);
router.post('/singin', login); 
router.get('/profile',ensureToken,protec);
router.get('/home',getSubject)

//tutores por categoria
router.get('/subjects/tutors/:subjectId',getTutors);
router.get('/subjects/tutors/1',getTutors); 
 
module.exports = router;