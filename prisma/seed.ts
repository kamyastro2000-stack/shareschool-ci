import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seed...");

  // Clean existing data
  await prisma.chatMessage.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.xPTransaction.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.validation.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.classRegistry.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.classe.deleteMany();
  await prisma.series.deleteMany();
  await prisma.level.deleteMany();
  await prisma.establishment.deleteMany();

  console.log("✅ Base nettoyée");

  // Create Establishment
  const establishment = await prisma.establishment.create({
    data: {
      name: "Lycée Scientifique d'Abidjan",
      slug: "lycee-scientifique-abidjan",
      contactEmail: "contact@lsa.ci",
    },
  });
  console.log(`✅ Établissement: ${establishment.name}`);

  // Create Levels
  const levelData = [
    { name: "6ème", order: 0 },
    { name: "5ème", order: 1 },
    { name: "4ème", order: 2 },
    { name: "3ème", order: 3 },
    { name: "2nde", order: 4 },
    { name: "1ère", order: 5 },
    { name: "Terminale", order: 6 },
  ];

  const levels: Record<string, string> = {};
  for (const l of levelData) {
    const level = await prisma.level.create({ data: l });
    levels[l.name] = level.id;
  }
  console.log("✅ Niveaux créés");

  // Create Series (for 2nde, 1ère, Terminale)
  const seriesData = [
    { name: "A", levelName: "2nde" },
    { name: "C", levelName: "2nde" },
    { name: "A1", levelName: "1ère" },
    { name: "A2", levelName: "1ère" },
    { name: "C", levelName: "1ère" },
    { name: "D", levelName: "1ère" },
    { name: "A1", levelName: "Terminale" },
    { name: "A2", levelName: "Terminale" },
    { name: "C", levelName: "Terminale" },
    { name: "D", levelName: "Terminale" },
  ];

  const seriesMap: Record<string, string> = {};
  for (const s of seriesData) {
    const series = await prisma.series.create({
      data: { name: s.name, levelId: levels[s.levelName] },
    });
    seriesMap[`${s.levelName}-${s.name}`] = series.id;
  }
  console.log("✅ Séries créées");

  // Create Classes
  const classData = [
    // Premier cycle (no series)
    { name: "1", levelName: "6ème" },
    { name: "2", levelName: "6ème" },
    { name: "3", levelName: "6ème" },
    { name: "1", levelName: "5ème" },
    { name: "2", levelName: "5ème" },
    { name: "1", levelName: "4ème" },
    { name: "2", levelName: "4ème" },
    { name: "A", levelName: "3ème" },
    { name: "B", levelName: "3ème" },
    // Second cycle avec séries
    { name: "1", levelName: "2nde", seriesKey: "2nde-A" },
    { name: "1", levelName: "2nde", seriesKey: "2nde-C" },
    { name: "1", levelName: "1ère", seriesKey: "1ère-A1" },
    { name: "1", levelName: "1ère", seriesKey: "1ère-A2" },
    { name: "1", levelName: "1ère", seriesKey: "1ère-C" },
    { name: "1", levelName: "1ère", seriesKey: "1ère-D" },
    { name: "1", levelName: "Terminale", seriesKey: "Terminale-A1" },
    { name: "1", levelName: "Terminale", seriesKey: "Terminale-A2" },
    { name: "1", levelName: "Terminale", seriesKey: "Terminale-C" },
    { name: "1", levelName: "Terminale", seriesKey: "Terminale-D" },
    { name: "2", levelName: "Terminale", seriesKey: "Terminale-D" },
  ];

  const classIds: Record<string, string> = {};
  for (const c of classData) {
    const classe = await prisma.classe.create({
      data: {
        name: c.name,
        levelId: levels[c.levelName],
        seriesId: c.seriesKey ? seriesMap[c.seriesKey] : null,
      },
    });
    const key = `${c.levelName}-${c.seriesKey || ""}-${c.name}`;
    classIds[key] = classe.id;
  }
  console.log("✅ Classes créées");

  // Create ClassRegistry
  for (const key of Object.keys(classIds)) {
    await prisma.classRegistry.create({
      data: {
        establishmentId: establishment.id,
        classId: classIds[key],
      },
    });
  }
  console.log("✅ Registre des classes créé");

  // First cycle subjects
  const firstCycleSubjects = [
    "Français", "Anglais", "Allemand/Espagnol", "Mathématiques",
    "Physique-Chimie", "SVT", "Histoire-Géographie", "EDHC",
    "Arts Plastiques", "Musique", "EPS",
  ];

  // Second cycle subjects (EDHC disappears, Philosophy appears)
  const secondCycleSubjects = [
    "Français (Littérature)", "Anglais", "Allemand/Espagnol", "Mathématiques",
    "Physique-Chimie", "SVT", "Histoire-Géographie",
    "Arts Plastiques", "Musique", "Philosophie", "EPS",
  ];

  for (const name of firstCycleSubjects) {
    await prisma.subject.create({
      data: { name, establishmentId: establishment.id, isFirstCycle: true },
    });
  }

  for (const name of secondCycleSubjects) {
    await prisma.subject.create({
      data: { name, establishmentId: establishment.id, isFirstCycle: false },
    });
  }
  console.log("✅ Matières créées");

  // Create Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: {
      email: "admin@lsa.ci",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "LSA",
      role: "ADMIN",
      establishmentId: establishment.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Admin créé (admin@lsa.ci / admin123)");

  // Create Teacher
  const teacherPassword = await bcrypt.hash("teacher123", 12);
  await prisma.user.create({
    data: {
      email: "professeur@lsa.ci",
      passwordHash: teacherPassword,
      firstName: "Paul",
      lastName: "Kouassi",
      role: "TEACHER",
      establishmentId: establishment.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Professeur créé (professeur@lsa.ci / teacher123)");

  // Create Student in Terminale D1
  const studentPassword = await bcrypt.hash("student123", 12);
  await prisma.user.create({
    data: {
      email: "eleve@lsa.ci",
      passwordHash: studentPassword,
      firstName: "Marie",
      lastName: "Koné",
      role: "STUDENT",
      establishmentId: establishment.id,
      classId: classIds["Terminale-D-1"],
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Élève créé (eleve@lsa.ci / student123)");

  // Create Class Rep in Terminale D1
  const repPassword = await bcrypt.hash("rep123", 12);
  await prisma.user.create({
    data: {
      email: "chef@lsa.ci",
      passwordHash: repPassword,
      firstName: "Yannick",
      lastName: "N'Guessan",
      role: "CLASS_REP",
      establishmentId: establishment.id,
      classId: classIds["Terminale-D-1"],
      classRepCode: "REP-TD1-001",
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Chef de classe créé (chef@lsa.ci / rep123)");

  // Create Badges
  const badgeData = [
    { name: "Premier pas", description: "Publier votre première ressource", iconUrl: "📄", criteria: "FIRST_UPLOAD", xpReward: 10 },
    { name: "Validateur", description: "Effectuer votre première validation", iconUrl: "✅", criteria: "FIRST_VALIDATION", xpReward: 10 },
    { name: "Scholar", description: "Terminer votre premier quiz", iconUrl: "🎯", criteria: "FIRST_QUIZ", xpReward: 10 },
    { name: "Génie", description: "Obtenir 100% à un quiz", iconUrl: "🧠", criteria: "PERFECT_QUIZ", xpReward: 25 },
    { name: "Centenaire", description: "Atteindre 100 XP", iconUrl: "⭐", criteria: "XP_100", xpReward: 0 },
    { name: "500 XP", description: "Atteindre 500 XP", iconUrl: "🌟", criteria: "XP_500", xpReward: 0 },
    { name: "Mille", description: "Atteindre 1000 XP", iconUrl: "💎", criteria: "XP_1000", xpReward: 50 },
    { name: "Vétéran", description: "Atteindre le niveau 5", iconUrl: "🎖️", criteria: "LEVEL_5", xpReward: 0 },
    { name: "Légende", description: "Atteindre le niveau 10", iconUrl: "👑", criteria: "LEVEL_10", xpReward: 100 },
    { name: "Contributeur", description: "5 ressources approuvées", iconUrl: "📚", criteria: "CONTRIBUTOR", xpReward: 30 },
    { name: "Librairie", description: "Publier 10 ressources", iconUrl: "🏛️", criteria: "UPLOAD_10", xpReward: 50 },
  ];

  for (const badge of badgeData) {
    await prisma.badge.create({ data: badge });
  }
  console.log("✅ Badges créés");

  // Create Chat Rooms
  const chatRooms = [
    { name: "Salon général", levelName: null },
    { name: "6ème", levelName: "6ème" },
    { name: "5ème", levelName: "5ème" },
    { name: "4ème", levelName: "4ème" },
    { name: "3ème", levelName: "3ème" },
    { name: "2nde", levelName: "2nde" },
    { name: "1ère", levelName: "1ère" },
    { name: "Terminale", levelName: "Terminale" },
  ];

  for (const room of chatRooms) {
    await prisma.chatRoom.create({
      data: {
        name: room.name,
        levelId: room.levelName ? levels[room.levelName] : null,
        establishmentId: establishment.id,
      },
    });
  }
  console.log("✅ Salons de discussion créés");

  console.log("\n🎉 Seed terminé !");
  console.log("\n📧 Identifiants de test :");
  console.log("   Admin      : admin@lsa.ci / admin123");
  console.log("   Professeur : professeur@lsa.ci / teacher123");
  console.log("   Élève      : eleve@lsa.ci / student123");
  console.log("   Chef classe: chef@lsa.ci / rep123");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
