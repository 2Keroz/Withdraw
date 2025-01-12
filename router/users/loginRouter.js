const loginRouter = require("express").Router()
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt");

const prisma = new PrismaClient()

loginRouter.get('/', (req,res) =>{
    res.redirect('/login')
})

loginRouter.get('/login', (req,res) =>{
    res.render('pages/login.twig')
})
////////////////////// ROUTE DE CONNEXION /////////////////////////
loginRouter.post("/login", async (req, res) => {
    try {
        const mail = req.body.mail;
        const password = req.body.password; 

        const utilisateur = await prisma.utilisateur.findUnique({
            where: { email: mail }
        });

        if (utilisateur) {
            const passwordMatch = await bcrypt.compare(password, utilisateur.password);
            if (passwordMatch) {
                req.session.utilisateur = utilisateur; 
                console.log("Connexion réussie pour :", utilisateur.prenom , utilisateur.nom );
                res.redirect('/home');
            } else {
                throw { password: "Mot de passe incorrect" };
            }
        } else {
            throw { email: "Email incorrect" };
        }
    } catch (error) {
        console.error(error);
        res.render("pages/login.twig", {
            error: error.password || error.email || "Erreur de connexion"
        });
    }
});

module.exports = loginRouter;