import { Configuration, OpenAIApi } from "openai"
import { Message, Whatsapp, create } from "venom-bot"

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

// const completion = await openai.createCompletion({
//   model: "text-davinci-003",
//   prompt: "Hello world",
// })

create({
  session: "session-name",
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
