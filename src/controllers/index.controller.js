//requieriendo el modulo para utilizar postgres
const { Pool } = require("pg"); //pool es un conjunto de conexiones que pueden usar a medida que se van haciendo peticiones
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const moment = require("moment");

//esto sirve para realizar la conexion a nuestra base de datos lo guardamos en una constante
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "root",
  database: "REDU",
  port: "5432",
});

//aca iran todas las funciones que se importaron dentro de ./routes/index.js y se almacenaron en una constante
//Await se le coloca debido a que hace la consulta asincrona  se guarda en una constante response y ya que tardaria mucho esta consulta y node no espera
//pero para ser asincrona a la funcion tambien se le debe colocar Async

const createUsers = async (req, res) => {
  const { phone, name, email, password, picture } = req.body; //para indicarle cuales campos contiene el Json
  const user_type = 1;
  const userId = await pool.query(
    "SELECT user_id FROM public.user WHERE email=$1",
    [email]
  );
  if (userId.rowCount == 0) {
    const response = await pool.query(
      "INSERT INTO public.user (user_type,phone,name,email,password,picture) VALUES ($1,$2,$3,$4,$5,$6)",
      [user_type, phone, name, email, password, picture]
    );
    res.json({
      message: "WELCOME",

      body: {
        user: { name, email },
      },
    });
  } else {
    res
      .status(500)
      .json({ message: "USUARIO YA REGISTRADO PRUEBE CON OTRO CORREO" });
  }
};

const createTutor = async (req, res) => {
  const {
    phone,
    name,
    email,
    password,
    lat,
    lon,
    profession,
    subject_id,
    description,
    consult_day,
    begin_cosult,
    end_consult,
  } = req.body; //para indicarle cuales campos contiene el Json
  const user_type = 2;
  const val = await pool.query(
    "SELECT user_id FROM public.user WHERE email=$1",
    [email]
  );
  if (val.rowCount == 0) {
    const response = await pool.query(
      "INSERT INTO public.user (user_type,phone,name,email,password) VALUES ($1,$2,$3,$4,$5)",
      [user_type, phone, name, email, password]
    );
    const userId = await pool.query(
      "SELECT user_id FROM public.user WHERE email=$1 AND password=$2",
      [email, password]
    );
    const useres = userId.rows[0].user_id;
    const resp = await pool.query(
      "INSERT INTO public.tutor (user_id,lat,lon,profession,description,consult_day,begin_cosult,end_consult) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        parseInt(useres, 10),
        lat,
        lon,
        profession,
        description,
        consult_day,
        begin_cosult,
        end_consult,
      ]
    );
    //Captura el id del nuevo tutor registrado para asignarselo a la tabla tutor_x_subject de forma manual
    const tutorId = await pool.query(
      "SELECT tutor_id FROM public.user INNER JOIN public.tutor ON public.user.user_id = public.tutor.user_id WHERE public.tutor.user_id = $1",
      [parseInt(useres, 10)]
    );
    const tutorID = tutorId.rows[0].tutor_id;
    //Se le agrego el subject_id que será el tema en el que desean desarrollarse como tutores y esto se inserta junto con el id del nuevo tutor a la taba tutor_x_subject

    for (const type of subject_id) {
      const proof = await pool.query(
        "INSERT INTO public.tutor_x_subject (tutor_id,subject_id) VALUES ($1,$2)",
        [parseInt(tutorID, 10), type]
      );
    }

    res.json({
      message: "WELCOME NOW YOU ARE A TUTOR",

      body: {
        user: { name, email },
      },
    });
  } else {
    res
      .status(500)
      .json({ message: "USUARIO YA REGISTRADO PRUEBE CON OTRO CORREO" });
  }
};

const getTutorMaps = async (req, res) => {
  const response = await pool.query(
    "SELECT  public.subject.name, public.subject.subject_id, count(public.tutor_x_subject.subject_id) AS tutors FROM public.subject INNER JOIN public.tutor_x_subject ON (public.subject.subject_id = public.tutor_x_subject.subject_id)  GROUP BY public.subject.subject_id, public.subject.name ORDER BY public.subject.subject_id"
  );

  const tutors = await pool.query(
    "SELECT public.tutor_x_subject.subject_id,public.tutor.lon, public.tutor.lat,public.tutor.tutor_id, public.tutor.lon, public.tutor.lat, public.user.name,public.user.email , public.user.phone, public.user.picture, public.tutor.profession, public.tutor.rating FROM public.user INNER JOIN public.tutor ON (public.user.user_id = public.tutor.user_id ) INNER JOIN Public.tutor_x_subject ON (public.tutor.tutor_id = public.tutor_x_subject.tutor_id ) INNER JOIN public.subject ON (public.tutor_x_subject.subject_id = public.subject.subject_id )"
  );

  res.status(200).json({
    NumberTutors: response.rows,
    Tutors: tutors.rows,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const pass = await bcrypt.hash(password, 10);
  const userId = await pool.query(
    "SELECT * FROM public.user WHERE email=$1 AND password=$2",
    [email, password]
  );

  if (userId.rowCount == 0) {
    res.status(500).json({
      message:
        "USUARIO NO REGISTRADO, CORREO INCORRECTO, PRUEBE CON OTRO CORREO",
    });
  } else {
    const user = userId.rows[0];
    const token = jwt.sign({ email, password }, "my_secret_key");
    res.status(200).json({ MESSAGE: "Logged in successfully!", token, user });
  }
};

const protec = (req, res) => {
  jwt.verify(req.token, "my_secret_key", (err, data) => {
    if (err) {
      res.sendStatus(403);
    } else {
      res.json({
        text: "protected",
        data,
      });
    }
  });
};

function ensureToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}

const getTutors = async (req, res) => {
  const subject = req.params.subjectId;
  const response = await pool.query(
    "SELECT public.tutor.tutor_id, public.tutor.lon, public.tutor.lat, public.user.name,public.user.email , public.user.phone, public.user.picture, public.tutor.profession, public.tutor.rating  FROM public.user INNER JOIN public.tutor ON (public.user.user_id = public.tutor.user_id ) INNER JOIN Public.tutor_x_subject ON (public.tutor.tutor_id = public.tutor_x_subject.tutor_id ) INNER JOIN public.subject ON (public.tutor_x_subject.subject_id = public.subject.subject_id ) WHERE public.subject.subject_id = $1",
    [subject]
  );

  res.status(200).json(response.rows);
};

const setDate = async (req, res) => {
  const { tutor_id, status, type, date, user_id } = req.body;
  const end_room = moment(date).add(2, "days").format("YYYY-MM-DD HH:mm:ss");

  //{"tutor_id":"1","status":"true","type":"true","date":"11/10/11","user_id":"1"}

  try {
    const response = await pool.query(
      "INSERT INTO session (tutor_id,status,type,date,user_id) VALUES ($1,$2,$3,$4,$5)",
      [tutor_id, status, type, date, user_id]
    );
    const session_id = await pool.query(
      "SELECT session_id FROM session WHERE session.tutor_id = $1 AND session.user_id =$2 ORDER BY session_id DESC LIMIT 1",
      [tutor_id, user_id]
    );
    const verify = await pool.query(
      "SELECT * FROM public.room WHERE room.tutor_id=$1 AND room.user_id = $2",
      [tutor_id, user_id]
    );

    if (verify.rowCount == 0) {
      //INSERT
      const room = await pool.query(
        "INSERT INTO room (tutor_id,user_id,end_room) VALUES ($1,$2,$3)",
        [tutor_id, user_id, end_room]
      );

      res.status(200).json({
        MESSAGE:
          "SESSION RESERVADA CORRECTAMENTE TIENES 2 DIAS DE CHAT ILIMITADO",
        session_id: session_id.rows[0].session_id,
      });
    } else {
      //UPDATE
      const room = await pool.query(
        "UPDATE public.room SET end_room=$1  WHERE tutor_id = $2 AND user_id = $3",
        [end_room, tutor_id, user_id]
      );

      res.status(200).json({
        MESSAGE:
          "BIENVENIDO NUEVAMENTE HEMOS HABILITADO 2 DIAS MAS DE CHAT ILIMITADO",
        session_id: session_id.rows[0].session_id,
      });
    }
  } catch (error) {
    console.log("Este es el error", error);
    res.status(200).json({ message: "SE HA PRESENTADO UN ERROR" });
  }
};

const getSubject = async (req, res) => {
  const response = await pool.query("SELECT * FROM public.subject");
  if (response == false) {
    res.sendStatus(403);
  } else {
    res.status(200).json(response.rows);
  }
};

const getDates = async (req, res) => {
  const user_id = req.params.userId;
  const response = await pool.query(
    "SELECT public.session.*, public.user.name AS TUTOR_NAME, public.user.picture, public.tutor.lat, public.tutor.lon FROM public.session INNER JOIN public.tutor ON (session.tutor_id=tutor.tutor_id) INNER JOIN public.user ON (public.tutor.user_id = public.user.user_id) WHERE session.user_id = $1",
    [user_id]
  );

  jwt.verify(req.token, "my_secret_key", (err, data) => {
    if (err) {
      res.sendStatus(403);
    } else {
      res.status(200).json(response.rows);
    }
  });
};

const getRoomst = async (req, res) => {
  const tutor_id = req.params.userId;
  const response = await pool.query(
    "	SELECT public.user.picture,public.user.name, public.room_message.message,public.user.user_id FROM public.user INNER JOIN public.room ON (public.user.user_id = public.room.user_id) INNER JOIN public.room_message ON (public.room.room_id = public.room_message.room_id)  WHERE tutor_id = $1 LIMIT 1",
    [tutor_id]
  );

  jwt.verify(req.token, "my_secret_key", (err, data) => {
    if (err) {
      res.sendStatus(403);
    } else {
      res.status(200).json(response.rows);
    }
  });
};

const getRoomsu = async (req, res) => {
  const  user_id  = req.params.userId;
    const response = await pool.query(
    "	SELECT public.user.picture,public.user.name, public.room_message.message,public.user.user_id FROM public.room_message INNER JOIN public.room ON (public.room_message.room_id = public.room.room_id) INNER JOIN public.tutor ON (public.room.tutor_id = public.tutor.tutor_id) INNER JOIN public.user ON (public.tutor.user_id = public.user.user_id) WHERE public.room.user_id = $1 LIMIT 1",
    [user_id]
  );

  jwt.verify(req.token, "my_secret_key", (err, data) => {
    if (err) {
      res.sendStatus(403);
    } else {
      res.status(200).json(response.rows);
    }
  });
};

const prueba = async (req, res) => {
  //console.log(moment().format('MMMM Do YYYY HH:mm:ss'));
  const date = moment().add(2, "days").format("YYYY-MM-DD HH:mm:ss");
  const response = await pool.query(
    "SELECT  public.subject.name, public.subject.subject_id, count(public.tutor_x_subject.subject_id) AS tutors FROM public.subject INNER JOIN public.tutor_x_subject ON (public.subject.subject_id = public.tutor_x_subject.subject_id)  GROUP BY public.subject.subject_id, public.subject.name ORDER BY public.subject.subject_id"
  );

  const tutors = await pool.query(
    "SELECT public.tutor.tutor_id, public.tutor.lon, public.tutor.lat, public.user.name,public.user.email , public.user.phone, public.user.picture, public.tutor.profession, public.tutor.rating FROM public.user INNER JOIN public.tutor ON (public.user.user_id = public.tutor.user_id ) INNER JOIN Public.tutor_x_subject ON (public.tutor.tutor_id = public.tutor_x_subject.tutor_id ) INNER JOIN public.subject ON (public.tutor_x_subject.subject_id = public.subject.subject_id )"
  );

  //var from = moment(dateFrom, hora)
  //const now = moment(date).add(7, 'days')

  //res.status(200).json(NumberTutors:{response.rows});

  res.status(500).json({
    NumberTutors: response.rows,
    Tutors: tutors.rows,
  });
};

module.exports = {
  getTutorMaps,
  createTutor,
  createUsers,
  login,
  protec,
  ensureToken,
  getTutors,
  getSubject,
  setDate,
  getDates,
  getRoomst,
  getRoomsu,
  prueba,
};
