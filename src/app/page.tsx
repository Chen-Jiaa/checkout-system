"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

const SIZES = ["S", "M", "L", "XL", "XXL"] as const
const PRICE_PER_ITEM = 89.0
const CAP_PRICE = 49.0
const CAP_COLORS = ["Black", "Beige"] as const
type CapColor = (typeof CAP_COLORS)[number]

type CapItem = {
  color: CapColor
  quantity: number
}

type CapInventory = Record<CapColor, number>

type Size = (typeof SIZES)[number]
type CartItem = {
  size: Size
  quantity: number
}

type Inventory = Record<Size, number>

export default function HomePage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [inventory, setInventory] = useState<Inventory>({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 })
  const [capCart, setCapCart] = useState<CapItem[]>([])
  const [capInventory, setCapInventory] = useState<CapInventory>({ Black: 0, Beige: 0 })
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
    setCapCart([])
    setIsLoadingInventory(true)
    
    try {
      const response = await fetch("/api/inventory")
      if (response.ok) {
        const data = await response.json()
        setInventory(data.inventory)
        setCapInventory(data.capInventory)
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

  const addCapToCart = (color: CapColor) => {
  if (capInventory[color] <= 0) return

  setCapCart((prev) => {
    const existing = prev.find((item) => item.color === color)
    if (existing) {
      return prev.map((item) => item.color === color ? { ...item, quantity: item.quantity + 1 } : item)
    } else {
      return [...prev, { color, quantity: 1 }]
    }
  })

  setCapInventory((prev) => ({
    ...prev,
    [color]: prev[color] - 1,
  }))
}

const removeCapFromCart = (color: CapColor) => {
  setCapCart((prev) => {
    const existing = prev.find((item) => item.color === color)
    if (existing && existing.quantity > 1) {
      return prev.map((item) => item.color === color ? { ...item, quantity: item.quantity - 1 } : item)
    } else {
      return prev.filter((item) => item.color !== color)
    }
  })

  setCapInventory((prev) => ({
    ...prev,
    [color]: prev[color] + 1,
  }))
}

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0) + capCart.reduce((t, c) => t + c.quantity, 0)
  }

  const getTotalPrice = () => {
    const tshirtTotal = cart.reduce((total, item) => total + item.quantity * PRICE_PER_ITEM, 0)
    const capTotal = capCart.reduce((total, item) => total + item.quantity * CAP_PRICE, 0)
    return tshirtTotal + capTotal
  }

  const handleCheckout = () => {
    localStorage.setItem(
      "checkoutData",
      JSON.stringify({
        cart,
        capCart,
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Self-Checkout</h1>          
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

        {/* T-shirt Size Selection */}
        <Card className="mb-6 bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex-col items-center gap-2 text-gray-900 justify-items-center">
              <div className="flex items-center gap-2 text-xl">
                Still Standing T-Shirt
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex-col justify-items-center gap-4 mb-8">
              <Image 
                src="/still-standing-tshirt.png"
                width={250}
                height={250}
                alt="Still Standing T-shirt"
              />
              <p className="text-lg font-semibold text-gray-800 mt-2">RM{PRICE_PER_ITEM.toFixed(2)} per item</p>
              <p className="text-gray-600">Select size and quantity</p>
            </div>
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

        {/* Cap Colour Selection */}
        <Card className="mb-6 bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex-col items-center gap-2 text-gray-900 text-center text-xl">
                Fearless Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-8">
              {CAP_COLORS.map((color) => (
                <div key={color} className="text-center">
                  <Image
                    src={`/${color.toLowerCase()}-fearless-cap.png`}
                    width={200}
                    height={200}
                    alt={`Fearless Cap ${color}`}
                  />
                  <p className="text-lg font-semibold text-gray-800 mt-2">RM{CAP_PRICE.toFixed(2)} per item</p>
                  <p className="text-gray-600 mb-8">Select quantity</p>
                  <Button
                    onClick={() => addCapToCart(color)}
                    disabled={capInventory[color] <= 0 || isLoadingInventory}
                    className="w-full"
                    variant={capInventory[color] <= 0 ? "secondary" : "default"}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {color}
                  </Button>
                  <Badge variant={capInventory[color] <= 0 ? "destructive" : "secondary"} className="mt-2">
                    {isLoadingInventory ? "Loading..." : `Stock: ${capInventory[color]}`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cart Summary */}
        {(cart.length > 0 || capCart.length > 0) && (
          <Card className="mb-6 bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Your Cart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-gray-900">

                {/* T-Shirt Section */}
                {cart.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold border-b pb-1">T-Shirts</h3>
                    {cart.map((item) => (
                      <div key={item.size} className="flex justify-between items-center">
                        <span className="font-medium">Size {item.size}</span>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => removeFromCart(item.size)} size="sm" variant="outline" className="h-6 w-6 p-0 border-gray-300 text-gray-600 hover:bg-gray-100">
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span>Qty: {item.quantity}</span>
                          <Button onClick={() => addToCart(item.size)} size="sm" variant="outline" className="h-6 w-6 p-0 border-gray-300 text-gray-600 hover:bg-gray-100" disabled={inventory[item.size] <= 0}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span>RM{(item.quantity * PRICE_PER_ITEM).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Cap Section */}
                {capCart.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold border-b pt-4 pb-1">Caps</h3>
                    {capCart.map((item) => (
                      <div key={item.color} className="flex justify-between items-center">
                        <span className="font-medium">Color {item.color}</span>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => removeCapFromCart(item.color)} size="sm" variant="outline" className="h-6 w-6 p-0 border-gray-300 text-gray-600 hover:bg-gray-100">
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span>Qty: {item.quantity}</span>
                          <Button onClick={() => addCapToCart(item.color)} size="sm" variant="outline" className="h-6 w-6 p-0 border-gray-300 text-gray-600 hover:bg-gray-100" disabled={capInventory[item.color] <= 0}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span>RM{(item.quantity * CAP_PRICE).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}

                <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center font-bold text-lg">
                  <span>Total ({getTotalItems()} items)</span>
                  <span>RM{getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checkout Button */}
        <div className="text-center">
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0 && capCart.length === 0}
            size="lg"
            className={`px-8 py-4 text-lg font-semibold ${
              (cart.length > 0 || capCart.length > 0)
                ? "bg-green-600 hover:bg-green-700 shadow-lg transform hover:scale-105 transition-all"
                : ""
            }`}
          >
            {(cart.length > 0 || capCart.length > 0) ? `Checkout - RM${getTotalPrice().toFixed(2)}` : "Add items to checkout"}
          </Button>
        </div>
      </div>
    </div>
  )
}
