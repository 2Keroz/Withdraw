const adminRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require('../../services/authguard');

const prisma = new PrismaClient();

adminRouter.get('/admin', authguard, async (req, res) => {
    try {
        if (req.session.utilisateur && req.session.utilisateur.role === 'ADMIN') {
            let utilisateurs = await prisma.utilisateur.findMany();
            return res.render("pages/admin.twig", { utilisateurs });
        }
        res.redirect("/home");
    } catch (error) {
        console.error("Error fetching users:", error);
        res.redirect("/home");
    }
});

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



module.exports = adminRouter;