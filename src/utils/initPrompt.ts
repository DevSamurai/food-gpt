import { prompt } from "../prompts/pizzaAgent"

interface PizzaCategory {
  name: string
}

interface PizzaSize {
  name: string
}

interface PizzaBorder {
  name: string
}

interface PizzaExtra {
  name: string
}
interface Pizza {
  category: PizzaCategory
  name: string
  ingredients: string[]
  sizes: (PizzaSize[] & {
    price: number
  })[]
  extras: (PizzaExtra[] & {
    price: number
  })[]
  borders: (PizzaBorder[] & {
    price: number
  })[]
}

interface Drink {
  name: string
  price: number
}

interface Menu {
  pizzas: {
    categories: PizzaCategory[]
    sizes: PizzaSize[]
    items: Pizza[]
    extras: PizzaExtra[]
    borders: PizzaBorder[]
  }
  drinks: {
    items: Drink[]
  }
}

export function initPrompt(storeName: string, orderCode: string): string {
  return prompt
    .replace(/{{[\s]?storeName[\s]?}}/g, storeName)
    .replace(/{{[\s]?orderCode[\s]?}}/g, orderCode)
}
