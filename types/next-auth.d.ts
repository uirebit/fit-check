import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      gender: string | null
      companyId: string | null
      companyName: string | null
      userType: number
      isAdmin: boolean
      isSuperadmin: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    gender: string | null
    companyId: string | null
    companyName: string | null
    userType: number
    isAdmin: boolean
    isSuperadmin: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    gender: string | null
    companyId: string | null
    companyName: string | null
    userType: number
    isAdmin: boolean
    isSuperadmin: boolean
  }
}
