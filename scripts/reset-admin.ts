import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main() {
  const email = "admin@unu.ac.id";
  const password = process.env.ADMIN_DEFAULT_PASSWORD || "admin123";

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: { email, password: hashedPassword, name: "Administrator UNU" },
  });

  console.log(`✅ Admin user berhasil diupdate:`);
  console.log(`   Email   : ${user.email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
