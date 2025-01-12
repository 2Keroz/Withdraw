const registerRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const hashPasswordExtension = require("../../services/extension/hashPasswordExtension");

const prisma = new PrismaClient().$extends(hashPasswordExtension);

registerRouter.get('/register', (req, res) => {
    res.render('pages/register.twig');
});

//////////////////////////// ROUTE D'INSCRIPTION /////////////////////
registerRouter.post("/register", async (req, res) => {
    try {
        const { nom, prenom, date, mail, password, confirm_password } = req.body;

        if (password !== confirm_password) {
            return res.render("pages/register.twig", {
                errors: { password: "Les mots de passe ne correspondent pas. Veuillez réessayer." }
            });
        }
        
        const formattedDate = new Date(date).toISOString();
        const hashedPassword = await bcrypt.hash(password, 10);
        const utilisateur = await prisma.utilisateur.create({
            data: {
                nom,
                prenom,
                date_naissance: formattedDate,
                email: mail,
                password: hashedPassword,
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
