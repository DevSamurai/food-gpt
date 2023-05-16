import dotenv from "dotenv"

dotenv.config()

export default {
  OpenaiApiToken: process.env.OPENAI_API_KEY,
}
