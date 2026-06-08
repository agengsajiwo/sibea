/**
 * Autentikasi admin menggunakan NextAuth v4 dengan Credentials Provider.
 *
 * Trade-off:
 * - Credentials Provider: sederhana, tidak butuh OAuth provider eksternal,
 *   password di-hash dengan bcrypt. Cocok untuk admin internal.
 *   Kekurangan: tidak ada refresh token otomatis, harus kelola session sendiri.
 * - Alternatif: middleware berbasis JWT di env (lebih ringan tapi kurang aman).
 *   Dipilih NextAuth karena lebih mature dan mudah di-extend jika butuh OAuth.
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
