//requieriendo el modulo para utilizar postgres
const {Pool} = require ('pg'); //pool es un conjunto de conexiones que pueden usar a medida que se van haciendo peticiones
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

//esto sirve para realizar la conexion a nuestra base de datos lo guardamos en una constante
const pool = new Pool({
host:'localhost',
user:'postgres',
password:'root',
database:'REDU',
port:'5432'
});
 
//aca iran todas las funciones que se importaron dentro de ./routes/index.js y se almacenaron en una constante
//Await se le coloca debido a que hace la consulta asincrona  se guarda en una constante response y ya que tardaria mucho esta consulta y node no espera 
//pero para ser asincrona a la funcion tambien se le debe colocar Async
 
const createUsers= async (req,res)=>{
    const {phone,name,email,password,picture} = req.body; //para indicarle cuales campos contiene el Json
    const user_type = 1;
    const userId = await pool.query('SELECT user_id FROM public.user WHERE email=$1',[email]);
    if (userId.rowCount == 0){
        const response = await pool.query('INSERT INTO public.user (user_type,phone,name,email,password,picture) VALUES ($1,$2,$3,$4,$5,$6)', [user_type,phone,name,email,password,picture]);
        res.json({
            message: 'WELCOME',
        
            body:{
                user: {name,email}
            }
        });
    }
    else
    {
        res
      .status(500)
      .json({ message: "USUARIO YA REGISTRADO PRUEBE CON OTRO CORREO" });
    }
};

const createTutor= async (req,res)=>{
    const {phone,name,email,password,lat,lon,topic_id,profession,subject_id} = req.body; //para indicarle cuales campos contiene el Json
    const user_type = 2;
    const val = await pool.query('SELECT user_id FROM public.user WHERE email=$1',[email]);
    if (val.rowCount == 0){
        const response = await pool.query('INSERT INTO public.user (user_type,phone,name,email,password) VALUES ($1,$2,$3,$4,$5)', [user_type,phone,name,email,password]);
        const userId = await pool.query('SELECT user_id FROM public.user WHERE email=$1 AND password=$2',[email,password]);
        const useres = userId.rows[0].user_id;
        const resp = await pool.query('INSERT INTO public.tutor (user_id,lat,lon,topic_id,profession) VALUES ($1,$2,$3,$4,$5)', [parseInt(useres,10),lat,lon,topic_id,profession]);
        
        //Captura el id del nuevo tutor registrado para asignarselo a la tabla tutor_x_subject de forma manual
        const tutorId = await pool.query('SELECT tutor_id FROM public.user INNER JOIN public.tutor ON public.user.user_id = public.tutor.user_id WHERE public.tutor.user_id = $1',[parseInt(useres,10)]);
        const tutorID = tutorId.rows[0].tutor_id;
        //Se le agrego el subject_id que será el tema en el que desean desarrollarse como tutores y esto se inserta junto con el id del nuevo tutor a la taba tutor_x_subject
        const sub = await pool.query('INSERT INTO public.tutor_x_subject (tutor_id,subject_id) VALUES ($1,$2)', [parseInt(tutorID,10),subject_id])  
        res.json({
            message: 'WELCOME NOW YOU ARE A TUTOR',
        
            body:{
                user: {name,email}
            }
        });
    }
    else{
        res
      .status(500)
      .json({ message: "USUARIO YA REGISTRADO PRUEBE CON OTRO CORREO" });
    }
};
 
const getTutorMaps= async (req,res)=>{
 
    const response = await pool.query('SELECT name,email,phone,picture,lat,lon, profession FROM public.user INNER JOIN public.tutor ON public.tutor.user_id = public.user.user_id ');
 
    res.status(200).json(response.rows);
};

const login = async (req,res)=> {

     const {email,password}= req.body;
    const pass= await bcrypt.hash(password,10);
    const userId = await pool.query('SELECT * FROM public.user WHERE email=$1 AND password=$2',[email,password]);


    if(userId.rowCount==0)
        {
        res
        .status(500)
        .json({ message: "USUARIO NO REGISTRADO, CORREO INCORRECTO, PRUEBE CON OTRO CORREO" });
        }
    else
        {
        const user = userId.rows[0];
        const token = jwt.sign({email,password},'my_secret_key');
        res.status(200).json({"MESSAGE":"Logged in successfully!",token,user});
        }
       

};
 
const protec = (req,res)=>{
    jwt.verify(req.token,'my_secret_key',(err,data)=>{
        if(err){
            res.sendStatus(403);
        }else{
            res.json({
                text:'protected',
                data
            });
        }
 
    });
};
 
function ensureToken (req ,res, next){
    const bearerHeader = req.headers['authorization'];
    console.log(bearerHeader);
    if (typeof bearerHeader !== 'undefined'){
        const bearer = bearerHeader.split(" ");
        const bearerToken=bearer[1];
        req.token= bearerToken;
        next();
    }else{
       res.sendStatus(403); 
    }    
};

//ACA HAY QUE ARREGLAR ESTA CONSULTA
const getTutors= async(req,res) =>{
    
    const subject = req.params.subjectId;
    const response = await pool.query('SELECT public.user.name,public.user.email , public.user.phone, public.user.picture, public.tutor.profession, public.tutor.rating  FROM public.user INNER JOIN public.tutor ON (public.user.user_id = public.tutor.user_id ) INNER JOIN Public.tutor_x_subject ON (public.tutor.tutor_id = public.tutor_x_subject.tutor_id ) INNER JOIN public.subject ON (public.tutor_x_subject.subject_id = public.subject.subject_id ) WHERE public.subject.subject_id = $1',[subject]);

    jwt.verify(req.token,'my_secret_key',(err,data)=>{
        if(err){
            res.sendStatus(403);
        }else{
            res.status(200).json(response.rows,data);
        }
 
    });

};

const getSubject = async (req,res) => {
    const response = await pool.query('SELECT * FROM public.subject')
        if(response == false){
            res.sendStatus(403);
        }else{
            res.status(200).json(response.rows);
        }

    
};

const setDate = async (req,res) => {
    const {tutor_id,status,type,date,user_id} = req.body;
    //const user_id = req.data.userID;
    //const user_id = 1;
    //{"tutor_id":"1","status":"true","type":"true","date":"11/10/11","user_id":"1"}
    
    const response = await pool.query('INSERT INTO session (tutor_id,status,type,date,user_id) VALUES ($1,$2,$3,$4,$5)', [tutor_id,status,type,date,user_id]);
    jwt.verify(req.token,'my_secret_key',(err,data)=>{
        if(err){
            res.sendStatus(403);
        }else{
            res.status(200).send("DATOS INGRESADOS CORRECTAMENTE");         
        }
 
    });
    
};

const getDates = async (req,res) => {
    const user_id = req.body;
    const response = await pool.query('SELECT * FROM public.session WHERE user_id = $1', [user_id])
    
    jwt.verify(req.token,'my_secret_key',(err,data)=>{
        if(err){
            res.sendStatus(403);
        }else{
            res.status(200).json(response.rows);
        }
 
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
        getDates
};

//CODIGO APARENTEMENTE FUNCIONANDO
