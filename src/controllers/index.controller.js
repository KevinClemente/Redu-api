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
        res.send('USUARIO YA REGISTRADO PRUEBE CON OTRO CORREO')
    }
};

const createTutor= async (req,res)=>{
    const {phone,name,email,password,lat,lon,topic_id} = req.body; //para indicarle cuales campos contiene el Json
    const user_type = 2;
    const val = await pool.query('SELECT user_id FROM public.user WHERE email=$1',[email]);
    if (val.rowCount == 0){
        const response = await pool.query('INSERT INTO public.user (user_type,phone,name,email,password) VALUES ($1,$2,$3,$4,$5)', [user_type,phone,name,email,password]);
        const userId = await pool.query('SELECT user_id FROM public.user WHERE email=$1 AND password=$2',[email,password]);
        const useres = userId.rows[0].user_id;
        const resp = await pool.query('INSERT INTO public.tutor (user_id,lat,lon,topic_id) VALUES ($1,$2,$3,$4)', [parseInt(useres,10),lat,lon,topic_id]);
              
        res.json({
            message: 'WELCOME NOW YOU ARE A TUTOR',
        
            body:{
                user: {name,email}
            }
        });
    }
    else{
        res.send ('USUARIO YA REGISTRADO PRUEBE CON OTRO CORREO')
    }
};
 
const getTutorMaps= async (req,res)=>{
 
    const response = await pool.query('SELECT name,email,phone,picture,lat,lon, profession FROM public.user INNER JOIN public.tutor ON public.tutor.user_id = public.user.user_id ');
 
    res.status(200).json(response.rows);
};

const login = async (req,res)=> {
    
    const {email,password}= req.body;
    const pass= await bcrypt.hash(password,10);
    const response = await pool.query('SELECT email,password,user_id FROM public.user WHERE email=$1 AND password=$2',[email,password])
    const userId = await pool.query('SELECT user_id FROM public.user WHERE email=$1 AND password=$2',[email,password]);
    const userID=userId.rows[0].user_id;
    const token = jwt.sign({email,password,userID},'my_secret_key');
   

    if(response.rowCount==0)
        res.send({"error":"incorrect username or password"})
        
    else
        
        res.status(200).json({"MESSAGE":"Logged in successfully!",token});
        

    //ni me acuerdo porque hice esto pero ya no funciono xD  
    /*await pool.query('SELECT email,password,user_id FROM public.user WHERE email=$1 AND password=$2',[email,password])
    .then(response=>{
            const token = jwt.sign({email,password,user_id},'my_secret_key');
            res.json({
                Credential:{email,password},token});})
    .catch(err=>{
            pool.end();
                }) */  
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
 
const getTutors= async(req,res) =>{
    
    const subject = req.params.subjectId;
    const response = await pool.query('SELECT name,email,phone,picture FROM public.user INNER JOIN public.tutor ON public.tutor.user_id = public.user.user_id WHERE topic_id = $1',[subject]);

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
    
    jwt.verify(req.token,'my_secret_key',(err,data)=>{
        if(err){
            res.sendStatus(403);
            //res.render('login');
        }else{
            res.status(200).json(response.rows);
        }
 
    });
    
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
