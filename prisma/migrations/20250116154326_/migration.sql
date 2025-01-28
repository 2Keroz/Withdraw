-- DropForeignKey
ALTER TABLE `paris` DROP FOREIGN KEY `Paris_matchId_fkey`;

-- AddForeignKey
ALTER TABLE `Paris` ADD CONSTRAINT `Paris_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
