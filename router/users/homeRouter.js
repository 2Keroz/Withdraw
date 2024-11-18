const homeRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require('../../services/authguard');


const prisma = new PrismaClient();

homeRouter.get('/home', authguard, async (req, res) => {
    try {
        // Vérifie si l'utilisateur est connecté
        if (req.session.utilisateur) {
            // Récupère les informations de l'utilisateur
            const utilisateur = await prisma.utilisateur.findUnique({
                where: { email: req.session.utilisateur.email }
            });
            
            if (utilisateur) {
                const { nom, prenom, points, role } = utilisateur;

                // Récupère les jeux pour le menu
                const jeux = await prisma.jeu.findMany();

                // Récupère les matchs à venir
                const matchsAvenir = await prisma.match.findMany({
                    where: { date: { gte: new Date() } },
                    orderBy: { date: 'asc' },
                    include: {
                        equipe1: { select: { nom: true } },
                        equipe2: { select: { nom: true } }
                    }
                });

                // Rendu de la vue avec les données utilisateur, les jeux, et les matchs à venir
                return res.render("pages/home.twig", {
                    utilisateur: { nom, prenom, points, role },
                    jeux,
                    matchsAvenir
                });
            }
        }
        res.redirect("/login");
    } catch (error) {
        console.error("Erreur lors de la récupération des données de l'utilisateur:", error);
        res.redirect("/login");
    }
});

// Route pour récupérer les compétitions d'un jeu spécifique
homeRouter.get('/home/jeux/:jeuId/competitions', authguard, async (req, res) => {
    const { jeuId } = req.params;

    try {
        const competitions = await prisma.competition.findMany({
            where: { jeuId: parseInt(jeuId) }
        });
        res.json(competitions); // Retourne les compétitions en JSON
    } catch (error) {
        console.error("Erreur lors de la récupération des compétitions:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route pour récupérer les matchs à venir d'une compétition spécifique
homeRouter.get('/home/competitions/:competitionId/matchs', authguard, async (req, res) => {
    const { competitionId } = req.params;

    try {
        const matchs = await prisma.match.findMany({
            where: {
                competitionId: parseInt(competitionId),
                date: { gte: new Date() } // Matchs à venir
            },
            include: {
                equipe1: { select: { nom: true } },
                equipe2: { select: { nom: true } }
            },
            orderBy: { date: 'asc' }
        });
        res.json(matchs); // Retourne les matchs en JSON
    } catch (error) {
        console.error("Erreur lors de la récupération des matchs:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
// Route pour récupérer les compétitions d'un jeu spécifique
homeRouter.get('/home/jeux/:jeuId/competitions', authguard, async (req, res) => {
    const { jeuId } = req.params;

    try {
        const competitions = await prisma.competition.findMany({
            where: { jeuId: parseInt(jeuId) }
        });
        res.json(competitions); // Retourne les compétitions en JSON
    } catch (error) {
        console.error("Erreur lors de la récupération des compétitions:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route pour récupérer les matchs à venir d'une compétition spécifique
homeRouter.get('/home/competitions/:competitionId/matchs', authguard, async (req, res) => {
    const { competitionId } = req.params;

    try {
        const matchs = await prisma.match.findMany({
            where: {
                competitionId: parseInt(competitionId),
                date: { gte: new Date() } // Matchs à venir
            },
            include: {
                equipe1: { select: { nom: true } },
                equipe2: { select: { nom: true } }
            },
            orderBy: { date: 'asc' }
        });
        res.json(matchs); // Retourne les matchs en JSON
    } catch (error) {
        console.error("Erreur lors de la récupération des matchs:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route pour récupérer les matchs passés
homeRouter.get('/home/matchs-passes', authguard, async (req, res) => {
    try {
        const matchsPasses = await prisma.match.findMany({
            where: { date: { lt: new Date() } }, // Matchs passés
            orderBy: { date: 'desc' },
            include: {
                equipe1: { select: { nom: true } },
                equipe2: { select: { nom: true } }
            }
        });
        res.json(matchsPasses); // Retourne les matchs passés en JSON
    } catch (error) {
        console.error("Erreur lors de la récupération des matchs passés:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


module.exports = homeRouter;
