const adminRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require('../../services/authguard');

const prisma = new PrismaClient();

// Regex pattern pour les noms (lettres et chiffres uniquement)
const namePattern = /^[a-zA-Z0-9\s]+$/;

adminRouter.get('/admin', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            let utilisateurs = await prisma.utilisateur.findMany();
            const matchs = await prisma.match.findMany({
                include: {
                    equipe1: {
                        select: {
                            nom: true
                        }
                    },
                    equipe2: {
                        select: {
                            nom: true
                        }
                    },
                    jeu: {
                        select: {
                            nom: true
                        }
                    },
                    competition: {
                        select: {
                            nom: true
                        }
                    },
                    equipeGagnante: {
                        select: {
                            nom: true
                        }
                    }
                },
                orderBy: {
                    date: 'asc'
                }
            });

            const matchsClotures = matchs.filter(match => match.cloture);
            const matchsNonClotures = matchs.filter(match => !match.cloture);

            matchsClotures.forEach(match => {
                if (!match.equipeGagnante) {
                    match.equipeGagnante = { nom: "Aucune équipe gagnante" };
                }
            });

            return res.render("pages/admin.twig", { utilisateurs, matchsNonClotures, matchsClotures });
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error fetching users and matchs:", error);
        res.redirect("/home");
    }
});

adminRouter.post('/admin/deconnexion', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.redirect('/home');
        }
        res.redirect('/home');
    });
});

adminRouter.post('/admin/home', (req, res) => {
    res.redirect('/home');
});

// // ///////////////////////////////////////////////////////////////////////////////////////// POUR LES UTILISATEURS /////////////////////////////////////////////////////////////////////////////////// // //

////////////////////////////////////////////////////////////////////////////////////////////// Router modif user /////////////////////////////////////////////////////////////////////////////////////////////
adminRouter.get('/admin/utilisateur/:id/modifier', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            let utilisateur = await prisma.utilisateur.findUnique({
                where: { id: parseInt(id) }
            });
            if (utilisateur) {
                return res.render("pages/modifierUtilisateur.twig", { utilisateur });
            } else {
                return res.status(404).send("Utilisateur non trouvé");
            }
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error fetching user for modification:", error);
        res.redirect("/admin");
    }
});

adminRouter.post('/admin/utilisateur/:id/modifier', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, email, points, role } = req.body;

        const pointsInt = parseInt(points, 10);

        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            const currentUserId = req.session.utilisateur.id;

            await prisma.utilisateur.update({
                where: { id: parseInt(id) },
                data: {
                    nom,
                    prenom,
                    email,
                    points: pointsInt,
                    role
                }
            });


            if (id === currentUserId.toString() && role === 'USER') {
                req.session.utilisateur.role = 'USER';
            }

            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Error updating user:", error);
        res.redirect("/admin");
    }
});

////////////////////////////////////////////////////////////////////////////////////////////// Router supp user /////////////////////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/utilisateur/:id/supprimer', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.utilisateur.delete({
                where: { id: parseInt(id) }
            });
            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        res.redirect("/admin");
    }
});


// // ///////////////////////////////////////////////////////////////////////////////////////// POUR LES MATCHS /////////////////////////////////////////////////////////////////////////////////// // //

/////////////////////////////////////////////////////////////////////////// Route pour afficher le formulaire de création de compétition /////////////////////////////////////////////////////////////////////////////////////////////
adminRouter.get('/admin/competition/creer', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            const jeux = await prisma.jeu.findMany();
            return res.render("pages/creerCompetition.twig", { jeux });
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error rendering competition creation form:", error);
        res.redirect("/admin");
    }
});
/////////////////////////////////////////////////////////////////////////// // Route pour afficher le formulaire de création de jeu /////////////////////////////////////////////////////////////////////////////////////////////
adminRouter.get('/admin/jeu/creer', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            return res.render("pages/creerJeu.twig");
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error rendering game creation form:", error);
        res.redirect("/admin");
    }
});

//////////////////////////////////////////////////////////////////////////// Route création de jeu ////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/jeu/creer', authguard, async (req, res) => {
    try {
        const { nom, description } = req.body;

        // Validation du nom
        if (!namePattern.test(nom)) {
            return res.render("pages/creerJeu.twig", {
                error: "Le nom ne doit contenir que des lettres et des chiffres"
            });
        }

        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.jeu.create({
                data: {
                    nom,
                    description,
                },
            });
            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Error creating game:", error);
        res.redirect("/admin");
    }
});

//////////////////////////////////////////////////////////////////////////// Route pour afficher le formulaire de modification de jeu ////////////////////////////////////////////////////////////////////////////
adminRouter.get('/admin/jeu/:id/modifier', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            const jeu = await prisma.jeu.findUnique({
                where: { id: parseInt(id) }
            });

            if (!jeu) {
                return res.status(404).send("Jeu non trouvé");
            }

            return res.render("pages/modifierJeu.twig", { jeu });
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error fetching game for modification:", error);
        res.redirect("/admin");
    }
});

//////////////////////////////////////////////////////////////////////////// Route pour traiter la modification d'un jeu ////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/jeu/:id/modifier', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description } = req.body;

        // Validation du nom
        if (!namePattern.test(nom)) {
            const jeu = await prisma.jeu.findUnique({
                where: { id: parseInt(id) }
            });
            return res.render("pages/modifierJeu.twig", {
                error: "Le nom ne doit contenir que des lettres et des chiffres",
                jeu
            });
        }

        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.jeu.update({
                where: { id: parseInt(id) },
                data: {
                    nom,
                    description
                }
            });

            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Error updating game:", error);
        res.redirect("/admin");
    }
});

//////////////////////////////////////////////////////////////////////////// Route suppression de jeu ////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/jeu/:id/supprimer', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.jeu.delete({
                where: { id: parseInt(id) }
            });
            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression du jeu:", error);
        res.redirect("/admin");
    }
});


//////////////////////////////////////////////////////////////////////////// Route création de compet ////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/competition/creer', authguard, async (req, res) => {
    try {
        const { nom, description, jeuId } = req.body;

        // Validation du nom
        if (!namePattern.test(nom)) {
            const jeux = await prisma.jeu.findMany();
            return res.render("pages/creerCompetition.twig", {
                error: "Le nom ne doit contenir que des lettres et des chiffres",
                jeux
            });
        }

        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.competition.create({
                data: {
                    nom,
                    description,
                    jeuId: parseInt(jeuId),
                },
            });
            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Error creating competition:", error);
        res.redirect("/admin");
    }
});

////////////////////////////////////////////////////////////////////////////  Affiche le formulaire de création d'équipe  ////////////////////////////////////////////////////////////////////////////

adminRouter.get('/admin/equipe/creer', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur?.role !== 'ADMIN') {
            return res.redirect("/home");
        }

        const jeux = await prisma.jeu.findMany();
        const competitions = await prisma.competition.findMany({
            include: { jeu: true },
        });
        console.log("Compétitions récupérées:", competitions);

        const competitionsByJeu = competitions.reduce((acc, competition) => {
            if (!acc[competition.jeuId]) {
                acc[competition.jeuId] = [];
            }
            acc[competition.jeuId].push(competition);
            return acc;
        }, {});

        console.log("Compétitions organisées par jeu:", competitionsByJeu);

        return res.render("pages/creerEquipe.twig", {
            jeux,
            competitionsByJeu,
            utilisateur: req.session.utilisateur
        });

    } catch (error) {
        console.error("Erreur lors du rendu du formulaire de création d'équipe:", error);
        return res.status(500).render("pages/error.twig", {
            message: "Une erreur est survenue lors du chargement du formulaire de création d'équipe."
        });
    }
});


//////////////////////////////////////////////////////////////////////////// Traite la soumission du formulaire de création d'équipe ////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/equipe/creer', authguard, async (req, res) => {
    try {
        const { nom, acronyme, jeuId, competitionId } = req.body;

        // Validation du nom
        if (!namePattern.test(nom)) {
            const jeux = await prisma.jeu.findMany();
            const competitions = await prisma.competition.findMany({
                include: { jeu: true },
            });
            const competitionsByJeu = competitions.reduce((acc, competition) => {
                if (!acc[competition.jeuId]) {
                    acc[competition.jeuId] = [];
                }
                acc[competition.jeuId].push(competition);
                return acc;
            }, {});

            return res.render("pages/creerEquipe.twig", {
                error: { nom: "Le nom ne doit contenir que des lettres et des chiffres" },
                jeux,
                competitionsByJeu,
                utilisateur: req.session.utilisateur
            });
        }

        // Validation de l'acronyme
        if (!namePattern.test(acronyme)) {
            const jeux = await prisma.jeu.findMany();
            const competitions = await prisma.competition.findMany({
                include: { jeu: true },
            });
            const competitionsByJeu = competitions.reduce((acc, competition) => {
                if (!acc[competition.jeuId]) {
                    acc[competition.jeuId] = [];
                }
                acc[competition.jeuId].push(competition);
                return acc;
            }, {});

            return res.render("pages/creerEquipe.twig", {
                error: { acronyme: "L'acronyme ne doit contenir que des lettres et des chiffres" },
                jeux,
                competitionsByJeu,
                utilisateur: req.session.utilisateur
            });
        }

        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.equipe.create({
                data: {
                    nom,
                    acronyme,
                    jeu: { connect: { id: parseInt(jeuId) } },
                    competition: { connect: { id: parseInt(competitionId) } },
                },
            });

            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Error creating team:", error);
        res.redirect("/admin");
    }
});
////////////////////////////////////////////////////////////////////////////// Affiche le formulaire de création d'équipe ////////////////////////////////////////////////////////////////////////////
adminRouter.get('/admin/equipe/creer', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur?.role !== 'ADMIN') {
            return res.redirect("/home");
        }

        const jeux = await prisma.jeu.findMany();
        const competitions = await prisma.competition.findMany({
            include: { jeu: true },
        });

        const competitionsByJeu = competitions.reduce((acc, competition) => {
            if (!acc[competition.jeuId]) {
                acc[competition.jeuId] = [];
            }
            acc[competition.jeuId].push(competition);
            return acc;
        }, {});

        return res.render("pages/creerEquipe.twig", {
            jeux,
            competitionsByJeu,
            utilisateur: req.session.utilisateur
        });

    } catch (error) {
        console.error("Erreur lors du rendu du formulaire de création d'équipe:", error);
        return res.status(500).render("pages/error.twig", {
            message: "Une erreur est survenue lors du chargement du formulaire de création d'équipe."
        });
    }
});

//////////////////////////////////////////////////////////////////////////// Affiche les équipes d'une compétition ////////////////////////////////////////////////////////////////////////////
adminRouter.get('/admin/equipes/:competitionId', authguard, async (req, res) => {
    const { competitionId } = req.params;
    try {
        const equipes = await prisma.equipe.findMany({
            where: { competitionId: parseInt(competitionId) }
        });
        res.json(equipes);
    } catch (error) {
        console.error("Erreur lors de la récupération des équipes :", error);
        res.status(500).json({ error: "Erreur lors de la récupération des équipes." });
    }
});

//////////////////////////////////////////////////////////////////////////// Route supp compet ////////////////////////////////////////////////////////////////////////////

// adminRouter.post('/admin/competition/:id/supprimer', authguard, async (req, res) => {
//     try {
//         const { id } = req.params;
//         if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
//             await prisma.competition.delete({
//                 where: { id: parseInt(id) }
//             });
//             res.redirect('/admin');
//         } else {
//             res.redirect("/home");
//         }
//     } catch (error) {
//         console.error("Erreur lors de la suppression de la compétition:", error);
//         res.redirect("/admin");
//     }
// });


//////////////////////////////////////////////////////////////////////////// Traite la soumission du formulaire de création d'équipe ////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/equipe/creer', authguard, async (req, res) => {
    try {
        const { nom, acronyme, jeuId, competitionId } = req.body;

        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.equipe.create({
                data: {
                    nom,
                    acronyme,
                    jeu: { connect: { id: parseInt(jeuId) } },
                    competition: { connect: { id: parseInt(competitionId) } },
                },
            });
            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Error creating team:", error);
        res.redirect("/admin");
    }
});
//////////////////////////////////////////////////////////////////////////// Route suppression d'équipe ////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/equipe/:id/supprimer', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.equipe.delete({
                where: { id: parseInt(id) }
            });
            res.redirect('/admin'); // Rediriger vers la page d'administration après la suppression
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de l'équipe:", error);
        res.redirect("/admin");
    }
});

//////////////////////////////////////////////////////////////////////////// Route form création de match ////////////////////////////////////////////////////////////////////////////
adminRouter.get('/admin/match/creer', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur?.role !== 'ADMIN') {
            return res.redirect("/home");
        }

        const jeux = await prisma.jeu.findMany();
        const competitions = await prisma.competition.findMany({
            include: { jeu: true },
        });

        const equipes = await prisma.equipe.findMany();

        const competitionsByJeu = competitions.reduce((acc, competition) => {
            if (!acc[competition.jeuId]) {
                acc[competition.jeuId] = [];
            }
            acc[competition.jeuId].push(competition);
            return acc;
        }, {});

        return res.render("pages/creerMatch.twig", {
            jeux,
            competitionsByJeu,
            equipes
        });

    } catch (error) {
        console.error("Erreur lors du rendu du formulaire de création de match:", error);
        return res.status(500).render("pages/error.twig", {
            message: "Une erreur est survenue lors du chargement du formulaire de création de match."
        });
    }
});
//////////////////////////////////////////////////////////////////////////// Traite le form création de match ////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/match/creer', authguard, async (req, res) => {
    try {
        const { equipe1Id, equipe2Id, competitionId, jeuId, date, nom } = req.body;

        // Validation du nom
        if (!namePattern.test(nom)) {
            const jeux = await prisma.jeu.findMany();
            const competitions = await prisma.competition.findMany({
                include: { jeu: true }
            });
            const equipes = await prisma.equipe.findMany({
                include: { jeu: true, competition: true }
            });

            return res.render("pages/creerMatch.twig", {
                error: "Le nom ne doit contenir que des lettres et des chiffres",
                jeux,
                competitions,
                equipes
            });
        }

        if (!equipe1Id || !equipe2Id || !competitionId || !jeuId || !date) {
            return res.status(400).send("Tous les champs sont requis.");
        }

        const equipe1 = await prisma.equipe.findUnique({
            where: { id: parseInt(equipe1Id) },
        });

        const equipe2 = await prisma.equipe.findUnique({
            where: { id: parseInt(equipe2Id) },
        });

        const competition = await prisma.competition.findUnique({
            where: { id: parseInt(competitionId) },
        });

        const jeu = await prisma.jeu.findUnique({
            where: { id: parseInt(jeuId) },
        });

        if (!equipe1 || !equipe2 || !competition || !jeu) {
            return res.status(404).send("Une ou plusieurs entités (équipes, compétition, jeu) ne peuvent pas être trouvées.");
        }

        // Créer le match
        await prisma.match.create({
            data: {
                equipe1Id: parseInt(equipe1Id),
                equipe2Id: parseInt(equipe2Id),
                date: new Date(date),
                competitionId: parseInt(competitionId),
                jeuId: parseInt(jeuId),
                nom
            },
        });

        res.redirect('/admin');
    } catch (error) {
        console.error("Erreur lors de la création du match:", error);
        res.redirect("/admin");
    }
});
//////////////////////////////////////////////////////////////////////////// Route supp match ////////////////////////////////////////////////////////////////////////////
adminRouter.get('/admin/match/:id/supprimer', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            const paris = await prisma.paris.findMany({
                where: { matchId: parseInt(id) }
            });

            for (const pari of paris) {
                await prisma.utilisateur.update({
                    where: { id: pari.utilisateur_id },
                    data: { points: { increment: pari.points_mises } }
                });
            }

            await prisma.paris.deleteMany({
                where: { matchId: parseInt(id) }
            });

            await prisma.match.delete({
                where: { id: parseInt(id) }
            });

            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression du match:", error);
        res.redirect("/admin");
    }
});


//////////////////////////////////////////////////////////////////////////// Route form modif match ////////////////////////////////////////////////////////////////////////////
adminRouter.get('/admin/match/:id/modifier', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            const match = await prisma.match.findUnique({
                where: { id: parseInt(id) },
                include: {
                    jeu: true,
                    competition: true
                }
            });
            const jeux = await prisma.jeu.findMany();
            const competitionsByJeu = {};

            const competitions = await prisma.competition.findMany();
            competitions.forEach(comp => {
                if (!competitionsByJeu[comp.jeuId]) {
                    competitionsByJeu[comp.jeuId] = [];
                }
                competitionsByJeu[comp.jeuId].push(comp);
            });

            if (match) {
                return res.render("pages/modifierMatch.twig", { match, jeux, competitionsByJeu });
            } else {
                return res.status(404).send("Match non trouvé");
            }
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Erreur lors de la récupération du match :", error);
        res.redirect("/admin");
    }
});

//////////////////////////////////////////////////////////////////////////// Route modif match ////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/match/:id/modifier', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        const { jeuId, competitionId, equipe1Id, equipe2Id, date, nom } = req.body;

        // Validation du nom
        if (!namePattern.test(nom)) {
            const match = await prisma.match.findUnique({
                where: { id: parseInt(id) },
                include: {
                    jeu: true,
                    competition: true
                }
            });
            const jeux = await prisma.jeu.findMany();
            const competitionsByJeu = {};

            const competitions = await prisma.competition.findMany();
            competitions.forEach(comp => {
                if (!competitionsByJeu[comp.jeuId]) {
                    competitionsByJeu[comp.jeuId] = [];
                }
                competitionsByJeu[comp.jeuId].push(comp);
            });

            return res.render("pages/modifierMatch.twig", {
                error: "Le nom ne doit contenir que des lettres et des chiffres",
                match,
                jeux,
                competitionsByJeu
            });
        }

        await prisma.match.update({
            where: { id: parseInt(id) },
            data: {
                jeuId: parseInt(jeuId),
                competitionId: parseInt(competitionId),
                equipe1Id: parseInt(equipe1Id),
                equipe2Id: parseInt(equipe2Id),
                date: new Date(date),
                nom
            },
        });

        res.redirect('/admin');
    } catch (error) {
        console.error("Erreur lors de la mise à jour du match :", error);
        res.redirect("/admin");
    }
});


// Route pour afficher la page de clôture du match
adminRouter.get('/admin/match/:matchId/cloturer', authguard, async (req, res) => {
    const { matchId } = req.params;

    try {
        const match = await prisma.match.findUnique({
            where: { id: parseInt(matchId) },
            include: {
                equipe1: true,
                equipe2: true
            }
        });

        if (!match) {
            return res.status(404).json({ error: "Match non trouvé" });
        }

        if (match.cloture) {
            return res.status(400).json({ error: "Le match est déjà clôturé" });
        }

        res.render("pages/cloturerMatch.twig", { match });
    } catch (error) {
        console.error("Erreur lors de la récupération du match:", error);
        res.redirect("/admin");
    }
});

// Route pour clôturer un match et sélectionner l'équipe gagnante
adminRouter.post('/admin/match/:matchId/cloturer', authguard, async (req, res) => {
    const { matchId } = req.params;
    const { equipeGagnanteId } = req.body;

    try {
        const match = await prisma.match.findUnique({
            where: { id: parseInt(matchId) }
        });

        if (!match) {
            return res.status(404).json({ error: "Match non trouvé" });
        }

        if (match.cloture) {
            return res.status(400).json({ error: "Le match est déjà clôturé" });
        }

        const equipeGagnante = await prisma.equipe.findUnique({
            where: { id: parseInt(equipeGagnanteId) }
        });

        if (!equipeGagnante) {
            return res.status(404).json({ error: "Équipe gagnante non trouvée" });
        }

        const paris = await prisma.paris.findMany({
            where: { matchId: parseInt(matchId) }
        });

        for (const pari of paris) {
            if (pari.equipe_choisie === equipeGagnante.nom) {
                await prisma.utilisateur.update({
                    where: { id: pari.utilisateur_id },
                    data: { points: { increment: pari.points_mises * 2 } }
                });
                await prisma.paris.update({
                    where: { id: pari.id },
                    data: { status: 'GAGNE' }
                });
            } else {
                await prisma.paris.update({
                    where: { id: pari.id },
                    data: { status: 'PERDU' }
                });
            }
        }

        await prisma.match.update({
            where: { id: parseInt(matchId) },
            data: { equipeGagnanteId: parseInt(equipeGagnanteId), cloture: true }
        });

        res.redirect('/admin');
    } catch (error) {
        console.error("Erreur lors de la clôture du match:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/////////////////////////////////////////////////////////////// ROUTE POUR SUPP UN MATCH /////////////////////////////////////////////////
adminRouter.post('/admin/match/:id/supprimer', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.paris.deleteMany({
                where: { matchId: parseInt(id) }
            });

            await prisma.match.delete({
                where: { id: parseInt(id) }
            });

            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression du match:", error);
        res.redirect("/admin");
    }
});

//////////////////////////////////////////////////////////////////////////// Route pour afficher le formulaire de modification d'équipe ////////////////////////////////////////////////////////////////////////////
adminRouter.get('/admin/equipe/:id/modifier', authguard, async (req, res) => {
    try {
        if (!req.session.utilisateur || req.session.utilisateur.role !== 'ADMIN') {
            return res.redirect("/home");
        }

        const equipe = await prisma.equipe.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!equipe) {
            return res.redirect('/admin/equipes');
        }

        return res.render("pages/modifierEquipe.twig", { equipe });
    } catch (error) {
        console.error("Error fetching team:", error);
        res.redirect("/admin");
    }
});

//////////////////////////////////////////////////////////////////////////// Route pour traiter la modification d'une équipe ////////////////////////////////////////////////////////////////////////////
adminRouter.post('/admin/equipe/:id/modifier', authguard, async (req, res) => {
    try {
        const { nom, acronyme } = req.body;

        // Validation du nom et de l'acronyme
        if (!namePattern.test(nom)) {
            const equipe = await prisma.equipe.findUnique({
                where: { id: parseInt(req.params.id) }
            });
            return res.render("pages/modifierEquipe.twig", {
                error: "Le nom ne doit contenir que des lettres et des chiffres",
                equipe: { ...equipe, nom, acronyme }
            });
        }

        if (!namePattern.test(acronyme)) {
            const equipe = await prisma.equipe.findUnique({
                where: { id: parseInt(req.params.id) }
            });
            return res.render("pages/modifierEquipe.twig", {
                error: "L'acronyme ne doit contenir que des lettres et des chiffres",
                equipe: { ...equipe, nom, acronyme }
            });
        }

        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.equipe.update({
                where: { id: parseInt(req.params.id) },
                data: {
                    nom,
                    acronyme
                }
            });

            res.redirect('/admin/equipes');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Error updating team:", error);
        res.redirect("/admin");
    }
});

///////////////////////////////////////////////////////////////////////// BARRE DE RECHERCHE /////////////////////////////////////////////////////////////////////////

// Barre de recherche utilisateur
adminRouter.get('/admin/utilisateurs/recherche', authguard, async (req, res) => {
    try {
        const query = req.query.query;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            let utilisateurs = await prisma.utilisateur.findMany({
                where: {
                    OR: [
                        { nom: { contains: query } },
                        { prenom: { contains: query } },
                        { email: { contains: query } }
                    ]
                }
            });
            const matchs = await prisma.match.findMany({
                include: {
                    equipe1: { select: { nom: true } },
                    equipe2: { select: { nom: true } },
                    jeu: { select: { nom: true } },
                    competition: { select: { nom: true } },
                    equipeGagnante: { select: { nom: true } }
                },
                orderBy: { date: 'asc' }
            });

            const matchsClotures = matchs.filter(match => match.cloture);
            const matchsNonClotures = matchs.filter(match => !match.cloture);

            matchsClotures.forEach(match => {
                if (!match.equipeGagnante) {
                    match.equipeGagnante = { nom: "Aucune équipe gagnante" };
                }
            });

            return res.render("pages/admin.twig", { utilisateurs, matchsNonClotures, matchsClotures });
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error fetching users:", error);
        res.redirect("/home");
    }
});

// Barre de recherhe match non cloturé
adminRouter.get('/admin/matchs/non-clotures/recherche', authguard, async (req, res) => {
    try {
        const query = req.query.query;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            const utilisateurs = await prisma.utilisateur.findMany();
            const matchs = await prisma.match.findMany({
                include: {
                    equipe1: { select: { nom: true } },
                    equipe2: { select: { nom: true } },
                    jeu: { select: { nom: true } },
                    competition: { select: { nom: true } },
                    equipeGagnante: { select: { nom: true } }
                },
                orderBy: { date: 'asc' }
            });

            const matchsNonClotures = matchs.filter(match =>
                !match.cloture && (
                    match.equipe1.nom.includes(query) ||
                    match.equipe2.nom.includes(query)
                )
            );

            const matchsClotures = matchs.filter(match => match.cloture);

            matchsClotures.forEach(match => {
                if (!match.equipeGagnante) {
                    match.equipeGagnante = { nom: "Aucune équipe gagnante" };
                }
            });

            return res.render("pages/admin.twig", { utilisateurs, matchsNonClotures, matchsClotures });
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error fetching non-clotures matches:", error);
        res.redirect("/home");
    }
});

// Barre de recherhe match cloturé
adminRouter.get('/admin/matchs/clotures/recherche', authguard, async (req, res) => {
    try {
        const query = req.query.query;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            const utilisateurs = await prisma.utilisateur.findMany();
            const matchs = await prisma.match.findMany({
                include: {
                    equipe1: { select: { nom: true } },
                    equipe2: { select: { nom: true } },
                    jeu: { select: { nom: true } },
                    competition: { select: { nom: true } },
                    equipeGagnante: { select: { nom: true } }
                },
                orderBy: { date: 'asc' }
            });

            const matchsClotures = matchs.filter(match =>
                match.cloture && (
                    match.equipe1.nom.includes(query) ||
                    match.equipe2.nom.includes(query)
                )
            );

            const matchsNonClotures = matchs.filter(match => !match.cloture);

            matchsClotures.forEach(match => {
                if (!match.equipeGagnante) {
                    match.equipeGagnante = { nom: "Aucune équipe gagnante" };
                }
            });

            return res.render("pages/admin.twig", { utilisateurs, matchsNonClotures, matchsClotures });
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error fetching clotures matches:", error);
        res.redirect("/home");
    }
});


/////////////////////////////////////////////////////// ROUTE POUR JEUX / COMPETITIONS / EQUIPES ///////////////////////////////////////////////////////


///////////////////// JEUX /////////////////////
// Route pour afficher tous les jeux
adminRouter.get('/admin/jeux', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            const jeux = await prisma.jeu.findMany();
            return res.render("pages/jeux.twig", { jeux });
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error fetching games:", error);
        res.redirect("/admin");
    }
});

// Route suppression jeu
adminRouter.post('/admin/jeu/:id/supprimer', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.jeu.delete({
                where: { id: parseInt(id) }
            });
            res.redirect('/admin/jeux');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression du jeu:", error);
        res.redirect("/admin");
    }
});

//////////// COMPETITIONS ////////

// Route pour afficher toutes les compétitions
adminRouter.get('/admin/competitions', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            const competitions = await prisma.competition.findMany({
                include: { jeu: true }
            });
            return res.render("pages/competitions.twig", { competitions });
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error fetching competitions:", error);
        res.redirect("/admin");
    }
});

// Route suppression compétitions 
adminRouter.post('/admin/competition/:id/supprimer', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            // D'abord supprimer les paris associés aux matchs de cette compétition
            const matchs = await prisma.match.findMany({
                where: { competitionId: parseInt(id) }
            });
            
            for (const match of matchs) {
                await prisma.paris.deleteMany({
                    where: { matchId: match.id }
                });
            }

            // Ensuite supprimer les matchs
            await prisma.match.deleteMany({
                where: { competitionId: parseInt(id) }
            });

            // Supprimer les équipes
            await prisma.equipe.deleteMany({
                where: { competitionId: parseInt(id) }
            });

            // Enfin, supprimer la compétition
            await prisma.competition.delete({
                where: { id: parseInt(id) }
            });
            
            res.redirect('/admin/competitions');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de la compétition:", error);
        res.redirect("/admin");
    }
});

/////////////// EQUIPES //////////////////

// Route pour afficher toutes les équipes
adminRouter.get('/admin/equipes', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            const equipes = await prisma.equipe.findMany({
                include: {
                    jeu: true,
                    competition: true
                }
            });
            return res.render("pages/equipes.twig", { equipes });
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.redirect("/admin");
    }
});

// Route suppression équipe
adminRouter.post('/admin/equipe/:id/supprimer', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.equipe.delete({
                where: { id: parseInt(id) }
            });
            res.redirect('/admin/equipes');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de l'équipe:", error);
        res.redirect("/admin");
    }
});

// Routes pour la modification des jeux
adminRouter.get('/admin/jeu/:id/modifier', authguard, async (req, res) => {
    try {
        const jeu = await prisma.jeu.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!jeu) {
            return res.redirect('/admin/jeux');
        }
        res.render('pages/modifierJeu.twig', { jeu });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/jeux');
    }
});

adminRouter.post('/admin/jeu/:id/modifier', authguard, async (req, res) => {
    try {
        await prisma.jeu.update({
            where: { id: parseInt(req.params.id) },
            data: {
                nom: req.body.nom
            }
        });
        res.redirect('/admin/jeux');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/jeux');
    }
});

// Routes pour la modification des compétitions
adminRouter.get('/admin/competition/:id/modifier', authguard, async (req, res) => {
    try {
        if (!req.session.utilisateur || req.session.utilisateur.role !== 'ADMIN') {
            return res.redirect("/home");
        }

        const competition = await prisma.competition.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!competition) {
            return res.redirect('/admin/competitions');
        }

        return res.render("pages/modifierCompetition.twig", { competition });
    } catch (error) {
        console.error("Error fetching competition:", error);
        res.redirect("/admin");
    }
});

adminRouter.post('/admin/competition/:id/modifier', authguard, async (req, res) => {
    try {
        const { nom, description } = req.body;
        
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.competition.update({
                where: { id: parseInt(req.params.id) },
                data: {
                    nom,
                    description
                }
            });

            res.redirect('/admin/competitions');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Error updating competition:", error);
        res.redirect("/admin");
    }
});

// Routes pour la modification des équipes
adminRouter.get('/admin/equipe/:id/modifier', authguard, async (req, res) => {
    try {
        const equipe = await prisma.equipe.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        const jeux = await prisma.jeu.findMany();

        if (!equipe) {
            return res.redirect('/admin/equipes');
        }
        res.render('pages/modifierEquipe.twig', { equipe, jeux });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/equipes');
    }
});

adminRouter.post('/admin/equipe/:id/modifier', authguard, async (req, res) => {
    try {
        await prisma.equipe.update({
            where: { id: parseInt(req.params.id) },
            data: {
                nom: req.body.nom,
                jeuId: parseInt(req.body.jeuId)
            }
        });
        res.redirect('/admin/equipes');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/equipes');
    }
});

module.exports = adminRouter;