export function getEnv(name: string): string {
  const value = process.env[name]
  console.log(`Environment variable ${name}:`, value ? 'exists' : 'missing')
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`)
  }
  return value
}
