import prisma from "@/lib/prisma/prisma";

const main = async () => {
  try {
    await prisma.user.create({
      data: {
        fullName: "SUPER ADMIN",
        email: "admin@gmail.com",
        role: "SUPER_ADMIN",
        rights: [
          "ADMIN",
          "MANAGE_CONFIGS",
          "MANAGE_DEPARTMENT",
          "MANAGE_USERS",
          "MANAGE_STUDENTS",
          "MANAGE_ROUTING",
          "RESOLVE_GRIEVANCES",
          "VIEW_ALL_REQUESTS",
        ],
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
