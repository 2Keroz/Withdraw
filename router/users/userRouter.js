const userRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require('../../services/authguard');

const prisma = new PrismaClient();

// Route pour afficher le profil
userRouter.get('/profil', authguard, async (req, res) => {
    try {
        const utilisateur = await prisma.utilisateur.findUnique({
            where: {
                email: req.session.utilisateur.email
            }
        });

        if (utilisateur) {
            // Formatage de la date de naissance pour affichage
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
            // Formatage de la date de naissance pour affichage
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

// Route pour mettre à jour le profil
userRouter.post('/profil/modifier', authguard, async (req, res) => {
    try {
        const { nom, prenom, email, date_naissance } = req.body;
        const dateNaissance = new Date(date_naissance);

        const updatedUser = await prisma.utilisateur.update({
            where: {
                email: req.session.utilisateur.email,
            },
            data: {
                nom,
                prenom,
                email,
                date_naissance: dateNaissance
            }
        });

        // Mettre à jour la session utilisateur
        req.session.utilisateur = updatedUser;

        res.redirect('/home');
    } catch (error) {
        console.error("Erreur lors de la mise à jour du profil:", error);
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

module.exports = userRouter;
