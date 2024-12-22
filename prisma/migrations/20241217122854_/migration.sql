-- DropForeignKey
ALTER TABLE `match` DROP FOREIGN KEY `Match_equipe1Id_fkey`;

-- DropForeignKey
ALTER TABLE `match` DROP FOREIGN KEY `Match_equipe2Id_fkey`;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_equipe1Id_fkey` FOREIGN KEY (`equipe1Id`) REFERENCES `Equipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_equipe2Id_fkey` FOREIGN KEY (`equipe2Id`) REFERENCES `Equipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
