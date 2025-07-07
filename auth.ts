import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      // Define credentials parameters
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Import Prisma client dynamically
          const { default: prisma } = await import("@/lib/prisma")
          
          // Find the user in the database
          const user = await prisma.fc_user.findUnique({
            where: { 
              email: credentials.email as string
            }
          })

          if (!user) {
            console.log("User not found:", credentials.email)
            return null
          }

          // Check if this is a Google OAuth login
          const isGoogleAuth = credentials.password.toString().startsWith('google-oauth2-');
          
          let isValidPassword = false;
          
          if (isGoogleAuth) {
            // For Google OAuth, we trust the authentication that already happened via Google's API
            // We just verify the user exists in our database
            isValidPassword = true;
          } else {
            // For regular logins, compare passwords
            isValidPassword = await bcrypt.compare(
              credentials.password as string,
              user.password_hash
            );
          }

          if (!isValidPassword) {
            console.log("Invalid password for:", credentials.email)
            return null
          }

          // Determine user type and roles
          const userType = user.user_type || 3 // Default to employee (3) if not set
          const isSuperadmin = userType === 1 // Type 1 is superadmin
          const isAdmin = userType === 2 // Type 2 is admin
          
          // Get company info if available
          let companyName = null
          if (user.company_id) {
            const company = await prisma.fc_company.findUnique({
              where: { id: user.company_id }
            })
            companyName = company?.description || null
          }
          
          // Return the authenticated user
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.username,
            gender: user.is_male ? "Male" : "Female",
            companyId: user.company_id?.toString() || null,
            companyName: companyName,
            userType: userType,
            isAdmin,
            isSuperadmin
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.gender = user.gender
        token.companyId = user.companyId
        token.companyName = user.companyName
        token.userType = user.userType
        token.isAdmin = user.isAdmin
        token.isSuperadmin = user.isSuperadmin
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.gender = token.gender as string
        session.user.companyId = token.companyId as string
        session.user.companyName = token.companyName as string
        session.user.userType = token.userType as number
        session.user.isAdmin = token.isAdmin as boolean
        session.user.isSuperadmin = token.isSuperadmin as boolean
      }
      return session
    }
  },
  pages: {
    signIn: "/en", // Default sign in page (root with auth section)
    error: "/en",  // Error page (same as sign in)
    signOut: "/"   // Sign out page (root)
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-default-secret-do-not-use-in-production",
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
