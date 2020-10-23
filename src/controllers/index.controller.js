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
    const {user_type,phone,name,email,password} = req.body; //para indicarle cuales campos contiene el Json
    const response = await pool.query('INSERT INTO public.user (user_type,phone,name,email,password) VALUES ($1,$2,$3,$4,$5)', [user_type,phone,name,email,password]);
    console.log(response);
    res.json({
        message: 'WELCOME',
    
        body:{
            user: {name,email}
        }
    });
};
 
const getUsers= async (req,res)=>{
 
    const response = await pool.query('SELECT * FROM public.user');
 
    res.status(200).json(response.rows);
};
 
const getTutor= async (req,res)=>{
    const type = "1";
    const response = await pool.query('SELECT * FROM public.user WHERE user_type=$1',[type]);
 
    res.status(200).json(response.rows);
};
 


// HASTA ACA ESTA BIEN EL JWT 
const login = async (req,res)=> {
    
    const {email,password}= req.body;
    const pass= await bcrypt.hash(password,10);
    await pool.query('SELECT email,password FROM public.user WHERE email=$1 AND password=$2',[email,password])
    .then(response=>{
            const token = jwt.sign({email,password},'my_secret_key');
            res.json({
                email:{email,pass},token});})
    .catch(err=>{
            pool.end();
                })
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
}
 
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
}
 
 
module.exports = {
        getUsers,
        getTutor,
        createUsers,
        login,
        protec,
        ensureToken
}
