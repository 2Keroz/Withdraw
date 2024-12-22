-- DropForeignKey
ALTER TABLE `paris` DROP FOREIGN KEY `Paris_utilisateur_id_fkey`;

-- AddForeignKey
ALTER TABLE `Paris` ADD CONSTRAINT `Paris_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `Utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
