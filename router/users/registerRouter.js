
const registerRouter = require("express").Router()
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt");
const hashPasswordExtension = require("../../services/extension/hashPasswordExtension");

const prisma = new PrismaClient().$extends(hashPasswordExtension)

registerRouter.get('/register', (req,res) =>{
    res.render('pages/register.twig')
})

registerRouter.post("/register", async (req, res) => {
    try {
        const formattedDate = new Date(req.body.date).toISOString();

        const utilisateur = await prisma.utilisateur.create({
            data: {
                nom: req.body.nom,
                prenom: req.body.prenom,
                date_naissance: formattedDate,
                email: req.body.mail,
                password: req.body.password,
            }
        });
        console.log("Utilisateur créée avec succès :", utilisateur);
        res.redirect("/login");
    } catch (error) {
        console.log(error);
        res.render("pages/register.twig", { errors: { server: "Une erreur est survenue lors de l'inscription." } });
    }
});

module.exports = registerRouter