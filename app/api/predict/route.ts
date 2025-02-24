import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const res = await fetch("http://localhost:8000/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error("Failed to get prediction from Python backend")
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error making prediction:", error)
    return NextResponse.json(
      {
        error: "Failed to make prediction",
      },
      { status: 500 },
    )
  }
}

