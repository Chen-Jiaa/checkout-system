import { type NextRequest, NextResponse } from "next/server"

type CartItem = {
  size: string
  quantity: number
}

type RequestBody = {
  cart: CartItem[]
  totalPrice: number
  totalItems: number
  paymentMethod: "qr" | "cash"
}

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { cart, totalPrice, totalItems, paymentMethod } = body

    const sizeQuantities = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
    for (const item of cart) {
      const size = item.size.toUpperCase().trim()
      if (sizeQuantities.hasOwnProperty(size)) {
        sizeQuantities[size as keyof typeof sizeQuantities] += item.quantity
      }
    }

    // 📦 Prepare payload for Google Apps Script
    const payload = {
      ...sizeQuantities,
      totalItems,
      unitPrice: 89,
      totalPrice,
      paymentMethod,
    }

    // 🔗 Send sale to Google Apps Script
    const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_URL
    const res = await fetch(webhookUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    if (!res.ok) throw new Error(text)

    // 🧮 Fetch current inventory from Google Sheets (Balance sheet)
    const SHEET_ID = process.env.GOOGLE_SHEET_ID!
    const API_KEY = process.env.GOOGLE_API_KEY!
    const range = "Balance!A1:B5"
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error("Failed to fetch Balance sheet data")
    }

    const data = await response.json()
    const currentInventory: Record<string, number> = {}
    for (const [size, qty] of data.values) {
      currentInventory[size.toUpperCase().trim()] = parseInt(qty)
    }

    // 🧾 Format Telegram message
    const orderDetails = cart.map(item => `${item.size}: ${item.quantity}`).join(", ")
    const inventoryDetails = Object.entries(currentInventory)
      .map(([size, qty]) => `${size}: ${qty}`)
      .join(", ")
    const paymentMethodText = paymentMethod === "qr" ? "💳 QR Code" : "💵 Cash"

    const timestamp = new Date().toLocaleString("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    const message = `🛍️ NEW SALE ALERT!

📦 Items Sold: ${orderDetails}
💰 Total Amount: RM${totalPrice.toFixed(2)}
📊 Total Items: ${totalItems}
${paymentMethodText} Payment Method

📋 Stock Balance:
${inventoryDetails}

✅ Sale recorded successfully
🕐 ${timestamp}`

    // 📤 Send Telegram message
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
    const TELEGRAM_THREAD_ID = process.env.TELEGRAM_THREAD_ID

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const payload: Record<string, unknown> = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }

      // Conditionally add thread ID for forum groups
      if (TELEGRAM_THREAD_ID?.trim()) {
        payload.message_thread_id = Number(TELEGRAM_THREAD_ID)
      }

      const telegramRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!telegramRes.ok) {
        console.error("❌ Failed to send Telegram message:", await telegramRes.text())
      }
    }

    return NextResponse.json({ success: true, message: text })
  } catch (error: unknown) {
  if (error instanceof Error) {
    console.error("❌ Error sending to Apps Script or Telegram:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }

  // fallback if error is not an instance of Error
  console.error("❌ Unknown error:", error)
  return NextResponse.json({
    success: false,
    error: "Unknown error occurred",
  }, { status: 500 })
}
}