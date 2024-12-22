-- DropForeignKey
ALTER TABLE `competition` DROP FOREIGN KEY `Competition_jeuId_fkey`;

-- DropForeignKey
ALTER TABLE `equipe` DROP FOREIGN KEY `Equipe_competitionId_fkey`;

-- DropForeignKey
ALTER TABLE `equipe` DROP FOREIGN KEY `Equipe_jeuId_fkey`;

-- AddForeignKey
ALTER TABLE `Competition` ADD CONSTRAINT `Competition_jeuId_fkey` FOREIGN KEY (`jeuId`) REFERENCES `Jeu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equipe` ADD CONSTRAINT `Equipe_jeuId_fkey` FOREIGN KEY (`jeuId`) REFERENCES `Jeu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equipe` ADD CONSTRAINT `Equipe_competitionId_fkey` FOREIGN KEY (`competitionId`) REFERENCES `Competition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
