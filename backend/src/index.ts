import { ChatCompletionRequestMessage } from "openai"
import { Message, Whatsapp, create } from "venom-bot"

import { openai } from "./lib/openai"
import { redis } from "./lib/redis"

import { initChat } from "./chats/pizzaAgent"

// +55 12 982754592

async function completion(
  messages: ChatCompletionRequestMessage[]
): Promise<string | undefined> {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 0.2,
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
  const customerChat: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: initChat,
    },
  ]

  client.onMessage(async (message: Message) => {
    if (!message.body || message.isGroupMsg) return

    console.debug(message.from, "user", message.body)

    customerChat.push({
      role: "user",
      content: message.body,
    })

    const content = (await completion(customerChat)) || "Não entendi..."

    customerChat.push({
      role: "assistant",
      content: content,
    })

    console.debug(message.from, "assistant", content)

    redis.set(message.from, JSON.stringify(customerChat))

    await client.sendText(message.from, content)
  })
}
