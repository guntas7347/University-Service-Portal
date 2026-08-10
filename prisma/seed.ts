import prisma from "@/lib/prisma/prisma";

const main = async () => {
  try {
    await prisma.user.create({
      data: {
        fullName: "SUPER ADMIN",
        email: "admin@gmail.com",
        passwordHash: "resetlater",
        role: "SUPER_ADMIN",
      },
    });

    console.log("✅ SUPER ADMIN user created successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
};

main();
