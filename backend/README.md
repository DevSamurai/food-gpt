## Food Commerce GPT Chatbot

## Issues

### Error no open browser em WSL2

Caso ocorra o erro abaixo ao tentar subir a aplicação utilizando [WSL](https://learn.microsoft.com/pt-br/windows/wsl/):

```shell
⠋ Waiting... checking the browser...
  Puppeteer old Headless deprecation warning:
    In the near feature `headless: true` will default to the new Headless mode
    for Chrome instead of the old Headless implementation. For more
    information, please see https://developer.chrome.com/articles/new-headless/.
    Consider opting in early by passing `headless: "new"` to `puppeteer.launch()`
    If you encounter any bugs, please report them to https://github.com/puppeteer/puppeteer/issues/new/choose.

✖ Error no open browser....
Error no open browser....
```

Instale o seguinte pacote `chromium-browser`, no meu caso estou usando o `yay` do [ArchLinux](https://github.com/yuk7/ArchWSL):

```shell
yay -S chromium
```

E depois de instalado, digitar o comando abaixo:

```shell
which chromium
```

E atualizar as configurações de launch do Venom:

```ts
create({
  session: "food-gpt",
  headless: false,
  disableWelcome: true,
  puppeteerOptions: {
    executablePath: "/usr/sbin/chromium", // <- adicionar o caminho informado pelo
  },
})
```

Se você ainda não estiver utilizando o WSL2 com ArchWSL, eu gravei uma Master Class completa sobre isso no meu canal do [YouTube](https://www.youtube.com/@DevSamurai):

▶ [Ambiente perfeito para Dev Web com WSL 2 + Arch Linux | MASTER CLASS #009](https://www.youtube.com/watch?v=SWvs4KtHv-4)
