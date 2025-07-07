"use server"

import * as bcrypt from "bcryptjs"

interface AuthState {
  success?: boolean
  error?: string
  message?: string
  userData?: any
  errorLocale?: boolean // Indica si el error es una clave de traducción
  requiresOnboarding?: boolean
  redirect?: string
}

export async function loginUser(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const { default: prisma } = await import("@/lib/prisma");  
  const { signIn } = await import("@/auth");
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
    // Use NextAuth's signIn function
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    if (!result?.ok) {
      // Handle login failure
      return {
        success: false,
        error: "login.form.invalidCredentials",
        errorLocale: true
      }
    }

    // Login successful - NextAuth will handle the session
    return {
      success: true,
      message: "Login successful! Redirecting to dashboard..."
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

// No longer needed as we're using NextAuth for session management

export async function registerUser(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const companyName = formData.get("companyName") as string
  const gender = formData.get("gender") as string
  const locale = formData.get("locale") as string || "en"; // Get the current locale
  const { default: prisma } = await import("@/lib/prisma");

  // Basic form validation
  if (!name || !email || !password || !confirmPassword || !companyName || !gender) {
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
  
  // Find or verify company exists
  let companyId: number | null = null;
  let foundCompanyName = "";
  
  try {
    // Check if company exists (case insensitive)
    const existingCompany = await prisma.fc_company.findFirst({
      where: { 
        description: { 
          equals: companyName, 
          mode: 'insensitive' 
        } 
      }
    });
    
    if (existingCompany) {
      companyId = existingCompany.id;
      foundCompanyName = existingCompany.description;
    } else {
      // Company doesn't exist, return error
      return {
        success: false,
        error: "onboarding.error.companyNotFound",
        errorLocale: true
      };
    }
  } catch (error) {
    console.error("Error checking company:", error);
    return {
      success: false,
      error: "register.form.serverError",
      errorLocale: true
    };
  }

  try {
    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Create user in database with company and gender
    const user = await prisma.fc_user.create({
      data: {
        username: name,
        email,
        password_hash,
        is_male: gender === 'male',
        company_id: companyId,
      },
    })
    
    // Import signIn from NextAuth
    const { signIn } = await import("@/auth");
    
    // Auto-login the user with NextAuth after registration
    await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    
    // Return success - NextAuth will handle the session
    return {
      success: true,
      message: "Account created successfully! Redirecting to dashboard..."
    };
    
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "register.form.serverError",
      errorLocale: true
    };
  }
}

export async function completeOnboarding(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Get user email from NextAuth session
  const { auth } = await import("@/auth");
  const session = await auth();
  const email = session?.user?.email;
  
  const companyName = formData.get("companyName") as string
  const gender = formData.get("gender") as string
  const locale = formData.get("locale") as string || "en"; // Get the current locale
  const { default: prisma } = await import("@/lib/prisma");

  // Basic validation
  if (!email || !companyName || !gender) {
    return {
      success: false,
      error: "login.form.emptyFields",
      errorLocale: true
    }
  }

  // Validate company name format
  if (companyName.length < 2 || companyName.length > 100) {
    return {
      success: false,
      error: "onboarding.error.invalidCompanyName",
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
    
    // Find the company in the database (case insensitive)
    let companyId = null;
    let foundCompanyName = "";
    
    try {
      // Check if company exists
      const existingCompany = await prisma.fc_company.findFirst({
        where: { 
          description: { 
            equals: companyName, 
            mode: 'insensitive' 
          } 
        }
      });
      
      if (existingCompany) {
        companyId = existingCompany.id;
        foundCompanyName = existingCompany.description;
      } else {
        // Company doesn't exist, return error
        return {
          success: false,
          error: "onboarding.error.companyNotFound",
          errorLocale: true
        };
      }
    } catch (error) {
      console.error("Error checking company:", error);
      return {
        success: false,
        error: "onboarding.error.serverError",
        errorLocale: true
      };
    }
    
    // Only proceed if we found a valid company
    if (!companyId) {
      return {
        success: false,
        error: "onboarding.error.companyNotFound",
        errorLocale: true
      };
    }

    // Update user with onboarding data
    await prisma.fc_user.update({
      where: { email },
      data: {
        company_id: companyId,
        is_male: gender === 'male'
      }
    });

    // Determine user type and roles
    const userType = user.user_type || 3; // Default to employee (3) if not set
    const isSuperadmin = userType === 1; // Type 1 is superadmin
    const isAdmin = userType === 2; // ONLY Type 2 is admin, as requested
    
    // Create userData for client storage
    const userData = {
      id: user.id,
      name: user.username,
      email: user.email,
      gender: gender === 'male' ? "Male" : "Female",
      companyId: companyId?.toString() || "N/A",
      companyName: foundCompanyName,
      joinDate: new Date().toISOString().split('T')[0],
      userType: userType,
      userTypeName: userType === 1 ? "Superadmin" : userType === 2 ? "Admin" : "Employee",
      isAdmin: isAdmin,
      isSuperadmin: isSuperadmin
    };

    // The sign-in will be handled on the client side after onboarding completes
    // We'll return successful response and the client will handle auth

    return {
      success: true,
      message: "Profile completed successfully! Redirecting to dashboard...",
      userData: userData
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
    const { signIn } = await import("@/auth");

    // Check if user exists by email
    let user = await prisma.fc_user.findUnique({
      where: { email: googleProfile.email },
    });
    
    // For company information and user type
    let userWithCompany = user ? await prisma.fc_user.findUnique({
      where: { email: googleProfile.email },
      include: {
        fc_company: true,
        fc_user_type: true
      }
    }) : null;
    
    // Prepare user data for client storage
    const userData: any = {
      id: 0, // Will be updated if user exists
      name: googleProfile.name,
      email: googleProfile.email,
      gender: "Unknown", // Will be updated after onboarding
      companyId: "N/A",
      companyName: "N/A", // Will be updated if company exists
      joinDate: new Date().toISOString().split('T')[0],
      picture: googleProfile.picture || "",
      userType: 0, // Will be updated if user exists
      isAdmin: false, // Will be updated if user is admin
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
      
      // Sign in the user with NextAuth
      await signIn("credentials", {
        email: user.email,
        // No password needed as we're just setting up the NextAuth session
        redirect: false
      });
      
      // Trigger onboarding flow for new users
      return {
        success: true,
        requiresOnboarding: true,
        userData: userData,
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
      
      // Add user type information if available
      // Type 1 = Superadmin, Type 2 = Admin, Type 3 = Employee
      if (userWithCompany?.fc_user_type) {
        userData.userType = userWithCompany.fc_user_type.id;
        userData.userTypeName = userWithCompany.fc_user_type.description || "Employee";
        userData.isSuperadmin = userWithCompany.fc_user_type.id === 1; // Type 1 is superadmin
        userData.isAdmin = userWithCompany.fc_user_type.id === 2; // ONLY Type 2 is admin, as requested
      } else {
        // Fallback to direct user_type property if the relationship isn't loaded
        userData.userType = user.user_type || 3; // Default to employee if not set
        userData.isSuperadmin = user.user_type === 1;
        userData.isAdmin = user.user_type === 2; // ONLY Type 2 is admin, as requested
      }
      
      // Double check and ensure proper roles are set
      const userType = userData.userType;
      if (userType === 1) {
        userData.isSuperadmin = true;
        userData.isAdmin = false; // Superadmin is NOT an admin
      } else if (userType === 2) {
        userData.isSuperadmin = false;
        userData.isAdmin = true; // ONLY Type 2 is admin
      } else {
        userData.isSuperadmin = false;
        userData.isAdmin = false;
      }
    }
    
    // Authentication will be handled by the client using credentials provider
    // with the Google profile information we've already validated
    
    // Return data for authenticated user
    return {
      success: true,
      redirect: "/dashboard",
      userData: userData,
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
