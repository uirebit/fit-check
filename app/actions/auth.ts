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
    // Validate credentials directly instead of using signIn
    // Use findFirst with case insensitive mode for email
    const user = await prisma.fc_user.findFirst({
      where: { 
        email: {
          equals: email,
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
      return {
        success: false,
        error: "login.form.invalidCredentials",
        errorLocale: true
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return {
        success: false,
        error: "login.form.invalidCredentials",
        errorLocale: true
      }
    }

    // Return success with user data for client-side sign-in
    return {
      success: true,
      message: "Login successful! Redirecting to dashboard...",
      userData: {
        email: email,
        password: password // Pass for client-side sign in
      }
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

  // Check if user already exists (case insensitive)
  const existingUser = await prisma.fc_user.findFirst({ 
    where: { 
      email: {
        equals: email,
        mode: 'insensitive'
      } 
    }
  });
  
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
    // Store email in lowercase for consistency
    const user = await prisma.fc_user.create({
      data: {
        username: name,
        email: email.toLowerCase(), // Store email in lowercase
        password_hash,
        is_male: gender === 'male',
        company_id: companyId,
        user_type: 3, // Default to employee
        creation_date: new Date()
      },
    })
    
    // Return success with instruction to sign in on client side
    // Don't try to sign in server-side to avoid conflicts
    return {
      success: true,
      message: "Account created successfully!",
      userData: {
        email: email,
        password: password // Pass for client-side sign in
      }
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
export async function updateUserProfile(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  // Get user email from NextAuth session
  const { auth } = await import("@/auth");
  const session = await auth();
  const email = session?.user?.email;
  
  if (!email) {
    return {
      success: false,
      error: "settings.error.notAuthenticated",
      errorLocale: true
    }
  }
  
  const { default: prisma } = await import("@/lib/prisma");
  const name = formData.get("name") as string;
  const gender = formData.get("gender") as string;
  
  // Basic validation
  if (!name || !gender) {
    return {
      success: false,
      error: "settings.error.emptyFields",
      errorLocale: true
    }
  }
  
  try {
    // Find user by email (case insensitive)
    const user = await prisma.fc_user.findFirst({
      where: { 
        email: {
          equals: email,
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
      return {
        success: false,
        error: "settings.error.userNotFound",
        errorLocale: true
      };
    }
    
    // Update user data in database
    await prisma.fc_user.update({
      where: { id: user.id },
      data: {
        username: name,
        is_male: gender === 'Male'
      }
    });
    
    // Determine user type and roles for response
    const userType = user.user_type || 3;
    const isSuperadmin = userType === 1;
    const isAdmin = userType === 2;
    
    // Return success with updated user data
    return {
      success: true,
      message: "settings.success.profileUpdated",
      errorLocale: true,
      userData: {
        id: user.id,
        name: name,
        email: user.email,
        gender: gender,
        companyId: user.company_id?.toString() || "N/A",
        companyName: user.fc_company?.description || "N/A",
        userType: userType,
        isAdmin: isAdmin,
        isSuperadmin: isSuperadmin
      }
    };
  } catch (error) {
    console.error("Profile update error:", error);
    return {
      success: false,
      error: "settings.error.saveFailed",
      errorLocale: true
    };
  }
}

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
