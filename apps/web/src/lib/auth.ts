import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma, UserRole } from "@swasthya/database";

// Normalize phone number for lookup
function normalizePhoneForLookup(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("977") && digits.length === 13) {
    return digits.slice(3);
  }
  return digits;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/en/login",
    error: "/en/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    // Email + Password login
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        if (!user.password_hash) {
          throw new Error("Please sign in with Google");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email ?? "", // NextAuth requires email to be string
          name: user.name,
          image: user.image,
        };
      },
    }),
    // Phone + Password login
    CredentialsProvider({
      id: "phone-credentials",
      name: "Phone and Password",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Phone number and password are required");
        }

        const normalizedPhone = normalizePhoneForLookup(credentials.phone);
        if (!normalizedPhone || normalizedPhone.length !== 10) {
          throw new Error("Invalid phone number format");
        }

        const user = await prisma.user.findUnique({
          where: { phone: normalizedPhone },
        });

        if (!user) {
          throw new Error("No account found with this phone number");
        }

        if (!user.password_hash) {
          throw new Error("No password set for this account");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email ?? user.phone ?? "", // Use phone as fallback identifier
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, user object is available - store user data in token
      if (user) {
        token.id = user.id;
        // Fetch the user role from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Populate session from JWT token
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole | undefined;
      }
      return session;
    },
  },
};
