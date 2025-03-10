const express = require('express');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const cron = require('node-cron')
require('dotenv').config();

const prisma = new PrismaClient();
const resetPasswordRouter = express.Router();


// Route pour afficher le formulaire de demande de réinitialisation de mot de passe
resetPasswordRouter.get('/mot-de-passe-oublie', (req, res) => {
  res.render('pages/request_reset_password.twig');
});


let emailQueue = [];
cron.schedule("* * * * *", () => {
  if (emailQueue.length > 0) {
    const email = emailQueue.shift();
    sendResetMail(email);
  }
});

// Route pour traiter la demande de réinitialisation (envoi d'un email avec un token)
resetPasswordRouter.post('/mot-de-passe-oublie', async (req, res) => {
  const { email } = req.body;

  emailQueue.push(email);

  return res.render('pages/request_reset_password.twig', {
    message: `Si votre adresse existe, vous recevrez un mail d'instruction pour réinitialiser votre mot de passe `,
  });
});

const sendResetMail = async (email) => {
  // Route pour traiter la demande de réinitialisation (envoi d'un email avec un token)
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email },
    });

    if (!utilisateur) {
      console.error(`Utilisateur "${email}" introuvable !`);
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 600000)

    await prisma.resetToken.deleteMany({
      where: { utilisateurId: utilisateur.id },
    });

    await prisma.resetToken.create({
      data: {
        token,
        utilisateurId: utilisateur.id,
        expiresAt,
      },
    });

    const resetUrl = `http://localhost:3000/mot-de-passe-reinitialisation?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: utilisateur.email,
        subject: 'Réinitialisation de votre mot de passe',
        html: `<p>Pour réinitialiser votre mot de passe, cliquez ici :</p>
               <a href="${resetUrl}" target="_blank">Réinitialiser mon mot de passe</a>`,
      });
      console.log(`Email bien envoyé à l'adresse "${email}"`)
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de réinitialisation.", emailError);
    }
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation.', error);
  }
};

// Route pour afficher le formulaire de réinitialisation du mot de passe
resetPasswordRouter.get('/mot-de-passe-reinitialisation', (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).send('Token manquant');
  }

  res.render('pages/reset_password.twig', { token });
});

// Route pour traiter la réinitialisation du mot de passe
resetPasswordRouter.post('/mot-de-passe-reinitialisation', async (req, res) => {
  const { token, password } = req.body;

  // Utiliser findFirst au lieu de findUnique
  const resetToken = await prisma.resetToken.findFirst({
    where: { token },
    include: { utilisateur: true },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return res.status(400).send('Token invalide ou expiré');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.utilisateur.update({
    where: { id: resetToken.utilisateurId },
    data: { password: hashedPassword },
  });

  await prisma.resetToken.delete({
    where: { id: resetToken.id },
  });

  res.render('pages/mot-de-passe-reinitilisation-success.twig')
});

module.exports = resetPasswordRouter;