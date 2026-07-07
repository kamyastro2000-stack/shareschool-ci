import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "./rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim()
          || request?.headers?.get("x-real-ip")
          || "unknown";
        const rateCheck = checkRateLimit(ip);
        if (!rateCheck.allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            establishment: { select: { name: true, slug: true } },
            classe: { select: { name: true, level: { select: { name: true } }, series: { select: { name: true } } } },
          },
        });

        if (!user || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          establishmentId: user.establishmentId,
          establishmentName: user.establishment.name,
          establishmentSlug: user.establishment.slug,
          classId: user.classId,
          className: user.classe
            ? `${user.classe.level.name}${user.classe.series ? " " + user.classe.series.name : ""} ${user.classe.name}`
            : null,
          totalXP: user.totalXP,
          level: user.level,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.establishmentId = user.establishmentId;
        token.establishmentName = user.establishmentName;
        token.establishmentSlug = user.establishmentSlug;
        token.classId = user.classId;
        token.className = user.className;
        token.totalXP = user.totalXP;
        token.level = user.level;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.establishmentId = token.establishmentId;
        session.user.establishmentName = token.establishmentName;
        session.user.establishmentSlug = token.establishmentSlug;
        session.user.classId = token.classId;
        session.user.className = token.className;
        session.user.totalXP = token.totalXP;
        session.user.level = token.level;
      }
      return session;
    },
  },
});
