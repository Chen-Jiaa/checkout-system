import { NextResponse } from "next/server"

export const runtime = 'nodejs'

export async function GET() {
  try {
    // First try API Key approach (more reliable for read-only)
    if (process.env.GOOGLE_API_KEY) {
      console.log("Trying API Key approach...")
      return await getInventoryWithApiKey()
    }

  } catch (error: unknown) {
    console.error("Error fetching inventory:", error)

    // Fallback to default inventory
    const fallbackInventory = {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
    }

    const message = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json({ 
      inventory: fallbackInventory,
      fallback: true,
      error: message
    })
  }
}

async function getInventoryWithApiKey() {
  const API_KEY = process.env.GOOGLE_API_KEY!
  const SHEET_ID = process.env.GOOGLE_SHEET_ID!
  
  const range = "Balance!A1:B5"
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Google Sheets API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }
  
  const data = await response.json()
  console.log("Sheet data from Balance:", data)
  
  if (data.values && data.values.length > 0) {
    return parseInventoryData(data.values)
  }
  
  throw new Error("No data found in Balance sheet")
}

function parseInventoryData(rows: string[][]) {
  
  const inventory = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
  
  // Handle different data formats
  for (const row of rows) {
    if (row.length >= 2) {
      const size = row[0]?.toString().toUpperCase().trim()
      const quantity = Number.parseInt(row[1]?.toString() || "0")
      
      if (inventory.hasOwnProperty(size) && !isNaN(quantity)) {
        inventory[size as keyof typeof inventory] = quantity
      }
    }
  }
  
  return NextResponse.json({ inventory })  

}