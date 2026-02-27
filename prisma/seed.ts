import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { Scrypt } from 'lucia';

const url = process.env.DATABASE_URL || 'file:./dev.db';

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const scrypt = new Scrypt();

async function main() {
	const email = 'admin@localhost';
	const password = 'admin123';

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		console.log('Utilisateur admin déjà présent:', email);
		return;
	}

	const passwordHash = await scrypt.hash(password);
	await prisma.user.create({
		data: {
			email,
			passwordHash,
			role: 'ADMIN'
		}
	});
	console.log('Utilisateur admin créé:', email, '| Mot de passe: admin123');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
