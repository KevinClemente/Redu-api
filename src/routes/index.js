const {Router} = require('express'); //voy a importar algo del modulo express y eso sera la funcion Router
const router  = Router() //esto lo guardare en una constante llamada router tambien pero en minuscula
const jwt = require('jsonwebtoken');
//importando funciones
const {getUsers, createUsers,login,ensureToken,protec,getTutors,getSubject,setDate,getDates} = require('../controllers/index.controller');
 
//asignando rutas
router.get('/users', getUsers); 
router.post('/singup', createUsers);
router.post('/login', login); 
router.get('/profile',ensureToken,protec);

//pantalla de inicio con las tarjetas
router.get('/home',ensureToken, getSubject)

//tutores por categoria
router.get('/subjects/tutors/:subjectId',ensureToken,getTutors);
router.get('/subjects/tutors/1',getTutors); 
router.post('/session',ensureToken,setDate);
router.get('/dates',ensureToken,getDates) 
module.exports = router;
