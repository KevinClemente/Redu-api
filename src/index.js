const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { json } = require("express");

//middlewares.............funciones que se ejecuten antes que se lleguen a las rutas y sirven para interpretar esas rutas ya que son Json o html
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: false })); //urlencode se utiliza para  interpretar formularios y el extended false para que no reciba como parametros imagenes sino datos simples

//Routes
app.use(require("./routes/index"));

app.listen(process.env.PORT || 3000);
console.log("server on port 3000");
