const userRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require('../../services/authguard');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;


userRouter.get('/profil', authguard, async (req, res) => {
    try {
        const utilisateur = await prisma.utilisateur.findUnique({
            where: {
                email: req.session.utilisateur.email
            }
        });

        if (utilisateur) {
            const formattedDateNaissance = utilisateur.date_naissance
                ? utilisateur.date_naissance.toISOString().split('T')[0]
                : '';

            res.render("pages/profil.twig", { utilisateur: { ...utilisateur, date_naissance: formattedDateNaissance } });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des informations:", error);
        res.redirect('/home');
    }
});

// Route pour modifier le profil
userRouter.get('/modifierProfil', authguard, async (req, res) => {
    try {
        const utilisateur = await prisma.utilisateur.findUnique({
            where: {
                email: req.session.utilisateur.email
            }
        });
        if (utilisateur) {

            const formattedDateNaissance = utilisateur.date_naissance
                ? utilisateur.date_naissance.toISOString().split('T')[0]
                : '';

            res.render("pages/modifierProfil.twig", { utilisateur: { ...utilisateur, date_naissance: formattedDateNaissance } });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des informations:", error);
        res.redirect('/home');
    }
});

// Route modification de profil


userRouter.post('/profil/modifier', authguard, async (req, res) => {
    try {
        const { nom, prenom, email, date_naissance, current_password, new_password, confirm_password } = req.body;
        const dateNaissance = new Date(date_naissance);
        let errors = {}

        const utilisateur = await prisma.utilisateur.findUnique({
            where: {
                email: req.session.utilisateur.email
            }
        });

        // Vérification du format de l'email
        if (!emailPattern.test(email)) {
            return res.render('pages/modifierProfil.twig', {
                utilisateur,
                errors: { email: "L'email n'est pas valide." }
            });
        }

        const updateData = { nom, prenom, email, date_naissance: dateNaissance };

        if (new_password) {
            // Vérification du format du mot de passe
            if (!passwordPattern.test(new_password)) {
                return res.render('pages/modifierProfil.twig', {
                    utilisateur,
                    errors: { password: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial." }
                });
            }

            const isPasswordCorrect = await bcrypt.compare(current_password, utilisateur.password);
            if (!isPasswordCorrect) {
                return res.render('pages/modifierProfil.twig', {
                    utilisateur,
                    errors: { current_password: "Le mot de passe actuel est incorrect." }
                });
            }

            if (new_password !== confirm_password) {
                return res.render('pages/modifierProfil.twig', {
                    utilisateur,
                    errors: { confirm: "Le nouveau mot de passe et la confirmation ne correspondent pas." }
                });
            }

            if (Object.keys(errors).length > 0) {
                return res.render('pages/modifierProfil.twig', {
                    utilisateur,
                    errors
                });
            }

            updateData.password = await bcrypt.hash(new_password, 10);
        }

        const updatedUser = await prisma.utilisateur.update({
            where: { email: req.session.utilisateur.email },
            data: updateData
        });

        req.session.utilisateur = updatedUser;

        res.redirect('/home');
    } catch (error) {
        console.error("Erreur lors de la mise à jour du profil :", error);
        res.redirect('/profil');
    }
});

// Route pour suppression de compte
userRouter.post('/profil/supprimer', authguard, async (req, res) => {
    try {

        await prisma.utilisateur.delete({
            where: {
                email: req.session.utilisateur.email
            }
        });

        req.session.destroy(err => {
            if (err) {
                console.error("Erreur lors de la suppression de la session :", err);
                return res.redirect('/profil');
            }
            res.redirect('/home');
        });
    } catch (error) {
        console.error("Erreur lors de la suppression du compte :", error);
        res.redirect('/profil');
    }
});

// Route pour déconnexion
userRouter.post('/home/deconnexion', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.redirect('/home');
        }
        res.redirect('/home');
    });
});

userRouter.post('/parier', authguard, async (req, res) => {
    try {
        const { match_id, equipe_choisie, points_mises } = req.body;
        const utilisateurId = req.session.utilisateur.id;

        const utilisateur = await prisma.utilisateur.findUnique({
            where: { id: utilisateurId },
        });

        if (!utilisateur || utilisateur.points < points_mises) {
            return res.redirect('/home');
        }

        await prisma.paris.create({
            data: {
                utilisateur: utilisateurId,
                paris_id: parseInt(match_id, 10),
                equipe_choisie,
                points_mises: parseInt(points_mises, 10),
                date_pari: new Date(),
                status: 'EN_COURS',
                utilisateur: {
                    connect: { id: utilisateurId }
                },
                match: {
                    connect: { id: parseInt(match_id, 10) }
                }
            },
        });

        await prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { points: utilisateur.points - points_mises },
        });

        res.redirect('/home');
    } catch (error) {
        console.error("Erreur lors de la création du pari :", error);
        res.redirect('/home');
    }
});

userRouter.get('/mes-paris', authguard, async (req, res) => {
    try {
        const utilisateurId = req.session.utilisateur.id;

        const paris = await prisma.paris.findMany({
            where: { utilisateur_id: utilisateurId },
            include: {
                utilisateur: true,
            },
            orderBy: {
                date_pari: 'desc',
            },
        });

        const parisEnCours = paris.filter(pari => pari.status === 'EN_COURS');
        const parisTermines = paris.filter(pari => pari.status !== 'EN_COURS');

        res.render('pages/mesParis.twig', {
            parisEnCours,
            parisTermines,
            utilisateur: req.session.utilisateur,
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des paris :", error);
        res.redirect('/home');
    }
});

module.exports = userRouter;
