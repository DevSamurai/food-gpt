import { ChatCompletionRequestMessage } from "openai"
import { Message, Whatsapp, create } from "venom-bot"

import { openai } from "./lib/openai"
import { redis } from "./lib/redis"

import { initPrompt } from "./utils/initPrompt"

import { CustomerChat } from "./interfaces/CustomerChat"

// https://wa.me/+5512982754592

async function completion(
  messages: ChatCompletionRequestMessage[]
): Promise<string | undefined> {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 0,
    max_tokens: 256,
    messages,
  })

  return completion.data.choices[0].message?.content
}

create({
  session: "food-gpt",
  disableWelcome: true,
})
  .then(async (client: Whatsapp) => await start(client))
  .catch((err) => {
    console.log(err)
  })

async function start(client: Whatsapp) {
  const storeName = "Pizzaria Los Italianos"

  client.onMessage(async (message: Message) => {
    if (!message.body || message.isGroupMsg) return

    const customerPhone = `+${message.from.replace("@c.us", "")}`
    const customerName = message.author
    const customerKey = `customer:${customerPhone}:chat`
    const orderCode = `#sk-${("00000" + Math.random()).slice(-5)}`

    const lastChat = JSON.parse((await redis.get(customerKey)) || "{}")

    const customerChat: CustomerChat =
      lastChat?.status === "open"
        ? (lastChat as CustomerChat)
        : {
            status: "open",
            orderCode,
            chatAt: new Date().toISOString(),
            customer: {
              name: customerName,
              phone: customerPhone,
            },
            messages: [
              {
                role: "system",
                content: initPrompt(storeName, orderCode),
              },
            ],
            orderSummary: "",
          }

    console.debug(customerPhone, "👤", message.body)

    customerChat.messages.push({
      role: "user",
      content: message.body,
    })

    const content =
      (await completion(customerChat.messages)) || "Não entendi..."

    customerChat.messages.push({
      role: "assistant",
      content,
    })

    console.debug(customerPhone, "🤖", content)

    await client.sendText(message.from, content)

    if (
      customerChat.status === "open" &&
      content.match(customerChat.orderCode)
    ) {
      customerChat.status = "closed"

      customerChat.messages.push({
        role: "user",
        content:
          "Gere um resumo de pedido para registro no sistema da pizzaria, quem está solicitando é um robô.",
      })

      const content =
        (await completion(customerChat.messages)) || "Não entendi..."

      console.debug(customerPhone, "📦", content)

      customerChat.orderSummary = content
    }

    redis.set(customerKey, JSON.stringify(customerChat))
  })
}
