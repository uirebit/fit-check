"use server"

import { redirect } from "next/navigation"
import * as bcrypt from "bcryptjs"

interface AuthState {
  success?: boolean
  error?: string
  message?: string
  userData?: any
  sessionToken?: string
  errorLocale?: boolean // Indica si el error es una clave de traducción
}

export async function loginUser(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const { default: prisma } = await import("@/lib/prisma");  
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const locale = formData.get("locale") as string || "en"; // Get the current locale

  if (!email || !password) {
    return {
      success: false,
      error: "login.form.emptyFields",
      errorLocale: true
    }
  }

  try {
    // Find user in database
    const user = await prisma.fc_user.findUnique({
      where: { email },
    })

    if (!user) {
      return {
        success: false,
        error: "login.form.invalidCredentials",
        errorLocale: true
      }
    }

    // Compare password hash
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return {
        success: false,
        error: "login.form.invalidCredentials",
        errorLocale: true
      }
    }

    // Create userData for client storage
    const userData = {
      id: user.id,
      name: user.username,
      email: user.email,
      gender: user.is_male ? "Male" : "Female",
      companyId: user.company_id?.toString() || "N/A",
      joinDate: new Date().toISOString().split('T')[0],
    };

    // Create a session token
    const sessionToken = generateSessionToken();
    
    // Set cookie in response header
    return {
      success: true,
      message: "Login successful! Redirecting to dashboard...",
      userData: userData,
      sessionToken: sessionToken
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "login.form.serverError",
      errorLocale: true
    };
  }
}

// Helper function to generate a random token
function generateSessionToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export async function registerUser(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const locale = formData.get("locale") as string || "en"; // Get the current locale
  const { default: prisma } = await import("@/lib/prisma");

  if (!name || !email || !password || !confirmPassword) {
    return {
      success: false,
      error: "login.form.emptyFields",
      errorLocale: true
    }
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "register.form.passwordMismatch",
      errorLocale: true
    }
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "register.form.weakPassword",
      errorLocale: true
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "register.form.error",
      errorLocale: true
    }
  }

  // Check if user already exists
  const existingUser = await prisma.fc_user.findUnique({ where: { email } })
  if (existingUser) {
    return {
      success: false,
      error: "register.form.emailExists",
      errorLocale: true
    }
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10)

  // Create user in database
  await prisma.fc_user.create({
    data: {
      username: name,
      email,
      password_hash,
      is_male: true, // Default, update as needed
    },
  })

  return {
    success: true,
    message: "Account created successfully! You can now sign in.",
  }
}

export async function completeOnboarding(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const email = formData.get("email") as string
  const companyId = formData.get("companyId") as string
  const gender = formData.get("gender") as string
  const locale = formData.get("locale") as string || "en"; // Get the current locale
  const { default: prisma } = await import("@/lib/prisma");

  // Basic validation
  if (!email || !companyId || !gender) {
    return {
      success: false,
      error: "login.form.emptyFields",
      errorLocale: true
    }
  }

  // Validate company ID format
  const companyIdRegex = /^[a-zA-Z0-9]{3,20}$/
  if (!companyIdRegex.test(companyId)) {
    return {
      success: false,
      error: "onboarding.error.invalidCompanyId",
      errorLocale: true
    }
  }

  try {
    // Find the user
    const user = await prisma.fc_user.findUnique({
      where: { email }
    });

    if (!user) {
      return {
        success: false,
        error: "onboarding.error.userNotFound",
        errorLocale: true
      };
    }
    
    // Find company name if exists
    let companyName = "N/A";
    if (companyId && !isNaN(parseInt(companyId))) {
      const company = await prisma.fc_company.findUnique({
        where: { id: parseInt(companyId) }
      });
      if (company) {
        companyName = company.description;
      }
    }

    // Parse company_id to a number if needed
    const companyIdNum = parseInt(companyId) || null;

    // Update user with onboarding data
    await prisma.fc_user.update({
      where: { email },
      data: {
        company_id: companyIdNum,
        is_male: gender === 'male'
        // onboarded field doesn't exist in the schema
      }
    });

    // Create userData for client storage
    const userData = {
      id: user.id,
      name: user.username,
      email: user.email,
      gender: gender === 'male' ? "Male" : "Female",
      companyId: companyId,
      companyName: companyName,
      joinDate: new Date().toISOString().split('T')[0],
    };

    // Generate a session token
    const sessionToken = generateSessionToken();

    return {
      success: true,
      message: "Profile completed successfully! Redirecting to dashboard...",
      userData: userData,
      sessionToken: sessionToken
    };
  } catch (error) {
    console.error("Onboarding error:", error);
    return {
      success: false,
      error: "onboarding.error.serverError",
      errorLocale: true
    };
  }
}

// New function to handle Google OAuth simulation
export async function handleGoogleAuth(googleProfile: {
  id: string
  email: string
  name: string
  picture?: string
  verified_email?: boolean
}) {
  try {
    const { default: prisma } = await import("@/lib/prisma");

    // Check if user exists by email
    let user = await prisma.fc_user.findUnique({
      where: { email: googleProfile.email },
    });
    
    // For company information
    let userWithCompany = user ? await prisma.fc_user.findUnique({
      where: { email: googleProfile.email },
      include: {
        fc_company: true
      }
    }) : null;

    // Generate a session token for authentication
    const sessionToken = generateSessionToken();
    
    // Prepare user data for client storage
    const userData = {
      id: 0, // Will be updated if user exists
      name: googleProfile.name,
      email: googleProfile.email,
      gender: "Unknown", // Will be updated after onboarding
      companyId: "N/A",
      companyName: "N/A", // Will be updated if company exists
      joinDate: new Date().toISOString().split('T')[0],
      picture: googleProfile.picture || "",
    };

    if (!user) {
      // Create new user if not found
      user = await prisma.fc_user.create({
        data: {
          email: googleProfile.email,
          username: googleProfile.name,
          password_hash: "", // No password for OAuth users
          is_male: true, // Or infer from profile if available
          // Add other fields as needed
        },
      })
      
      // Update userData with user id
      userData.id = user.id;
      
      // Trigger onboarding flow for new users
      return {
        success: true,
        requiresOnboarding: true,
        userData: userData,
        sessionToken: sessionToken,
        error: undefined,
      }
    }

    // User exists, update userData with database values
    if (user) {
      userData.id = user.id;
      userData.gender = user.is_male ? "Male" : "Female";
      userData.companyId = user.company_id?.toString() || "N/A";
      
      // Add company name if available
      if (userWithCompany?.fc_company) {
        userData.companyName = userWithCompany.fc_company.description;
      }
    }
    
    // Return data for authenticated user
    return {
      success: true,
      redirect: "/dashboard",
      userData: userData,
      sessionToken: sessionToken,
      error: undefined,
    }
  } catch (err: any) {
      console.error("Google Auth Error:", err);
    return {
      success: false,
      error: "Google authentication failed. Please try again.",
    }
  }
}
