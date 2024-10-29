const homeRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require('../../services/authguard');


const prisma = new PrismaClient();

homeRouter.get('/home', authguard, async (req, res) => {
    try {
        // Vérifie si l'utilisateur est connecté
        if (req.session.utilisateur) {
            // Récupère les informations de l'utilisateur
            let utilisateur = await prisma.utilisateur.findUnique({
                where: {
                    email: req.session.utilisateur.email
                }
            });
            
            if (utilisateur) {
                const { nom, prenom, points, role } = utilisateur;

                // Récupère les matchs à venir
                const matchsAvenir = await prisma.match.findMany({
                    where: {
                        date: {
                            gte: new Date(), // Matchs à venir (date >= maintenant)
                        },
                    
                    },
                    orderBy: {
                        date: 'asc', // Trier par date croissante
                    },
                    include: {
                        equipe1: { select: { nom: true } }, // Inclure le nom de l'équipe 1
                        equipe2: { select: { nom: true } }, // Inclure le nom de l'équipe 2
                    },
                });

                // Rendu de la vue avec les données utilisateur et les matchs à venir
                return res.render("pages/home.twig", {
                    utilisateur: { nom, prenom, points, role },
                    matchsAvenir
                });
            }
        }
        // Redirige vers la page de connexion si l'utilisateur n'est pas trouvé
        res.redirect("/login");
    } catch (error) {
        console.error("Erreur lors de la récupération des données de l'utilisateur:", error);
        res.redirect("/login");
    }
});
module.exports = homeRouter;
