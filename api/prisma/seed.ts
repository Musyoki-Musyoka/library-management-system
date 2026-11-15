import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const genres = [
  { name: 'Fiction', slug: 'fiction' },
  { name: 'Science', slug: 'science' },
  { name: 'History', slug: 'history' },
  { name: 'Technology', slug: 'technology' },
];

const books = [
  { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '9780385474542', publishedYear: 1958, totalCopies: 6, genreSlug: 'fiction' },
  { title: 'Petals of Blood', author: "Ngugi wa Thiong'o", isbn: '9780143039174', publishedYear: 1977, totalCopies: 3, genreSlug: 'fiction' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', publishedYear: 1925, totalCopies: 5, genreSlug: 'fiction' },
  { title: 'One Hundred Years of Solitude', author: 'Gabriel Garcia Marquez', isbn: '9780060883287', publishedYear: 1967, totalCopies: 4, genreSlug: 'fiction' },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', publishedYear: 1988, totalCopies: 4, genreSlug: 'science' },
  { title: 'Cosmos', author: 'Carl Sagan', isbn: '9780345539434', publishedYear: 1980, totalCopies: 3, genreSlug: 'science' },
  { title: 'The Selfish Gene', author: 'Richard Dawkins', isbn: '9780198788607', publishedYear: 1976, totalCopies: 2, genreSlug: 'science' },
  { title: 'Silent Spring', author: 'Rachel Carson', isbn: '9780618249060', publishedYear: 1962, totalCopies: 3, genreSlug: 'science' },
  { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '9780062316097', publishedYear: 2011, totalCopies: 5, genreSlug: 'history' },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', isbn: '9780393317558', publishedYear: 1997, totalCopies: 3, genreSlug: 'history' },
  { title: 'The Silk Roads', author: 'Peter Frankopan', isbn: '9781101912379', publishedYear: 2015, totalCopies: 2, genreSlug: 'history' },
  { title: 'Facing Mount Kenya', author: 'Jomo Kenyatta', isbn: '9780435907204', publishedYear: 1938, totalCopies: 2, genreSlug: 'history' },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', publishedYear: 2008, totalCopies: 4, genreSlug: 'technology' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', isbn: '9780135957059', publishedYear: 2019, totalCopies: 3, genreSlug: 'technology' },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '9781449373320', publishedYear: 2017, totalCopies: 2, genreSlug: 'technology' },
  { title: 'Refactoring', author: 'Martin Fowler', isbn: '9780134757599', publishedYear: 2018, totalCopies: 2, genreSlug: 'technology' },
];

/** Plain-text passwords for the demo accounts (change in a real deployment). */
const users = [
  { email: 'grace.mwangi@example.com', name: 'Grace Mwangi', role: Role.LIBRARIAN, password: 'librarian123' },
  { email: 'amina.odhiambo@example.com', name: 'Amina Odhiambo', role: Role.PATRON, password: 'patron123' },
  { email: 'brian.kimani@example.com', name: 'Brian Kimani', role: Role.PATRON, password: 'patron123' },
];

async function main() {
  console.log('Seeding database...');

  await prisma.review.deleteMany();
  await prisma.book.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.user.deleteMany();

  const genreIdBySlug = new Map<string, number>();
  for (const genre of genres) {
    const created = await prisma.genre.create({ data: genre });
    genreIdBySlug.set(created.slug, created.id);
  }
  console.log(`  ${genres.length} genres created`);

  for (const { genreSlug, ...book } of books) {
    const genreId = genreIdBySlug.get(genreSlug);
    if (!genreId) throw new Error(`No genre found for slug "${genreSlug}"`);
    await prisma.book.create({
      data: { ...book, availableCopies: book.totalCopies, genreId },
    });
  }
  console.log(`  ${books.length} books created`);

  for (const user of users) {
    await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
        password: await bcrypt.hash(user.password, SALT_ROUNDS),
      },
    });
  }
  console.log(`  ${users.length} users created (passwords bcrypt-hashed)`);

  console.log('');
  console.log('  Demo accounts:');
  console.log('    LIBRARIAN  grace.mwangi@example.com  / librarian123');
  console.log('    PATRON     amina.odhiambo@example.com / patron123');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
