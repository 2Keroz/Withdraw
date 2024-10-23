-- CreateTable
CREATE TABLE `Paris` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `paris_id` INTEGER NULL,
    `equipe_choisie` VARCHAR(191) NOT NULL,
    `points_mises` INTEGER NOT NULL,
    `date_pari` DATETIME(3) NOT NULL,
    `perte_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pertes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `valeur` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PertesUtilisateurs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `pertes_id` INTEGER NOT NULL,
    `paris_id` INTEGER NOT NULL,
    `quantite` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Utilisateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `date_naissance` DATETIME(3) NOT NULL,
    `image_profil` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL,
    `date_inscription` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `points` INTEGER NOT NULL,
    `equipes` VARCHAR(191) NULL,

    UNIQUE INDEX `Utilisateur_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Paris` ADD CONSTRAINT `Paris_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PertesUtilisateurs` ADD CONSTRAINT `PertesUtilisateurs_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PertesUtilisateurs` ADD CONSTRAINT `PertesUtilisateurs_pertes_id_fkey` FOREIGN KEY (`pertes_id`) REFERENCES `Pertes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PertesUtilisateurs` ADD CONSTRAINT `PertesUtilisateurs_paris_id_fkey` FOREIGN KEY (`paris_id`) REFERENCES `Paris`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
