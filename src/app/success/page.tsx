"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SuccessPage() {
  const router = useRouter()

  const handleNewOrder = () => {
    localStorage.removeItem("cart")
    localStorage.removeItem("checkoutData")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 py-10">
      <Card className="w-full max-w-md text-center bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-400">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            Thank you for your purchase. Your order has been confirmed and recorded in our system.
          </p>

          <div className="bg-green-900/30 p-4 rounded-lg border border-green-700">
            <p className="text-sm text-green-300">Please collect your items from the designated area.</p>
          </div>

          <Button onClick={handleNewOrder} className="w-full" size="lg">
            Start New Order
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
