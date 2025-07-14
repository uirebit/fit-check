import { auth } from "@/auth"

export async function refreshSession() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return { success: false, error: "No session found" }
    }

    // Simply return success - the session will be refreshed by the client
    return { success: true }
  } catch (error) {
    console.error("Error refreshing session:", error)
    return { success: false, error: "Failed to refresh session" }
  }
}
