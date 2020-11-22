const { Router } = require("express"); //voy a importar algo del modulo express y eso sera la funcion Router
const router = Router(); //esto lo guardare en una constante llamada router tambien pero en minuscula
const jwt = require("jsonwebtoken");
//importando funciones
const {
  getTutorMaps,
  createUsers,
  login,
  ensureToken,
  protec,
  getTutors,
  getSubject,
  setDate,
  getDates,
  createTutor,
  prueba,
  getRoomst,
} = require("../controllers/index.controller");

//asignando rutas
router.get("/maps", getTutorMaps);
router.post("/singup", createUsers);
router.post("/login", login);
router.get("/profile", ensureToken, protec);
router.get("/home", getSubject);
router.get("/subjects/:subjectId", getTutors);
//router.get('/subjects/1',getTutors);
router.post("/session", setDate);
router.get("/dates", ensureToken, getDates);
router.post("/singup-tutor", createTutor);
router.get("/prueba", prueba);
router.get("/rooms", ensureToken, getRoomst);

module.exports = router;
