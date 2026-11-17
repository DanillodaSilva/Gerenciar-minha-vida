# Minha Rotina (app)

App de controle de rotina: seções (Treino, Estudo...), itens com detalhe (carga, duração...) e abas **Hoje**, **Próximos**, **Progresso** e **Ajustes**. Funciona como site instalado pelo Chrome (PWA) e como APK Android (com lembretes).
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

- **Backup:** se você limpar os dados do Chrome ou trocar de celular, os dados somem. Use **Ajustes → Exportar tarefas** de vez em quando
  (no site o arquivo vai pra pasta Downloads; no APK abre o compartilhamento do Android). Pra recuperar, use **Importar backup**.
- **Atualizar o app:** se mudar algum arquivo, aumente o número do cache no `sw.js` (hoje `rotina-v3`; a próxima é `rotina-v4`) antes de subir. Assim o celular baixa a versão nova. Arquivo novo do app entra na lista `ARQUIVOS` do `sw.js`.
- **Testes:** `node --test` na pasta do projeto (Node 18 ou mais novo).
- **Nunca mude o endereço do site** nem `start_url`/`scope` do manifest: os dados ficam presos ao endereço e sumiriam.

## Como a constância é calculada

- Cada item da rotina conta como 1 tarefa por dia, a partir do dia em que foi criado.
- % do dia = tarefas marcadas ÷ tarefas que existiam naquele dia. Ex.: fez 2 de 10 = 20%.
- **Dias seguidos:** quantos dias em sequência você fez pelo menos 50% (o dia de hoje não quebra a sequência enquanto não acaba; dia sem nenhuma tarefa é pulado).
- Esqueceu de marcar ontem? Use as setas **‹ ›** no topo pra voltar o dia.

## APK Android (Capacitor)

O mesmo app, empacotado com Capacitor 8 na pasta `android/`. No APK os lembretes funcionam com o app fechado e voltam depois de reiniciar o celular.

### O que precisa no PC

- Node 18+ e `npm install` na pasta do projeto.
- **JDK 21** (o Gradle 8.14 não aceita o JDK 25/26). Se o `JAVA_HOME` do sistema apontar para outro JDK, defina só no terminal:
  - PowerShell: `$env:JAVA_HOME = "C:Program FilesEclipse Adoptiumjdk-21.0.12.101-hotspot"`
- Android SDK com plataforma 36. Defina `ANDROID_HOME` (ex.: `%LOCALAPPDATA%AndroidSdk`) ou abra a pasta `android/` no Android Studio, que cria o `local.properties`.

### Gerar o APK de debug

```
npm run sync
cd android
.gradlew.bat assembleDebug
```

O arquivo sai em `android/app/build/outputs/apk/debug/app-debug.apk`.
`npm run sync` copia `index.html`, `regras.js`, `manifest.webmanifest`, `sw.js`, `icons/` e o `capacitor.js` para `www/` e atualiza o projeto Android. Rode sempre que mudar o app.

A pasta do projeto fica em "Área de Trabalho" (com acento). Por isso `android/gradle.properties` tem `android.overridePathCheck=true`. Se algum build falhar por causa do caminho, copie o projeto para uma pasta sem acento (ex.: `C:devotina-app`).

### Instalar no celular

Com o cabo e a depuração USB ligada: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
Ou copie o APK para o celular e abra (permita "instalar apps desconhecidos").

### Quem já usa a versão do site

O APK é um app separado do site: as tarefas **não passam sozinhas**. Na primeira abertura o APK mostra "Já usava o Minha Rotina no navegador?":
1. No site (app instalado pelo Chrome), abra **Ajustes → Exportar tarefas**.
2. No APK, toque em **Importar backup** e escolha o arquivo.

### APK de release (para distribuir)

O projeto **não tem keystore**. Para gerar o de release, crie a sua (guarde a senha e o arquivo fora do repositório; o `.gitignore` já ignora `*.jks`, `*.keystore` e `keystore.properties`):

```
keytool -genkeypair -v -keystore C:chavesminha-rotina.jks -alias minha-rotina -keyalg RSA -keysize 2048 -validity 10000
```

Depois gere pelo Android Studio (**Build → Generate Signed App Bundle / APK**). **Use sempre a mesma keystore:** um APK assinado com outra chave não instala por cima, e desinstalar apaga as tarefas. Um APK de debug também não instala por cima de um de release (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`). Exporte o backup antes de qualquer troca.

### Identidade do app

`applicationId` = `com.minharotina.app`. **Nunca mude**: o Android trataria como outro app e as tarefas ficariam no app antigo.
