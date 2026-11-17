# Minha Rotina (app)

App de controle de rotina: seções (Treino, Estudo...), itens com detalhe (carga, duração...) e aba de **Constância** com gráfico.
Os dados ficam salvos **só no seu celular**. Não tem servidor nem login.

## Como instalar no Android (uns 5 minutos)

1. **Extraia o zip** no PC.
2. No GitHub, crie um repositório novo chamado `rotina`, marcado como **Public**.
   (O código fica público, mas seus dados não: eles ficam no celular.)
3. Na página do repositório, clique em **"uploading an existing file"** e arraste **tudo** o que está dentro da pasta `rotina-app`
   (`index.html`, `manifest.webmanifest`, `sw.js` e a pasta `icons`). Clique em **Commit changes**.
   *Se preferir o terminal:* `git init`, `git add .`, `git commit -m "app rotina"` e depois o push pro repositório.
4. Vá em **Settings → Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, branch **main** e pasta **/(root)**, e clique em **Save**.
5. Espere 1–2 minutos. O link vai aparecer no topo dessa página: `https://SEU-USUARIO.github.io/rotina/`
6. Abra esse link no **Chrome do celular**, toque no menu **⋮** e escolha **"Instalar app"** (ou "Adicionar à tela inicial").

Pronto: o ícone aparece na tela inicial, o app abre em tela cheia e funciona até sem internet.

## Cuidados

- **Backup:** se você limpar os dados do Chrome ou trocar de celular, os dados somem. Use **Ajustes → Salvar backup** de vez em quando
  (o arquivo vai pra pasta Downloads). Pra recuperar, use **Restaurar**.
- **Atualizar o app:** se mudar algum arquivo, troque `rotina-v1` por `rotina-v2` no `sw.js` antes de subir. Assim o celular baixa a versão nova.

## Como a constância é calculada

- Cada item da rotina conta como 1 tarefa por dia, a partir do dia em que foi criado.
- % do dia = tarefas marcadas ÷ tarefas que existiam naquele dia. Ex.: fez 2 de 10 = 20%.
- **Dias seguidos:** quantos dias em sequência você fez pelo menos 50% (o dia de hoje não quebra a sequência enquanto não acaba).
- Esqueceu de marcar ontem? Use as setas **‹ ›** no topo pra voltar o dia.
