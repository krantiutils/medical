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

// Cookie domain for cross-subdomain auth sharing in production
const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
const isProduction = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
        domain: baseDomain ? `.${baseDomain}` : undefined,
      },
    },
    callbackUrl: {
      name: isProduction
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
        domain: baseDomain ? `.${baseDomain}` : undefined,
      },
    },
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
    async jwt({ token, user, account, trigger, isNewUser }) {
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
        // Check if user has any clinic staff membership
        const clinicStaff = await prisma.clinicStaff.findFirst({
          where: { user_id: user.id },
          select: { id: true },
        });
        token.hasClinicAccess = !!clinicStaff;
        // Mark new Google OAuth users for onboarding
        if (isNewUser && account?.provider === "google") {
          token.needsOnboarding = true;
        }
      }
      // Handle session refresh (called via useSession().update())
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.needsOnboarding = false;
        }
        // Re-check clinic access (e.g. after registering a clinic)
        const clinicStaff = await prisma.clinicStaff.findFirst({
          where: { user_id: token.id as string },
          select: { id: true },
        });
        token.hasClinicAccess = !!clinicStaff;
      }
      return token;
    },
    async session({ session, token }) {
      // Populate session from JWT token
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole | undefined;
        session.user.needsOnboarding = (token.needsOnboarding as boolean) || false;
        session.user.hasClinicAccess = (token.hasClinicAccess as boolean) || false;
      }
      return session;
    },
  },
};
