const homeRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require('../../services/authguard');

const prisma = new PrismaClient();

homeRouter.get('/home', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur) {
            let utilisateur = await prisma.utilisateur.findUnique({
                where: {
                    email: req.session.utilisateur.email
                }
            });
            
            if (utilisateur) {
                const { nom, prenom, points, role} = utilisateur;
                return res.render("pages/home.twig", { utilisateur: { nom, prenom, points, role} });
            }
        }
        res.redirect("/login");
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.redirect("/login");
    }
});



module.exports = homeRouter;
