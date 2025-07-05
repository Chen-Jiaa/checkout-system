import { type NextRequest, NextResponse } from "next/server"

type CartItem = {
  size: string
  quantity: number
}

type CapItem = {
  color: "Black" | "Beige"
  quantity: number
}

type RequestBody = {
  cart: CartItem[]
  capCart?: CapItem[]
  totalPrice: number
  totalItems: number
  paymentMethod: "qr" | "cash"
}

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { cart, capCart = [], totalPrice, totalItems, paymentMethod } = body

    // Process T-shirt sizes
    const sizeQuantities = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
    for (const item of cart) {
      console.log("👕 T-shirt item:", item)
      const size = item.size.toUpperCase().trim()
      if (sizeQuantities.hasOwnProperty(size)) {
        sizeQuantities[size as keyof typeof sizeQuantities] += item.quantity
      }
    }

    // Process cap colors
    let blackQty = 0
    let beigeQty = 0
    
    for (const item of capCart) {
      console.log("🧢 Cap item:", item)
      if (item.color === "Black") {
        blackQty += item.quantity
      }
      if (item.color === "Beige") {
        beigeQty += item.quantity
      }
    }

    // 📦 Prepare payload for Google Apps Script
    // Make sure all values are proper numbers, not strings
    const payload = {
      S: Number(sizeQuantities.S),
      M: Number(sizeQuantities.M),
      L: Number(sizeQuantities.L),
      XL: Number(sizeQuantities.XL),
      XXL: Number(sizeQuantities.XXL),
      Black: Number(blackQty),
      Beige: Number(beigeQty),
      totalItems: Number(totalItems),
      totalPrice: Number(totalPrice),
      paymentMethod: String(paymentMethod),
    }

    console.log("📦 Final Payload to Sheet:", payload)

    // 🔗 Send sale to Google Apps Script
    const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_URL
    if (!webhookUrl) {
      throw new Error("GOOGLE_APPS_SCRIPT_URL environment variable is not set")
    }

    console.log("🌐 Sending to webhook URL:", webhookUrl)

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    console.log("📝 Google Apps Script response status:", res.status)
    console.log("📝 Google Apps Script response:", text)
    
    if (!res.ok) {
      console.error("❌ Google Apps Script error:", res.status, text)
      throw new Error(`Google Apps Script error: ${res.status} - ${text}`)
    }

    // Rest of your code for inventory fetching and Telegram messaging...
    // (keeping the rest the same as your original code)
    
    // 🧮 Fetch current inventory from Google Sheets (Balance sheet)
    const SHEET_ID = process.env.GOOGLE_SHEET_ID!
    const API_KEY = process.env.GOOGLE_API_KEY!
    const range = "Balance!A1:B9"
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error("Failed to fetch Balance sheet data")
    }

    const data = await response.json()
    const currentInventory: Record<string, number> = {}
    for (const [label, qty] of data.values) {
      if (label && qty) {
        currentInventory[label.toUpperCase().trim()] = parseInt(qty)
      }
    }

    // 🧾 Format Telegram message
    const orderDetailsParts = []

    if (cart.length > 0) {
      orderDetailsParts.push("👕 T-Shirts: " + cart.map(item => `${item.size}: ${item.quantity}`).join(", "))
    }
    if (capCart.length > 0) {
      orderDetailsParts.push("🧢 Caps: " + capCart.map(item => `${item.color}: ${item.quantity}`).join(", "))
    }
    
    const paymentMethodText = paymentMethod === "qr" ? "💳 QR Code" : "💵 Cash"

    const tshirtSizes = ["S", "M", "L", "XL", "XXL"]
    const capColors = ["BLACK", "BEIGE"]

    const tshirtStock = tshirtSizes
      .filter(size => currentInventory[size] !== undefined)
      .map(size => `${size}: ${currentInventory[size]}`)
      .join(", ")

    const capStock = capColors
      .filter(color => currentInventory[color] !== undefined)
      .map(color => `${color}: ${currentInventory[color]}`)
      .join(", ")

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

${orderDetailsParts.join("\n")}
💰 Total Amount: RM${totalPrice.toFixed(2)}
📊 Total Items: ${totalItems}
${paymentMethodText} Payment Method

📦 T-Shirt Balance:
${tshirtStock || "No T-Shirt data"}

🧢 Cap Balance:
${capStock || "No Cap data"}

✅ Sale recorded successfully
🕐 ${timestamp}`

    // 📤 Send Telegram message
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
    const TELEGRAM_THREAD_ID = process.env.TELEGRAM_THREAD_ID

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const telegramPayload: Record<string, unknown> = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }

      // Conditionally add thread ID for forum groups
      if (TELEGRAM_THREAD_ID?.trim()) {
        telegramPayload.message_thread_id = Number(TELEGRAM_THREAD_ID)
      }

      const telegramRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramPayload),
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

    console.error("❌ Unknown error:", error)
    return NextResponse.json({
      success: false,
      error: "Unknown error occurred",
    }, { status: 500 })
  }
}