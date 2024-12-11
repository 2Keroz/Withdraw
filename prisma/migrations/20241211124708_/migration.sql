/*
  Warnings:

  - You are about to drop the `pertes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pertesutilisateurs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `pertesutilisateurs` DROP FOREIGN KEY `PertesUtilisateurs_paris_id_fkey`;

-- DropForeignKey
ALTER TABLE `pertesutilisateurs` DROP FOREIGN KEY `PertesUtilisateurs_pertes_id_fkey`;

-- DropForeignKey
ALTER TABLE `pertesutilisateurs` DROP FOREIGN KEY `PertesUtilisateurs_utilisateur_id_fkey`;

-- DropTable
DROP TABLE `pertes`;

-- DropTable
DROP TABLE `pertesutilisateurs`;
