const adminRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require('../../services/authguard');

const prisma = new PrismaClient();

adminRouter.get('/admin', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            let utilisateurs = await prisma.utilisateur.findMany();
            const matchs = await prisma.match.findMany({
                include: {
                    equipe1: { select: { nom: true } },
                    equipe2: { select: { nom: true } },
                }});
            return res.render("pages/admin.twig", { utilisateurs, matchs });
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
            const jeux = await prisma.jeu.findMany(); // Récupère tous les jeux
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

        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.competition.create({
                data: {
                    nom,
                    description,
                    jeuId: parseInt(jeuId), // Associer l'ID du jeu sélectionné
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

        // Afficher les compétitions dans la console pour vérification
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

        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.equipe.create({
                data: {
                    nom,
                    acronyme,
                    jeu: { connect: { id: parseInt(jeuId) } },
                    competition: { connect: { id: parseInt(competitionId) } },
                },
            });

            res.redirect('/admin'); // Rediriger vers la page d'administration après la création
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

        // Regrouper les compétitions par jeu
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

adminRouter.post('/admin/competition/:id/supprimer', authguard, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            await prisma.competition.delete({
                where: { id: parseInt(id) }
            });
            res.redirect('/admin');
        } else {
            res.redirect("/home");
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de la compétition:", error);
        res.redirect("/admin");
    }
});


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
            res.redirect('/admin'); // Rediriger vers la page d'administration après la création
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
        const { equipe1Id, equipe2Id, competitionId, jeuId, date } = req.body;

        // Vérifiez que tous les champs sont fournis
        if (!equipe1Id || !equipe2Id || !competitionId || !jeuId || !date) {
            return res.status(400).send("Tous les champs sont requis.");
        }

        // Vérifier si les équipes existent
        const equipe1 = await prisma.equipe.findUnique({
            where: { id: parseInt(equipe1Id) },
        });

        const equipe2 = await prisma.equipe.findUnique({
            where: { id: parseInt(equipe2Id) },
        });

        // Vérifier si la compétition existe
        const competition = await prisma.competition.findUnique({
            where: { id: parseInt(competitionId) },
        });

        // Vérifier si le jeu existe
        const jeu = await prisma.jeu.findUnique({
            where: { id: parseInt(jeuId) },
        });

        if (!equipe1 || !equipe2 || !competition || !jeu) {
            return res.status(404).send("Une ou plusieurs entités (équipes, compétition, jeu) ne peuvent pas être trouvées.");
        }

        // Créer le match
        await prisma.match.create({
            data: {
                equipe1Id: parseInt(equipe1Id),  // ID de l'équipe 1
                equipe2Id: parseInt(equipe2Id),  // ID de l'équipe 2
                date: new Date(date),
                competitionId: parseInt(competitionId), // ID de la compétition
                jeuId: parseInt(jeuId)  // ID du jeu
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
                    jeu: true, // Incluez le jeu
                    competition: true, // Incluez la compétition
                }
            });
            const jeux = await prisma.jeu.findMany(); // Récupérez tous les jeux
            const competitionsByJeu = {}; // Structure pour les compétitions par jeu

            // Remplir competitionsByJeu
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
        const { equipe1, equipe2, date } = req.body;

        await prisma.match.update({
            where: { id: parseInt(id) },
            data: {
                equipe1,
                equipe2,
                date: new Date(date), // Assurez-vous que la date est au format Date
            },
        });

        res.redirect('/admin');
    } catch (error) {
        console.error("Erreur lors de la mise à jour du match :", error);
        res.redirect("/admin");
    }
});


module.exports = adminRouter;