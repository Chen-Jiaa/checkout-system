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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-10">
      <Card className="w-full max-w-md text-gray-900 bg-white border-gray-200">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600 text-center">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            Thank you for your purchase. Your order has been confirmed and recorded in our system.
          </p>

          <div className="bg-green-50 p-4 rounded-lg border border-green-700">
            <p className="text-sm text-green-700 text-center">Please collect your items from the designated area.</p>
          </div>

          <Button onClick={handleNewOrder} className="w-full" size="lg">
            Start New Order
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
