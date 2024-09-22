const CODE_EXECUTION_URL = process.env.CODE_EXECUTION_URL || 'http://localhost:5000'

export async function executeCode(code: string, language: string) {
  const response = await fetch(`${CODE_EXECUTION_URL}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, language }),
  })
  return response.json()
}