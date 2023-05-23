import { Message, Whatsapp, create } from "venom-bot"

// import { openai } from "./lib/openai"

// const completion = await openai.createCompletion({
//   model: "text-davinci-003",
//   prompt: "Hello world",
// })

// +55 12 982754592

create({
  session: "food-gpt",
})
  .then((client: Whatsapp) => start(client))
  .catch((err) => {
    console.log(err)
  })

function start(client: Whatsapp) {
  client.onMessage((message: Message) => {
    if (message.body === "Hi" && message.isGroupMsg === false) {
      client
        .sendText(message.from, "Welcome Venom 🕷")
        .then((result) => {
          console.log("Result: ", result) //return object success
        })
        .catch((err) => {
          console.error("Error when sending: ", err) //return object error
        })
    }
  })
}
