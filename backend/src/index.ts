import { Message, Whatsapp, create } from "venom-bot"

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
