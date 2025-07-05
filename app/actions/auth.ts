"use server"

import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import * as bcrypt from "bcryptjs"

interface AuthState {
  success?: boolean
  error?: string
  message?: string
}

export async function loginUser(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return {
      success: false,
      error: "Please fill in all fields",
    }
  }

  // Find user in database
  const user = await prisma.fc_user.findUnique({
    where: { email },
  })

  if (!user) {
    return {
      success: false,
      error: "Invalid email or password.",
    }
  }

  // Compare password hash
  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) {
    return {
      success: false,
      error: "Invalid email or password.",
    }
  }

  // Optionally, set session/cookie here
  // For now, redirect to dashboard
  redirect("/dashboard")
}

export async function registerUser(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!name || !email || !password || !confirmPassword) {
    return {
      success: false,
      error: "Please fill in all fields",
    }
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Passwords do not match",
    }
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters long",
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Please enter a valid email address",
    }
  }

  // Check if user already exists
  const existingUser = await prisma.fc_user.findUnique({ where: { email } })
  if (existingUser) {
    return {
      success: false,
      error: "A user with this email already exists.",
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
  const companyDescription = formData.get("companyId") as string
  const gender = formData.get("gender") as string

  // Basic validation
  if (!email || !companyDescription || !gender) {
    return {
      success: false,
      error: "Please fill in all required fields",
    }
  }

  // Validate company ID format (example: must be alphanumeric and 3-20 characters)
  const companyIdRegex = /^[a-zA-Z0-9]{3,20}$/
  if (!companyIdRegex.test(companyDescription)) {
    return {
      success: false,
      error: "Company ID must be 3-20 alphanumeric characters",
    }
  }

  // Validate gender selection
  if (!["male", "female"].includes(gender.toLowerCase())) {
    return {
      success: false,
      error: "Please select a valid gender option",
    }
  }

  // Find company by description (adjust field name as needed)
const company = await prisma.fc_company.findFirst({
  where: { description: { equals: companyDescription, mode: "insensitive" } },
})
if (!company) {
  return {
    success: false,
    error: "Company not found.",
  }
}

  // In a real app, you would:
  // 1. Update user profile in database with company ID and gender
  // 2. Set up user workspace based on company ID
  // 3. Send welcome email
  // 4. Create user session/JWT token
  // 5. Log the completion for analytics

  console.log("User onboarding completed:", {
    email,
    companyDescription,
    gender,
    timestamp: new Date().toISOString(),
  })

  return {
    success: true,
    message: "Profile setup completed successfully!",
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
    // Check if user exists by email
    let user = await prisma.fc_user.findUnique({
      where: { email: googleProfile.email },
    })

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
      // Optionally, trigger onboarding flow for new users
      return {
        success: true,
        requiresOnboarding: true,
        user,
        error: undefined,
      }
    }

    // User exists, proceed to dashboard
    return {
      success: true,
      redirect: "/dashboard",
      user,
      error: undefined,
    }
  } catch (err: any) {
    return {
      success: false,
      error: "Google authentication failed. Please try again.",
    }
  }
}
