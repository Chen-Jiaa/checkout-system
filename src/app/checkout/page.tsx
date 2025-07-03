"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CreditCard, Banknote } from "lucide-react"

type CheckoutData = {
  cart: Array<{ size: string; quantity: number }>
  totalPrice: number
  totalItems: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const data = localStorage.getItem("checkoutData")
    if (data) {
      setCheckoutData(JSON.parse(data))
    } else {
      // Redirect back to home if no checkout data
      router.push("/")
    }
  }, [router])

  const handlePaymentConfirmation = async (paymentMethod: "qr" | "cash") => {
    if (!checkoutData) return

    setIsProcessing(true)

    try {
      // Send telegram notification and record sale
      await fetch("/api/process-sale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart: checkoutData.cart,
          totalPrice: checkoutData.totalPrice,
          totalItems: checkoutData.totalItems,
          paymentMethod,
        }),
      })

      // Clear checkout data
      localStorage.removeItem("checkoutData")

      // Redirect to success page
      router.push("/success")
    } catch (error) {
      console.error("Error processing payment:", error)
      // Still redirect to success page for demo purposes
      router.push("/success")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300">Loading checkout data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Payment</h1>
          <p className="text-gray-300">Complete your purchase</p>
        </div>

        {/* Order Summary */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checkoutData.cart.map((item) => (
                <div key={item.size} className="flex justify-between items-center text-white">
                  <span className="font-medium">Size {item.size}</span>
                  <span>Qty: {item.quantity}</span>
                  <span>RM{(item.quantity * 89).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-600 pt-2 mt-4">
                <div className="flex justify-between items-center font-bold text-xl">
                  <span className="text-white">Total Amount</span>
                  <span className="text-green-400">RM{checkoutData.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <div className="grid md:grid-cols-1 gap-6 mb-6">
          {/* QR Code Payment */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                QR Code Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <Image
                    src="/placeholder.svg?height=150&width=150"
                    alt="Payment QR Code"
                    width={150}
                    height={150}
                    className="mx-auto"
                  />
                </div>
              </div>
              <p className="text-gray-300 mb-2 text-sm">Scan with your banking app</p>
              <p className="text-xs text-gray-400 mb-4">
                Amount: <span className="font-semibold">RM{checkoutData.totalPrice.toFixed(2)}</span>
              </p>
              <Button
                onClick={() => handlePaymentConfirmation("qr")}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? "Processing..." : "Paid by QR"}
              </Button>
            </CardContent>
          </Card>

          {/* Cash Payment */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                <Banknote className="w-5 h-5" />
                Cash Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => handlePaymentConfirmation("cash")}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? "Processing..." : "Paid by Cash"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-600 hover:bg-gray-700"
          >
            Back to Shopping
          </Button>
        </div>
      </div>
    </div>
  )
}

