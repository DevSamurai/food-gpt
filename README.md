# Food Commerce GPT

Bot de atendimento para o Food Commerce utilizando modelo GPT da OpenAI. Ele foi desenvolvido para o conteúdo da [Master Class #013](https://youtube.com/live/lCR7Ssw0v-k) da [Dev Samurai](https://devsamurai.com.br).

## Como funciona?

O bot utiliza o modelo GPT da OpenAI para gerar respostas para as perguntas dos usuários simulando um atendimento humano. Este atendimento é feito através do WhatsApp utilizando o [Venom](https://github.com/orkestral/venom).

Para que o bot siga um roteiro, um prompt padrão foi desenvolvido. Esse prompt pode ser visto no arquivo [`docs/prompt.md`](./docs/prompt.md).

Com este prompt você poderá adaptar o bot para o seu negócio ou para outros nichos, como clinicas, etc.

![Demo](./docs/demo.png)

## Como executar?

Para executar o bot, você precisará de uma conta no WhatsApp, do [Node.js](https://nodejs.org/en/) e [Docker](https://www.docker.com/products/docker-desktop/) instalados.

Você irá precisar também de uma conta e API Key no [OpenAI](https://platform.openai.com/account/api-keys).

Com isso em mãos, você precisará criar um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
OPENAI_API_KEY=sk-xxx <- Sua API Key do OpenAI
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

Após isso, você precisará instalar as dependências do projeto:

```bash
npm install
```

E então, executar o bot:

```bash
npm run dev
```

Para que você possa testar o bot, você precisará de um aplicativo do WhatsApp instalado no seu celular e escanear o QR Code que será gerado no terminal.

**Importante:** devido ao fato de utilizar uma API não autorizada do WhatsApp pode gerar bloqueios e banimentos de números, por isso, teste com um número que você não se importe em perder. Não se responsabilizamos por qualquer dano causado pelo uso deste código.

## Passo a passo

1. [x] Criar o projeto backend Node.js em TypeScript.
2. [x] Instalar a lib Venom e criar o primeiro client.
3. [x] Integrar com o OpenAI e criar o primeiro prompt.
4. [x] Criar o roteiro do bot.
5. [x] Integrar com o Redis para armazenar o estado do usuário.
6. [x] Finalizar o pedido e armazenar a order.

### Passo 1: Criar o projeto backend Node.js em TypeScript

Primeiro iremos criar a estrutura básica de um projeto Node.js com TypeScript. Para isso, crie uma pasta chamada `backend` e execute os comandos abaixo:

```bash
mkdir -p food-commerce-gpt
cd food-commerce-gpt
npm init -y
npm install -D @types/node nodemon rimraf ts-node typecript
```

Depois de criado, abra o arquivo `package.json` e adicione os scripts abaixo:

```json
{
  "scripts": {
    "build": "rimraf ./build && tsc",
    "dev": "nodemon",
    "start": "node build/index.js"
  },
}
```

E crie o arquivo `nodemon.json`:

```json
{
  "watch": ["src"],
  "ext": ".ts,.js",
  "ignore": [],
  "exec": "ts-node ./src/index.ts"
}
```

Com a nossa estrutura mínima chegou o momento de criar o arquivo `src/index.ts` com uma simples mensagem:

```ts
console.log('Hello World!')
```

Na sequência criar o arquivo `tsconfig.json` com o comando:

```bash
npx tsc --init
```

E por fim, ajustar o diretório de `build` no arquivo `tsconfig.json`:

```json
{
  "outDir": "./build",
}
```

Agora com a estrutura mínima necessária, vamos executar o projeto com o comando:

```bash
npm run dev
```

E você deverá ver a mensagem `Hello World!` no terminal.

### Passo 2: Instalar a lib Venom e criar o primeiro client

Agora que temos a estrutura básica do projeto, vamos instalar a lib Venom para criar o nosso primeiro client do WhatsApp.

Para isso, execute o comando abaixo:

```bash
npm install venom-bot
```

Com a lib instalada, vamos criar o arquivo `src/index.ts` com o seguinte conteúdo:

```ts
import { Message, Whatsapp, create } from "venom-bot"

create({
  session: "food-gpt",
  disableWelcome: true,
})
  .then(async (client: Whatsapp) => await start(client))
  .catch((err) => {
    console.log(err)
  })

async function start(client: Whatsapp) {
  client.onMessage(async (message: Message) => {
    if (!message.body || message.isGroupMsg) return

    const response = `Olá!`

    await client.sendText(message.from, response)
  })
}
```

E rodar o comando `npm run dev` para executar o projeto para vincular o dispositivo no seu WhatsApp.

Após escanear o QR Code, você poderá enviar uma mensagem para o número que você vinculou e deverá receber a mensagem `Olá!` como resposta.

Perceba que o Venom já cria um arquivo de sessão para que você não precise escanear o QR Code novamente. Ele fica na pasta `./tokens`.

### Passo 3: Integrar com o OpenAI e criar o primeiro prompt

Agora que temos o nosso client do WhatsApp, vamos integrar com o OpenAI para criar o nosso primeiro prompt.

Para isso, vamos instalar a lib do OpenAI e DotEnv:

```bash
npm install openai dotenv
```

Após a instalação, iremos criar um "gerenciador de configurações" no projeto. Para isso, crie o arquivo `src/config.ts` com o seguinte conteúdo:

```ts
import dotenv from "dotenv"

dotenv.config()

export const config = {
  openAI: {
    apiToken: process.env.OPENAI_API_KEY,
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: (process.env.REDIS_PORT as unknown as number) || 6379,
    db: (process.env.REDIS_DB as unknown as number) || 0,
  },
}
```

Com o gerenciador de configurações criado, vamos criar o arquivo `src/lib/openai.ts` com o seguinte conteúdo:

```ts
import { Configuration, OpenAIApi } from "openai"

import { config } from "../config"

const configuration = new Configuration({
  apiKey: config.openAI.apiToken,
})

export const openai = new OpenAIApi(configuration)
```

E no arquivo `src/index.ts` vamos importar o `openai` e criar uma função que será responsável por criar o prompt:

```ts
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
```

E adaptar a função `start` para utilizar o `completion` e criar uma primeira interação com o modelo:

```ts
async function start(client: Whatsapp) {
  client.onMessage(async (message: Message) => {
    if (!message.body || message.isGroupMsg) return

    const response = (await completion([message.body])) || "Não entendi..."

    await client.sendText(message.from, content)
  })
}
```

### Passo 4: Criar o roteiro do bot

O nosso modelo já responde com uma mensagem, mas ainda não é o suficiente para criar uma interação com o usuário. Para isso, vamos criar um roteiro para o bot.

Mas antes disso, para que o bot funcione, é preciso o histórico de todas as mensagens entre o usuário e o bot, assim o modelo consegue entender o contexto da conversa.

```ts
import { Message, Whatsapp, create } from "venom-bot"
import { ChatCompletionRequestMessage } from "openai"

import { openai } from "./lib/openai"

const customerChat: ChatCompletionRequestMessage[] = []

create({
  session: "food-gpt",
  disableWelcome: true,
})
  .then(async (client: Whatsapp) => await start(client))
  .catch((err) => {
    console.log(err)
  })

async function start(client: Whatsapp) {
  client.onMessage(async (message: Message) => {
    if (!message.body || message.isGroupMsg) return

    customerChat.push({
      role: "user",
      content: message.body
    })

    const response = (await completion(customerChat)) || "Não entendi..."

    customerChat.push({
      role: "assistant",
      content: response
    })

    await client.sendText(message.from, content)
  })
}
```

Para que o bot funcione, o modelo precisa de um contexto inicial:

```ts
const customerChat = ChatCompletionRequestMessage[
  {
    role: "system",
    content: "Você é uma assistente virtual de atendimento de uma pizzaria chamada Los Italianos. Você deve ser educada, atenciosa, amigável, cordial e muito paciente..."
  },
]
```

Isso posiciona o modelo para o contexto da conversa, deixando assim o modelo mais inteligente.

Um exemplo de roteiro de bot, encontra-se no arquivo [`docs/prompt.md`](./docs/prompt.md).

Se você perceber, além de conter o contexto inicial — 'Você é...' — ainda iremos acrescentar um roteiro detalhado de atendimento.

Isso garante que o bot seja capaz de atender o cliente de forma mais natural possível, mas ainda seguir uma sequencia predefinida.

E para inciar o bot com um contexto, iremos criar um arquivo [`src/prompts/pizzaAgent.ts`](./src/prompts/pizzaAgent.ts) com o seguinte conteúdo:

```ts
export const prompt = `Você é uma assistente virtual de atendimento de uma pizzaria chamada {{ storeName }}. Você deve ser educada, atenciosa, amigável, cordial e muito paciente.

Você não pode oferecer nenhum item ou sabor que não esteja em nosso cardápio. Siga estritamente as listas de opções.

O código do pedido é: {{ orderCode }}

O roteiro de atendimento é:

1. Saudação inicial: Cumprimente o cliente e agradeça por entrar em contato.
2. Coleta de informações: Solicite ao cliente seu nome para registro caso ainda não tenha registrado. Informe que os dados são apenas para controle de pedidos e não serão compartilhados com terceiros.
3. Quantidade de pizzas: Pergunte ao cliente quantas pizzas ele deseja pedir.
4. Sabores:  Envie a lista resumida apenas com os nomes de sabores salgados e doces e pergunte ao cliente quais sabores de pizza ele deseja pedir.
4.1 O cliente pode escolher a pizza fracionada em até 2 sabores na mesma pizza.
4.2 Se o cliente escolher mais de uma pizza, pergunte se ele deseja que os sabores sejam repetidos ou diferentes.
4.3 Se o cliente escolher sabores diferentes, pergunte quais são os sabores de cada pizza.
4.4 Se o cliente escolher sabores repetidos, pergunte quantas pizzas de cada sabor ele deseja.
4.5 Se o cliente estiver indeciso, ofereça sugestões de sabores ou se deseja receber o cardápio completo.
4.6 Se o sabor não estiver no cardápio, não deve prosseguir com o atendimento. Nesse caso informe que o sabor não está disponível e agradeça o cliente.
5. Tamanho: Pergunte ao cliente qual o tamanho das pizzas.
5.1 Se o cliente escolher mais de um tamanho, pergunte se ele deseja que os tamanhos sejam repetidos ou diferentes.
5.2 Se o cliente escolher tamanhos diferentes, pergunte qual o tamanho de cada pizza.
5.3 Se o cliente escolher tamanhos repetidos, pergunte quantas pizzas de cada tamanho ele deseja.
5.4 Se o cliente estiver indeciso, ofereça sugestões de tamanhos. Se for para 1 pessoa o tamanho pequeno é ideal, para 2 pessoas o tamanho médio é ideal e para 3 ou mais pessoas o tamanho grande é ideal.
6. Ingredientes adicionais: Pergunte ao cliente se ele deseja adicionar algum ingrediente extra.
6.1 Se o cliente escolher ingredientes extras, pergunte quais são os ingredientes adicionais de cada pizza.
6.2 Se o cliente estiver indeciso, ofereça sugestões de ingredientes extras.
7. Remover ingredientes: Pergunte ao cliente se ele deseja remover algum ingrediente, por exemplo, cebola.
7.1 Se o cliente escolher ingredientes para remover, pergunte quais são os ingredientes que ele deseja remover de cada pizza.
7.2 Não é possível remover ingredientes que não existam no cardápio.
8. Borda: Pergunte ao cliente se ele deseja borda recheada.
8.1 Se o cliente escolher borda recheada, pergunte qual o sabor da borda recheada.
8.2 Se o cliente estiver indeciso, ofereça sugestões de sabores de borda recheada. Uma dica é oferecer a borda como sobremesa com sabor de chocolate.
9. Bebidas: Pergunte ao cliente se ele deseja pedir alguma bebida.
9.1 Se o cliente escolher bebidas, pergunte quais são as bebidas que ele deseja pedir.
9.2 Se o cliente estiver indeciso, ofereça sugestões de bebidas.
10.  Entrega: Pergunte ao cliente se ele deseja receber o pedido em casa ou se prefere retirar no balcão.
10.1 Se o cliente escolher entrega, pergunte qual o endereço de entrega. O endereço deverá conter Rua, Número, Bairro e CEP.
10.2 Os CEPs de 12.220-000 até 12.330-000 possuem uma taxa de entrega de R$ 10,00.
10.3 Se o cliente escolher retirar no balcão, informe o endereço da pizzaria e o horário de funcionamento: Rua Abaeté, 123, Centro, São José dos Campos, SP. Horário de funcionamento: 18h às 23h.
11.  Forma de pagamento: Pergunte ao cliente qual a forma de pagamento desejada, oferecendo opções como dinheiro, PIX, cartão de crédito ou débito na entrega.
11.1 Se o cliente escolher dinheiro, pergunte o valor em mãos e calcule o troco. O valor informado não pode ser menor que o valor total do pedido.
11.2 Se o cliente escolher PIX, forneça a chave PIX CNPJ: 1234
11.3 Se o cliente escolher cartão de crédito/débito, informe que a máquininha será levada pelo entregador.
12.  Mais alguma coisa? Pergunte ao cliente se ele deseja pedir mais alguma coisa.
12.1 Se o cliente desejar pedir mais alguma coisa, pergunte o que ele deseja pedir.
12.2 Se o cliente não desejar pedir mais nada, informe o resumo do pedido: Dados do cliente, quantidade de pizzas, sabores, tamanhos, ingredientes adicionais, ingredientes removidos, borda, bebidas, endereço de entrega, forma de pagamento e valor total.
12.3 Confirmação do pedido: Pergunte ao cliente se o pedido está correto.
12.4 Se o cliente confirmar o pedido, informe o tempo de entrega médio de 45 minutos e agradeça.
12.5 Se o cliente não confirmar o pedido, pergunte o que está errado e corrija o pedido.
13.  Despedida: Agradeça o cliente por entrar em contato. É muito importante que se despeça informando o número do pedido.

Cardápio de pizzas salgadas (os valores estão separados por tamanho - Broto, Médio e Grande):

- Muzzarella: Queijo mussarela, tomate e orégano. R$ 25,00 / R$ 30,00 / R$ 35,00
- Calabresa: Calabresa, cebola e orégano. R$ 30,00 / R$ 35,00 / R$ 40,00
- Nordestina: Carne de sol, cebola e orégano. R$ 35,00 / R$ 40,00 / R$ 45,00
- Frango: Frango desfiado, milho e orégano. R$ 30,00 / R$ 35,00 / R$ 40,00
- Frango c/ Catupiry: Frango desfiado, catupiry e orégano. R$ 35,00 / R$ 40,00 / R$ 45,00
- A moda da Casa: Carne de sol, bacon, cebola e orégano. R$ 40,00 / R$ 45,00 / R$ 50,00
- Presunto: Presunto, queijo mussarela e orégano. R$ 30,00 / R$ 35,00 / R$ 40,00
- Quatro Estações: Presunto, queijo mussarela, ervilha, milho, palmito e orégano. R$ 35,00 / R$ 40,00 / R$ 45,00
- Mista: Presunto, queijo mussarela, calabresa, cebola e orégano. R$ 35,00 / R$ 40,00 / R$ 45,00
- Toscana: Calabresa, bacon, cebola e orégano. R$ 35,00 / R$ 40,00 / R$ 45,00
- Portuguesa: Presunto, queijo mussarela, calabresa, ovo, cebola e orégano. R$ 35,00 / R$ 40,00 / R$ 45,00
- Dois Queijos: Queijo mussarela, catupiry e orégano. R$ 35,00 / R$ 40,00 / R$ 45,00
- Quatro Queijos: Queijo mussarela, provolone, catupiry, parmesão e orégano. R$ 40,00 / R$ 45,00 / R$ 50,00
- Salame: Salame, queijo mussarela e orégano. R$ 35,00 / R$ 40,00 / R$ 45,00
- Atum: Atum, cebola e orégano. R$ 35,00 / R$ 40,00 / R$ 45,00

Cardápio de pizzas doces (os valores estão separados por tamanho - Broto, Médio e Grande):

- Chocolate: Chocolate ao leite e granulado. R$ 30,00 / R$ 35,00 / R$ 40,00
- Romeu e Julieta: Goiabada e queijo mussarela. R$ 30,00 / R$ 35,00 / R$ 40,00
- California: Banana, canela e açúcar. R$ 30,00 / R$ 35,00 / R$ 40,00

Extras/Adicionais (os valores estão separados por tamanho - Broto, Médio e Grande):

- Catupiry: R$ 5,00 / R$ 7,00 / R$ 9,00

Bordas (os valores estão separados por tamanho - Broto, Médio e Grande):

- Chocolate: R$ 5,00 / R$ 7,00 / R$ 9,00
- Cheddar: R$ 5,00 / R$ 7,00 / R$ 9,00
- Catupiry: R$ 5,00 / R$ 7,00 / R$ 9,00

Bebidas:

- Coca-Cola 2L: R$ 10,00
- Coca-Cola Lata: R$ 8,00
- Guaraná 2L: R$ 10,00
- Guaraná Lata: R$ 7,00
- Água com Gás 500 ml: R$ 5,00
- Água sem Gás 500 ml: R$ 4,00
```

Note que é um roteiro extremamente detalhado, para que possa atender a qualquer cliente de pizzaria. Você pode alterar o roteiro como quiser, mas lembre-se de que ele deve ser bem detalhado e sempre testado.

E depois iremos criar a função no arquivo [`src/utils/initPrompt.ts`](./src//utils/initPrompt.ts) que carrega esse prompt e também possibilita ajustar alguns dados:

```ts
import { prompt } from "../prompts/pizzaAgent"

export function initPrompt(storeName: string, orderCode: string): string {
  return prompt
    .replace(/{{[\s]?storeName[\s]?}}/g, storeName) // aqui é onde substituímos o nome da loja - {{ storeName }}
    .replace(/{{[\s]?orderCode[\s]?}}/g, orderCode) // aqui é onde substituímos o código do pedido - {{ orderCode }}
}
```

Depois desse roteiro 'monstro', iremos incorporar isso no nosso bot:

```ts
import { Message, Whatsapp, create } from "venom-bot"
import { ChatCompletionRequestMessage } from "openai"

import { openai } from "./lib/openai"

import { initPrompt } from "./utils/initPrompt"

const storeName = "Pizzaria Los Italianos"
const orderCode = "#sk-123456"

const customerChat = ChatCompletionRequestMessage[
  {
    role: "system",
    content: initPrompt(storeName, orderCode), // Aqui é onde carregamos o prompt monstruoso com algumas informações como nome da loja e código. fique atendo a quantidade de texto do OpenAI
  },
]

create({
  session: "food-gpt",
  disableWelcome: true,
})
  .then(async (client: Whatsapp) => await start(client))
  .catch((err) => {
    console.log(err)
  })

async function start(client: Whatsapp) {
  client.onMessage(async (message: Message) => {
    if (!message.body || message.isGroupMsg) return

    customerChat.push({
      role: "user",
      content: message.body
    })

    const response = (await completion(customerChat)) || "Não entendi..."

    customerChat.push({
      role: "assistant",
      content: response
    })

    await client.sendText(message.from, content)
  })
}
```

Com essas alterações já conseguimos ter um bot funcional, mas ainda não é multiusuário.

### Passo 5: Integrar com o Redis para armazenar o estado do usuário

Para armazenar os dados de conversas e o status de cada pedido, iremos utilizar o [Redis](https://redis.io/).

O Redis é um banco de dados em memória, que é extremamente rápido e simples de utilizar. Ele é muito utilizado para armazenar dados que precisam ser acessados rapidamente, como por exemplo, o status de um pedido.

Ele basicamente trabalha como um 'grande array' (*arrayzão*) com chave e valor.

A chave iremos armazenar o número do telefone do cliente, e o valor iremos armazenar o status do pedido e conversa.

Assim o bot não vai ficar perdido com a conversa de cada cliente, e também vai saber o status de cada pedido.

Para iniciar o uso do Redis, iremos instalar a biblioteca `ioredis`:

```bash
npm install ioredis
```

E criar o arquivo `src/lib/redis.ts` que será responsável por criar a conexão com o Redis:

```ts
import { Redis } from "ioredis"

import { config } from "../config"

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  db: config.redis.db,
})
```

O Redis é bem fácil de utilizar, basicamente ele possui duas funções principais: `set` e `get`.

```ts
redis.set("chave", "valor")
const value = await redis.get("chave")
```

O Redis consegue gravar valores apenas em string, por isso precisamos converter o objeto para string com `JSON.stringify` e depois converter novamente para objeto com `JSON.parse`.

```ts
redis.set("chave", JSON.stringify({ foo: "bar" }))
const obj = JSON.parse((await redis.get("chave")) || "{}")
```

Para que o nosso bot a conversa de cada cliente, iremos ajustar o código abaixo:

```ts
import { Message, Whatsapp, create } from "venom-bot"
import { ChatCompletionRequestMessage } from "openai"

import { openai } from "./lib/openai"
import { redis } from "./lib/redis"

import { initPrompt } from "./utils/initPrompt"

create({
  session: "food-gpt",
  disableWelcome: true,
})
  .then(async (client: Whatsapp) => await start(client))
  .catch((err) => {
    console.log(err)
  })

async function start(client: Whatsapp) {
  client.onMessage(async (message: Message) => {
    if (!message.body || message.isGroupMsg) return

    const storeName = "Pizzaria Los Italianos"

    const customerPhone = `+${message.from.replace("@c.us", "")}`
    const customerName = message.author
    const customerKey = `customer:${customerPhone}:chat`
    const orderCode = `#sk-${("00000" + Math.random()).slice(-5)}`

    const lastChat = JSON.parse((await redis.get(customerKey)) || "[]") // carrega a conversa do cliente do Redis

    const customerChat: CustomerChat =
      lastChat.length > 0
        ? lastChat
        : [
            {
              role: "system",
              content: initPrompt(storeName, orderCode),
            }
          ]

    customerChat.push({
      role: "user",
      content: message.body
    })

    const response = (await completion(customerChat)) || "Não entendi..."

    customerChat.push({
      role: "assistant",
      content: response
    })

    await client.sendText(message.from, content)

    redis.set(customerKey, JSON.stringify(customerChat)) // grava a conversa do cliente no Redis
  })
}
```

Se você não possuir o Redis instalado no seu computador, poderá utilizar o Docker para subir um container com o Redis através do docker-compose:

```yaml
version: "3.1"
services:
  redis:
    image: redis
    restart: always
    ports:
      - 6379:6379
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

Para subir o container, basta executar o comando:

```bash
docker-compose up -d
```

E em seguida, iremos subir o bot novamente:

```bash
npm run dev
```

### Passo 6: Finalizar o pedido e armazenar a order

Agora para que possamos controlar o status de cada pedido, iremos ajustar a estrutura de dados de mensagens e usuário:

```ts
import { ChatCompletionRequestMessage } from "openai"
import { Message, Whatsapp, create } from "venom-bot"

import { openai } from "./lib/openai"
import { redis } from "./lib/redis"

import { initPrompt } from "./utils/initPrompt"

// declara a interface de mensagens
interface CustomerChat {
  status?: "open" | "closed"
  orderCode: string
  chatAt: string
  customer: {
    name: string
    phone: string
  }
  messages: ChatCompletionRequestMessage[]
  orderSummary?: string
}

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
        ? (lastChat as CustomerChat) // carrega a mensagem do cliente do Redis ou crie uma nova
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

    // quando o bot repassar o número de pedido para o cliente, ele irá fechar o pedido e solicitar um resumo final para que possamos repassar a um atendente de forma resumida
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

      customerChat.orderSummary = content // armazena o resumo do pedido e NÃO envia para o cliente
    }

    redis.set(customerKey, JSON.stringify(customerChat))
  })
}
```

## Conclusão

Neste tutorial, você aprendeu como criar um chatbot para WhatsApp usando o OpenAI e o Venom Bot. Você também aprendeu como usar o Redis para armazenar o histórico de conversas e o resumo do pedido.

Como falamos, isso pode ser usado para qualquer tipo de negócio, desde que você tenha um sistema de pedidos e um sistema de atendimento ao cliente.

Espero que tenha gostado 🧡

-- Felipe Fontoura, @DevSamurai

PS: Se você curtiu esse conteúdo, vai curtir também minha newsletter, inscreva-se em https://st.devsamurai.com.br/f7tvr6rx/index.html
