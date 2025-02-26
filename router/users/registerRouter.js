const registerRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const hashPasswordExtension = require("../../services/extension/hashPasswordExtension");

const prisma = new PrismaClient().$extends(hashPasswordExtension);


const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
const namePattern = /^[a-zA-Z]+$/;

//////////////////////////// ROUTE D'INSCRIPTION /////////////////////
registerRouter.get("/register", async (req,res) => {
    res.render('pages/register.twig')
})

//////////////////////////// ROUTE D'INSCRIPTION /////////////////////
registerRouter.post("/register", async (req, res) => {
    try {
        const { nom, prenom, date, mail, password, confirm_password } = req.body;
        let errors = {}; 

        if (!namePattern.test(nom)) {
            errors.nom = "Le nom ne doit comporter que des lettres";
        }

        if (!namePattern.test(prenom)) {
            errors.prenom = "Le prénom ne doit comporter que des lettres";
        }

        if (!emailPattern.test(mail)) {
            errors.mail = "L'email n'est pas valide. Il doit contenir uniquement des lettres, chiffres, et les caractères - _ .";
        }

        if (!passwordPattern.test(password)) {
            errors.password = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial";
        }

        if (password !== confirm_password) {
            errors.password = "Les mots de passe ne correspondent pas. Veuillez réessayer.";
        }

        if (Object.keys(errors).length > 0) {
            return res.render("pages/register.twig", { errors });
        }

        // Formatage de la date
        const formattedDate = new Date(date).toISOString();

        // Création de l'utilisateur
        const utilisateur = await prisma.utilisateur.create({
            data: {
                nom,
                prenom,
                date_naissance: formattedDate,
                email: mail,
                password,
            },
        });

        console.log("Utilisateur créé avec succès :", utilisateur);

        // STOCKER LES INFORMATIONS UTILISATEURS DANS LA SESSION
        req.session.utilisateur = {
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            date_naissance: utilisateur.date_naissance,
        };

        res.redirect("/home");

    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        res.render("pages/register.twig", {
            errors: { server: "Une erreur est survenue lors de l'inscription. Veuillez réessayer." }
        });
    }
});

module.exports = registerRouter;
