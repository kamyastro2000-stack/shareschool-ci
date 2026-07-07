import { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
      establishmentId: string;
      establishmentName: string;
      establishmentSlug: string;
      classId: string | null;
      className: string | null;
      totalXP: number;
      level: number;
    } & DefaultSession["user"];
  }

  interface User {
    firstName: string;
    lastName: string;
    role: string;
    establishmentId: string;
    establishmentName: string;
    establishmentSlug: string;
    classId: string | null;
    className: string | null;
    totalXP: number;
    level: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    establishmentId: string;
    establishmentName: string;
    establishmentSlug: string;
    classId: string | null;
    className: string | null;
    totalXP: number;
    level: number;
  }
}
