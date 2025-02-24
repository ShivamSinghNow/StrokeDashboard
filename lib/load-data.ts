export async function loadDataset() {
  try {
    console.log("Attempting to fetch data from API...")

    // First try the Next.js API route
    const response = await fetch("/api/dashboard-data")

    if (!response.ok) {
      throw new Error(`API response not ok: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Validate the data structure
    if (!data || !data.ageRiskData || !data.symptomData || !data.stats) {
      console.error("Invalid data structure received:", data)
      throw new Error("Invalid data structure received from API")
    }

    return data
  } catch (error) {
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      error,
    })
    return null
  }
}

