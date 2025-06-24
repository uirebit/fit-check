"use server"

import { redirect } from "next/navigation"

interface AuthState {
  success?: boolean
  error?: string
  message?: string
}

export async function loginUser(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Basic validation
  if (!email || !password) {
    return {
      success: false,
      error: "Please fill in all fields",
    }
  }

  // Simulate authentication logic - accept multiple demo accounts
  const validAccounts = [
    { email: "demo@example.com", password: "password" },
    { email: "user@gmail.com", password: "password" },
    { email: "john@example.com", password: "password123" },
  ]

  const validAccount = validAccounts.find((account) => account.email === email && account.password === password)

  if (validAccount) {
    // In a real app, you would:
    // 1. Verify credentials against your database
    // 2. Create a session/JWT token
    // 3. Set secure cookies

    // For demo purposes, we'll just redirect
    redirect("/dashboard")
  } else {
    return {
      success: false,
      error: "Invalid email or password. Try demo@example.com with password 'password'",
    }
  }
}

export async function registerUser(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Basic validation
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

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Please enter a valid email address",
    }
  }

  // Simulate user creation
  // In a real app, you would:
  // 1. Check if user already exists
  // 2. Hash the password
  // 3. Save user to database
  // 4. Send verification email
  // 5. Create session/JWT token

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

  // Basic validation
  if (!email || !companyId || !gender) {
    return {
      success: false,
      error: "Please fill in all required fields",
    }
  }

  // Validate company ID format (example: must be alphanumeric and 3-20 characters)
  const companyIdRegex = /^[a-zA-Z0-9]{3,20}$/
  if (!companyIdRegex.test(companyId)) {
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

  // In a real app, you would:
  // 1. Update user profile in database with company ID and gender
  // 2. Set up user workspace based on company ID
  // 3. Send welcome email
  // 4. Create user session/JWT token
  // 5. Log the completion for analytics

  console.log("User onboarding completed:", {
    email,
    companyId,
    gender,
    timestamp: new Date().toISOString(),
  })

  return {
    success: true,
    message: "Profile setup completed successfully!",
  }
}

// New function to handle Google OAuth simulation
export async function handleGoogleAuth(isLogin = false) {
  // Simulate Google OAuth flow
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock Google user data
  const mockGoogleUser = {
    id: "google_123456789",
    email: "user@gmail.com",
    name: "John Doe",
    picture: "https://lh3.googleusercontent.com/a/default-user",
    verified_email: true,
  }

  if (isLogin) {
    // For login, check if user exists and redirect to dashboard
    // In a real app, you would verify the user exists in your database
    return {
      success: true,
      redirect: "/dashboard",
      user: mockGoogleUser,
    }
  } else {
    // For registration, proceed to onboarding
    return {
      success: true,
      requiresOnboarding: true,
      user: mockGoogleUser,
    }
  }
}
