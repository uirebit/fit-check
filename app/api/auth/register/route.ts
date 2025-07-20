import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.fc_user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user
    const newUser = await prisma.fc_user.create({
      data: {
        email,
        username: username || email.split('@')[0],
        password_hash: hashedPassword,
        is_male: null, // Will be set during onboarding
        company_id: null, // Will be set during onboarding
        user_type: 3, // Default to employee
        creation_date: new Date()
      }
    })

    return NextResponse.json({
      message: "User created successfully",
      userId: newUser.id
    })

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}