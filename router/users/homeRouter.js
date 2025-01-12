const homeRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require('../../services/authguard');


const prisma = new PrismaClient();

homeRouter.get('/home', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur) {
            const utilisateur = await prisma.utilisateur.findUnique({
                where: { email: req.session.utilisateur.email }
            });
            
            if (utilisateur) {
                const { nom, prenom, points, role } = utilisateur;

                const jeux = await prisma.jeu.findMany();

                const matchsAvenir = await prisma.match.findMany({
                    where: { date: { gte: new Date() } },
                    orderBy: { date: 'asc' },
                    include: {
                        equipe1: { select: { nom: true } },
                        equipe2: { select: { nom: true } }
                    }
                });

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

///////////////////////////////////////////// ROUTE POUR RECUP LES COMPET D'UN JEU ////////////////////////////////////////////////// 
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

///////////////////////////////////////////// ROUTE POUR RECUP MATCHS A VENIR D'UNE COMPET SPEC //////////////////////////////////////////////////
homeRouter.get('/home/competitions/:competitionId/matchs', authguard, async (req, res) => {
    const { competitionId } = req.params;

    try {
        const matchs = await prisma.match.findMany({
            where: {
                competitionId: parseInt(competitionId),
                date: { gte: new Date() }
            },
            include: {
                equipe1: { select: { nom: true } },
                equipe2: { select: { nom: true } }
            },
            orderBy: { date: 'asc' }
        });
        res.json(matchs);
    } catch (error) {
        console.error("Erreur lors de la récupération des matchs:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
//////////////////////////// ROUTE POUR RECUP LES COMPET D'UN JEU SPEC //////////////////////////////// 
homeRouter.get('/home/jeux/:jeuId/competitions', authguard, async (req, res) => {
    const { jeuId } = req.params;

    try {
        const competitions = await prisma.competition.findMany({
            where: { jeuId: parseInt(jeuId) }
        });
        res.json(competitions);
    } catch (error) {
        console.error("Erreur lors de la récupération des compétitions:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

//////////////////////////////////////////////////////// ROUTE POUR RECUP LES MATCHS A VENIR D'UNE COMPET SPEC ///////////////////////////////
homeRouter.get('/home/competitions/:competitionId/matchs', authguard, async (req, res) => {
    const { competitionId } = req.params;

    try {
        const matchs = await prisma.match.findMany({
            where: {
                competitionId: parseInt(competitionId),
                date: { gte: new Date() }
            },
            include: {
                equipe1: { select: { nom: true } },
                equipe2: { select: { nom: true } }
            },
            orderBy: { date: 'asc' }
        });
        res.json(matchs);
    } catch (error) {
        console.error("Erreur lors de la récupération des matchs:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

//////////////////////////////////// ROUTE DE RECUP DES MATCHS PASSE ////////////////////////////////////////
homeRouter.get('/home/matchs-passes', authguard, async (req, res) => {
    try {
        const matchsPasses = await prisma.match.findMany({
            where: { date: { lt: new Date() } },
            orderBy: { date: 'desc' },
            include: {
                equipe1: { select: { nom: true } },
                equipe2: { select: { nom: true } },
                equipeGagnante: { select: { nom: true } }
            }
        });
        res.json(matchsPasses);
    } catch (error) {
        console.error("Erreur lors de la récupération des matchs passés:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


module.exports = homeRouter;
