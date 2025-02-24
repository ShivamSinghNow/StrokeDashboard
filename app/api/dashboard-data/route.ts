import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Fetching data from Python backend...")

    const res = await fetch("http://localhost:8000/api/dashboard-data", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Python API Error:", {
        status: res.status,
        statusText: res.statusText,
        body: errorText,
      })
      throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()

    // Validate the data structure
    if (!data || !data.ageRiskData || !data.symptomData || !data.stats) {
      console.error("Invalid data received from Python API:", data)
      throw new Error("Invalid data structure from Python API")
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Dashboard data fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch data" },
      { status: 500 },
    )
  }
}

