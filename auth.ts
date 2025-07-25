import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { getEnv } from "./env"

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: getEnv("GOOGLE_CLIENT_ID") || "",
      clientSecret: getEnv("GOOGLE_CLIENT_SECRET") || "",
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("Authorize function called with:", {
          email: credentials?.email,
          hasPassword: !!credentials?.password
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials - email:", !!credentials?.email, "password:", !!credentials?.password);
          return null;
        }

        try {
          const { default: prisma } = await import("@/lib/prisma");
          
          console.log("Looking for user:", credentials.email);
          // Use findFirst with case insensitive mode instead of findUnique for email
          const user = await prisma.fc_user.findFirst({
            where: { 
              email: {
                equals: credentials.email as string,
                mode: 'insensitive'
              }
            },
            include: {
              fc_company: {
                select: {
                  id: true,
                  description: true
                }
              }
            }
          });

          if (!user) {
            console.log("User not found:", credentials.email);
            return null;
          }

          console.log("User found, verifying password for:", user.email);
          
          // Import bcrypt properly
          const bcrypt = await import("bcryptjs");
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          );

          if (!isPasswordValid) {
            console.log("Invalid password for user:", credentials.email);
            return null;
          }

          console.log("Password valid, returning user data for:", user.email);

          // Return user data in the format NextAuth expects
          const userData = {
            id: user.id.toString(),
            email: user.email,
            name: user.username,
            userType: user.user_type || 3,
            isSuperadmin: (user.user_type || 3) === 1,
            isAdmin: (user.user_type || 3) === 1 || (user.user_type || 3) === 2,
            companyId: user.company_id?.toString() || null,
            companyName: user.fc_company?.description || null,
            gender: user.is_male !== null ? (user.is_male ? "Male" : "Female") : null
          };

          console.log("Returning user data:", userData);
          return userData;

        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback:", {
        provider: account?.provider,
        userEmail: user?.email,
        userName: user?.name
      })

      // Handle Google OAuth sign-in
      if (account?.provider === "google") {
        try {
          const { default: prisma } = await import("@/lib/prisma")
          
          // Check if user exists in our database (case insensitive)
          let existingUser = await prisma.fc_user.findFirst({
            where: { 
              email: {
                equals: user.email!,
                mode: 'insensitive'
              }
            },
            include: {
              fc_company: {
                select: {
                  id: true,
                  description: true
                }
              }
            }
          })
          
          if (!existingUser) {
            console.log("Creating new Google user:", user.email)
            // Create new user for Google OAuth
            existingUser = await prisma.fc_user.create({
              data: {
                email: (user.email!).toLowerCase(), // Store email in lowercase for consistency
                username: user.name || user.email!.split('@')[0],
                password_hash: "", // Empty for OAuth users
                is_male: null, // Will be set during onboarding
                company_id: null, // Will be set during onboarding
                user_type: 3, // Default to employee
                creation_date: new Date()
              },
              include: {
                fc_company: {
                  select: {
                    id: true,
                    description: true
                  }
                }
              }
            })
          }
          
          console.log("Google user authenticated:", existingUser.email)
          return true
        } catch (error) {
          console.error("Google OAuth sign-in error:", error)
          return false
        }
      }
      
      // For credentials provider, authorization is already handled in authorize function
      return true
    },
    
    async jwt({ token, user, account, trigger }) {
      console.log("JWT callback:", {
        hasUser: !!user,
        provider: account?.provider,
        trigger,
        tokenEmail: token.email
      })

      // Handle initial sign-in for Google OAuth
      if (account?.provider === "google" && user?.email) {
        try {
          const { default: prisma } = await import("@/lib/prisma")
          
          const dbUser = await prisma.fc_user.findUnique({
            where: { email: user.email },
            include: {
              fc_company: {
                select: {
                  id: true,
                  description: true
                }
              }
            }
          })
          
          if (dbUser) {
            token.id = dbUser.id.toString()
            token.email = dbUser.email
            token.name = dbUser.username
            token.userType = dbUser.user_type || 3
            token.isSuperadmin = (dbUser.user_type || 3) === 1
            token.isAdmin = (dbUser.user_type || 3) === 1 || (dbUser.user_type || 3) === 2
            token.companyId = dbUser.company_id?.toString() || null
            token.companyName = dbUser.fc_company?.description || null
            token.gender = dbUser.is_male !== null ? (dbUser.is_male ? "Male" : "Female") : null
          }
        } catch (error) {
          console.error("Error fetching user data for Google OAuth:", error)
        }
      }
      
      // Handle initial sign-in for Credentials
      if (user && account?.provider === "credentials") {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.userType = (user as any).userType
        token.isSuperadmin = (user as any).isSuperadmin
        token.isAdmin = (user as any).isAdmin
        token.companyId = (user as any).companyId
        token.companyName = (user as any).companyName
        token.gender = (user as any).gender
      }
      
      // Refresh token data if user has incomplete data or on update trigger
      const needsOnboarding = !token.companyId || !token.gender
      
      // Always refresh when update is triggered (happens on profile updates)
      if (needsOnboarding || trigger === "update") {
        try {
          const { default: prisma } = await import("@/lib/prisma")
          
          if (token.id) {
            const dbUser = await prisma.fc_user.findUnique({
              where: { id: parseInt(token.id as string) },
              include: {
                fc_company: {
                  select: {
                    id: true,
                    description: true
                  }
                }
              }
            })
            
            if (dbUser) {
              token.id = dbUser.id.toString()
              token.email = dbUser.email
              token.name = dbUser.username
              token.gender = dbUser.is_male !== null ? (dbUser.is_male ? "Male" : "Female") : null
              token.companyId = dbUser.company_id?.toString() || null
              token.companyName = dbUser.fc_company?.description || null
              token.userType = dbUser.user_type || 3
              token.isAdmin = (dbUser.user_type || 3) === 1 || (dbUser.user_type || 3) === 2
              token.isSuperadmin = (dbUser.user_type || 3) === 1
            }
          }
        } catch (error) {
          console.error("Error refreshing token data:", error)
        }
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.gender = token.gender as string | null
        session.user.companyId = token.companyId as string | null
        session.user.companyName = token.companyName as string | null
        session.user.userType = token.userType as number
        session.user.isAdmin = token.isAdmin as boolean
        session.user.isSuperadmin = token.isSuperadmin as boolean
      }
      return session
    }
  },
  pages: {
    signIn: "/en",
    error: "/en",
    signOut: "/"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Make sure this matches exactly what's in your environment
  secret: getEnv("NEXTAUTH_SECRET"),
  // Add explicit cookie configuration for production
  cookies: process.env.NODE_ENV === "production" ? {
    sessionToken: {
      name: "__Secure-authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  } : undefined,
}

const _authHandler = NextAuth(authConfig)

export const auth = () => _authHandler.auth()
export const signIn = () => _authHandler.signIn()
export const signOut = () => _authHandler.signOut()
export const handlers = _authHandler.handlers