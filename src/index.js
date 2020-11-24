const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { json } = require("express");
const http = require("http");

//middlewares.............funciones que se ejecuten antes que se lleguen a las rutas y sirven para interpretar esas rutas ya que son Json o html
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: false })); //urlencode se utiliza para  interpretar formularios y el extended false para que no reciba como parametros imagenes sino datos simples

//Routes
app.use(require("./routes/index"));

const server = http.createServer(app);
const socketio = require("socket.io")(server);

app.use(function (req, res, next) {
  req.io = socketio;
  next();
});

socketio.on("connection", (socket) => {
  console.log("entro aqui");

  socket.on("my other event", (data) => {
    console.log(data);
  });
});

server.listen(process.env.PORT || 3000);
console.log("server on port 3000");
