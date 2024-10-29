const userRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require('../../services/authguard');
const bcrypt = require('bcrypt')

const prisma = new PrismaClient();

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

        const utilisateur = await prisma.utilisateur.findUnique({
            where: {
                email: req.session.utilisateur.email
            }
        });


        const updateData = {
            nom,
            prenom,
            email,
            date_naissance: dateNaissance,
        };

        if (new_password) {

            const isPasswordCorrect = await bcrypt.compare(current_password, utilisateur.password);
            if (!isPasswordCorrect) {
                return res.render('pages/modifierProfil.twig', { utilisateur, errors: { password: "Le mot de passe actuel est incorrect." } });
            }

            if (new_password !== confirm_password) {
                return res.render('pages/modifierProfil.twig', { utilisateur, errors: { confirm: "Le nouveau mot de passe et la confirmation ne correspondent pas." } });
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


module.exports = userRouter;
