const express = require("express");
const session = require("express-session");


//ROUTER
const registerRouter = require("./router/users/registerRouter");
const loginRouter = require("./router/users/loginRouter");
const homeRouter = require("./router/users/homeRouter");
const adminRouter = require("./router/admin/adminRouter");
const userRouter = require("./router/users/userRouter");
const resetPasswordRouter = require("./router/users/resetPasswordRouter");

require("dotenv").config()

const app = express(); // on lance le server
app.use(express.static("./public"))
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "kmr%2p~V3-s]RM3%#J-q6UM2=rW5yC88",
    resave: true,
    saveUninitialized: true,
}))

app.use(registerRouter)
app.use(loginRouter)
app.use(homeRouter)
app.use(adminRouter)
app.use(userRouter)
app.use(resetPasswordRouter)

app.listen(process.env.PORT, ()=>{
    console.log(`Connecté sur le port ${process.env.PORT}`);
})