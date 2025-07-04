"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Minus, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

const SIZES = ["S", "M", "L", "XL", "XXL"] as const
const PRICE_PER_ITEM = 89.0

type Size = (typeof SIZES)[number]
type CartItem = {
  size: Size
  quantity: number
}

type Inventory = Record<Size, number>

export default function HomePage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [inventory, setInventory] = useState<Inventory>({
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
  })
  const [isLoadingInventory, setIsLoadingInventory] = useState(true)

  // Load cart from localStorage and fetch inventory from Google Sheets
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
    fetchInventory()
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const fetchInventory = async () => {
    setCart([])
    setIsLoadingInventory(true)
    try {
      const response = await fetch("/api/inventory")
      if (response.ok) {
        const data = await response.json()
        setInventory(data.inventory)
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
    } finally {
      setIsLoadingInventory(false)
    }
  }

  const addToCart = (size: Size) => {
    if (inventory[size] <= 0) return

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.size === size)
      if (existingItem) {
        return prevCart.map((item) => (item.size === size ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [...prevCart, { size, quantity: 1 }]
      }
    })

    // Update local inventory display (will be refreshed from sheets after purchase)
    setInventory((prev) => ({
      ...prev,
      [size]: prev[size] - 1,
    }))
  }

  const removeFromCart = (size: Size) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.size === size)
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) => (item.size === size ? { ...item, quantity: item.quantity - 1 } : item))
      } else {
        return prevCart.filter((item) => item.size !== size)
      }
    })

    // Update local inventory display
    setInventory((prev) => ({
      ...prev,
      [size]: prev[size] + 1,
    }))
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return getTotalItems() * PRICE_PER_ITEM
  }

  const handleCheckout = () => {
    localStorage.setItem(
      "checkoutData",
      JSON.stringify({
        cart,
        totalPrice: getTotalPrice(),
        totalItems: getTotalItems(),
      }),
    )
    router.push("/checkout")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Clothing Self-Checkout</h1>
          <p className="text-gray-600">Select your size and quantity</p>
          <p className="text-lg font-semibold text-gray-800 mt-2">RM{PRICE_PER_ITEM.toFixed(2)} per item</p>
          <Button
            onClick={fetchInventory}
            variant="outline"
            size="sm"
            className="mt-2 border-gray-300 text-gray-600 hover:bg-gray-100 bg-transparent"
            disabled={isLoadingInventory}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingInventory ? "animate-spin" : ""}`} />
            Refresh Stock
          </Button>
        </div>

        {/* Size Selection */}
        <Card className="mb-6 bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <ShoppingCart className="w-5 h-5" />
              Select Sizes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {SIZES.map((size) => (
                <div key={size} className="text-center">
                  <Button
                    onClick={() => addToCart(size)}
                    disabled={inventory[size] <= 0 || isLoadingInventory}
                    className="w-full h-20 text-xl font-bold mb-2"
                    variant={inventory[size] <= 0 ? "secondary" : "default"}
                  >
                    <div className="flex flex-col items-center">
                      <span>{size}</span>
                      <Plus className="w-4 h-4 mt-1" />
                    </div>
                  </Button>
                  <Badge variant={inventory[size] <= 0 ? "destructive" : "secondary"}>
                    {isLoadingInventory ? "Loading..." : `Stock: ${inventory[size]}`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <Card className="mb-6 bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Your Cart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.size} className="flex justify-between items-center text-gray-900">
                    <span className="font-medium">Size {item.size}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => removeFromCart(item.size)}
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0 border-gray-300 text-gray-600 hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span>Qty: {item.quantity}</span>
                      <Button
                        onClick={() => addToCart(item.size)}
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0 border-gray-300 text-gray-600 hover:bg-gray-100"
                        disabled={inventory[item.size] <= 0}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span>RM{(item.quantity * PRICE_PER_ITEM).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-4">
                  <div className="flex justify-between items-center font-bold text-lg text-gray-900">
                    <span>Total ({getTotalItems()} items)</span>
                    <span>RM{getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checkout Button */}
        <div className="text-center">
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            size="lg"
            className={`px-8 py-4 text-lg font-semibold ${
              cart.length > 0
                ? "bg-green-600 hover:bg-green-700 shadow-lg transform hover:scale-105 transition-all"
                : ""
            }`}
          >
            {cart.length > 0 ? `Checkout - RM${getTotalPrice().toFixed(2)}` : "Add items to checkout"}
          </Button>
        </div>
      </div>
    </div>
  )
}
