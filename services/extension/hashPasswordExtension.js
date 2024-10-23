const { Prisma } = require("@prisma/client");
const bcrypt = require("bcrypt");

module.exports = Prisma.defineExtension({
    query: {
        utilisateur: {
            create: async ({ args, query }) => {
                try {
                    // Hachage du mot de passe avant de le stocker
                    const hash = await bcrypt.hash(args.data.password, 10);
                    args.data.password = hash;
                    return query(args);
                } catch (error) {
                    throw error;
                }
            }
        }
    }
});