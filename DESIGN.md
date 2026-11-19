# DESIGN.md — Minha Rotina

Fonte única de verdade do visual. Todo valor de cor, tamanho, espaçamento, canto, sombra e duração usado em `index.html` vem daqui, como variável CSS. Nenhum componente usa valor solto.

- Produto: app de rotina e tarefas do dia, offline, instalado pelo Chrome (PWA).
- Público: quem anota o dia no celular e quer ver rápido o que falta.
- Ação principal: **Nova tarefa** (botão flutuante). Secundária: concluir tarefa.
- Base: Material 3 com cores próprias. Cor semente `#6B3FA0`. Identidade roxa desde a versão 1.5.0 (decisão do dono do app, 18/11/2026). Categorias de seção continuam com as 8 cores, sem roxo.
- Idioma: pt-BR.

## Arquitetura dos tokens

```
Primitivo  (valor bruto, nunca usado direto em componente)   --p-purple-600: #6B3FA0
   ↓
Semântico  (função, muda entre claro e escuro)               --primary: var(--p-purple-600)
   ↓
Componente (peça específica)                                 --fab-bg: var(--primary)
```

- Os primitivos ficam em `:root`.
- Os semânticos têm dois conjuntos: claro (padrão) e escuro.
- O escuro vale com `html[data-theme="dark"]` ou, sem escolha explícita, com `prefers-color-scheme: dark`. `html[data-theme="light"]` força o claro.
- Os de componente só apontam para semânticos.

## 1. Cores

### 1.1 Semânticos

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--background` | `#F7F6F3` | `#141413` | fundo da tela, splash |
| `--surface` | `#FFFFFF` | `#1E1D1B` | itens, cartões, folha inferior |
| `--surface-variant` | `#EFEDE8` | `#2A2926` | chips, campos, segmentado, esqueleto |
| `--border` | `#E2DFD8` | `#34322E` | bordas decorativas de cartão e divisórias |
| `--border-strong` | `#92876D` | `#767168` | borda de campo, caixa de conclusão, chip (controles, 3:1) |
| `--text-primary` | `#1C1B19` | `#F2F0EB` | texto principal |
| `--text-secondary` | `#5F5B53` | `#B3AEA4` | linha secundária, cabeçalhos de seção |
| `--primary` | `#6B3FA0` | `#C3A6F0` | ação principal, seleção, anel, barra de hoje |
| `--on-primary` | `#FFFFFF` | `#24123D` | texto e ícone sobre `--primary` |
| `--danger` | `#B91C1C` | `#F87171` | excluir, erro, horário passado |
| `--on-danger` | `#FFFFFF` | `#141413` | ícone e texto sobre `danger` sólido (fundo do gesto de excluir): 6,47:1 claro, 6,66:1 escuro; `onPrimary` sobre `primary` sólido (gesto de marcar): 7,38:1 e 8,16:1 |
| `--priority-high` | `#C0400C` | `#FB8B5B` | prioridade alta |
| `--priority-medium` | `#9A5E07` | `#E6B84A` | prioridade média |
| `--priority-low` | `#4B6B8A` | `#8FB3D9` | prioridade baixa |
| `--scrim` | `rgb(28 27 25 / .45)` | `rgb(0 0 0 / .6)` | fundo atrás da folha e do diálogo |

### 1.2 Cores de seção/categoria (8)

| Token | Claro | Escuro |
|---|---|---|
| `--cat-green` | `#2F6B4F` | `#6FBF95` |
| `--cat-blue` | `#2261EB` | `#7AA7F5` |
| `--cat-teal` | `#0F766E` | `#5EC4B8` |
| `--cat-orange` | `#C0400C` | `#FB8B5B` |
| `--cat-red` | `#B91C1C` | `#F87171` |
| `--cat-yellow` | `#9A5E07` | `#E6B84A` |
| `--cat-brown` | `#7C5A3A` | `#C9A27E` |
| `--cat-gray` | `#57534E` | `#A8A29E` |

### 1.2.1 Contêineres pastel (pedido do dono do app, 17/11/2026)

O pastel vai nas superfícies, nunca no texto: texto em pastel não passa de 4,5:1. Sobre os contêineres, o texto usa `textPrimary`, `textSecondary` e `danger`. A caixa de conclusão usa a cor da seção como borda (3:1 garantido).

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--primary-container` | `#E6DAF7` | `#4A3270` | botão flutuante, chip selecionado, indicador da aba, trilho do anel, cartão "Tudo feito" |
| `--cat-green-container` | `#DFF1E9` | `#1E362B` | cartão da seção |
| `--cat-blue-container` | `#DBE3F5` | `#1E2636` | cartão da seção |
| `--cat-teal-container` | `#DBF5F3` | `#1E3634` | cartão da seção |
| `--cat-orange-container` | `#F5E3DB` | `#36251E` | cartão da seção |
| `--cat-red-container` | `#F5DBDB` | `#361E1E` | cartão da seção |
| `--cat-yellow-container` | `#F5EADB` | `#362C1E` | cartão da seção |
| `--cat-brown-container` | `#F0E8E0` | `#362A1E` | cartão da seção |
| `--cat-gray-container` | `#EAE8E6` | `#2C2A28` | cartão da seção |
| `--divider-container` | `textPrimary` a 10% | `textPrimary` a 10% | divisória dentro do contêiner |

Contraste mínimo medido sobre os contêineres: claro `textPrimary` 13,1 · `textSecondary` 5,2 · `danger` 4,9 · cor da seção (borda da caixa) 4,1. Escuro `textPrimary` 11,3 · `textSecondary` 5,8 · `danger` 4,7 · cor da seção 5,6. `onPrimaryContainer` = `textPrimary` (13,3 claro / 7,3 escuro).

Conversão das cores antigas das seções (gravada em `corToken`, a cor antiga fica salva em `cor`):

| Antiga | Nova |
|---|---|
| `#2ecc71` | green |
| `#ff5c6c` | red |
| `#ff9f43` | orange |
| `#28c2ff` | teal |
| `#feca57` | yellow |
| `#9aa5b1` | gray |
| `#7c5cff` (roxo) | blue |
| `#f368e0` (rosa) | red |
| qualquer outra | gray |

### 1.3 Ajustes de contraste feitos

Conferido com a fórmula de luminância relativa da WCAG 2.1. Só a luminosidade mudou, o tom e a saturação foram mantidos (HSL).

| Token (claro) | Pedido | Final | Motivo |
|---|---|---|---|
| `priorityHigh` / cat `orange` | `#C2410C` | `#C0400C` | 4,43:1 sobre `surfaceVariant` → 4,51:1 |
| `priorityMedium` / cat `yellow` | `#A16207` | `#9A5E07` | 4,21:1 sobre `surfaceVariant` → 4,51:1 |
| cat `blue` | `#2563EB` | `#2261EB` | 4,42:1 sobre `surfaceVariant` → 4,51:1 |
| `borderStrong` (novo) | — | `#92876D` claro / `#767168` escuro | `border` dá 1,3:1, abaixo dos 3:1 exigidos para bordas de campo e controle. `border` continua só para bordas decorativas |

### 1.4 Contraste final (texto sobre background / surface / surfaceVariant)

Mínimo exigido: 4,5:1 para texto, 3:1 para ícones, bordas de campo e controles.

| Token | Claro | Escuro |
|---|---|---|
| `textPrimary` | 15.92 / 17.21 / 14.71 | 16.19 / 14.79 / 12.77 |
| `textSecondary` | 6.25 / 6.76 / 5.78 | 8.35 / 7.63 / 6.59 |
| `primary` | 6.83 / 7.38 / 6.31 | 8.81 / 8.05 / 6.95 |
| `danger` | 5.99 / 6.47 / 5.53 | 6.66 / 6.09 / 5.26 |
| `priorityHigh` | 4.88 / 5.28 / 4.51 | 7.85 / 7.18 / 6.20 |
| `priorityMedium` | 4.88 / 5.28 / 4.51 | 9.94 / 9.08 / 7.84 |
| `priorityLow` | 5.16 / 5.57 / 4.76 | 8.44 / 7.71 / 6.66 |
| cat `green` | 5.82 / 6.29 / 5.38 | 8.39 / 7.67 / 6.62 |
| cat `blue` | 4.89 / 5.28 / 4.51 | 7.61 / 6.96 / 6.01 |
| cat `teal` | 5.06 / 5.47 / 4.68 | 8.83 / 8.07 / 6.97 |
| cat `orange` | 4.88 / 5.28 / 4.51 | 7.85 / 7.18 / 6.20 |
| cat `red` | 5.99 / 6.47 / 5.53 | 6.66 / 6.09 / 5.26 |
| cat `yellow` | 4.88 / 5.28 / 4.51 | 9.94 / 9.08 / 7.84 |
| cat `brown` | 5.75 / 6.21 / 5.31 | 7.86 / 7.18 / 6.20 |
| cat `gray` | 7.06 / 7.63 / 6.52 | 7.31 / 6.68 / 5.77 |
| `onPrimary` sobre `primary` | 7.38 | 8.16 |
| `borderStrong` sobre background / surface / surfaceVariant | 3.29 / 3.55 / 3.04 | 3.80 / 3.47 / 3.00 |

### 1.4.1 Identidade roxa (versão 1.5.0)

Primitivas novas: `--p-purple-50` `#F1EAFB`, `--p-purple-100` `#E6DAF7`, `--p-purple-300` `#C3A6F0`, `--p-purple-600` `#6B3FA0`, `--p-purple-700` `#5A3388`, `--p-purple-800` `#4A3270`, `--p-purple-950` `#24123D`. As `--p-green-*` continuam, usadas pela categoria verde.

| Token | Claro (antes → agora) | Escuro (antes → agora) |
|---|---|---|
| `--primary` | `--p-green-600` → `--p-purple-600` | `--p-green-300` → `--p-purple-300` |
| `--on-primary` | `--p-white` (igual) | `--p-green-950` → `--p-purple-950` |
| `--primary-container` | `--p-green-100` → `--p-purple-100` | `--p-green-800` → `--p-purple-800` |
| `--snack-action` | `--p-green-300` → `--p-purple-300` | `--p-green-600` → `--p-purple-600` |

Não mudam: fundos e neutros, `--danger`, prioridades, as 8 categorias, o `theme-color` (areia `#F7F6F3` / `#141413`) e a conversão de `#7c5cff` para `blue` na importação.

Contraste WCAG 2.x medido (mínimo 4,5:1 para texto e 3:1 para borda, ícone e foco):

| Tema | Par | Cores | Contraste | Mínimo | Situação |
|---|---|---|---|---|---|
| claro | --primary sobre --background | `#6B3FA0` / `#F7F6F3` | 6,83:1 | 4,5:1 | ok |
| claro | --primary sobre --surface | `#6B3FA0` / `#FFFFFF` | 7,38:1 | 4,5:1 | ok |
| claro | --primary sobre --surface-variant | `#6B3FA0` / `#EFEDE8` | 6,31:1 | 4,5:1 | ok |
| claro | --on-primary sobre --primary | `#FFFFFF` / `#6B3FA0` | 7,38:1 | 4,5:1 | ok |
| claro | --text-primary sobre --primary-container | `#1C1B19` / `#E6DAF7` | 12,90:1 | 4,5:1 | ok |
| claro | --primary sobre --primary-container | `#6B3FA0` / `#E6DAF7` | 5,53:1 | 3:1 | ok |
| claro | --snack-action sobre o snackbar | `#C3A6F0` / `#1C1B19` | 8,22:1 | 4,5:1 | ok |
| escuro | --primary sobre --background | `#C3A6F0` / `#141413` | 8,81:1 | 4,5:1 | ok |
| escuro | --primary sobre --surface | `#C3A6F0` / `#1E1D1B` | 8,05:1 | 4,5:1 | ok |
| escuro | --primary sobre --surface-variant | `#C3A6F0` / `#2A2926` | 6,95:1 | 4,5:1 | ok |
| escuro | --on-primary sobre --primary | `#24123D` / `#C3A6F0` | 8,16:1 | 4,5:1 | ok |
| escuro | --text-primary sobre --primary-container | `#F2F0EB` / `#4A3270` | 9,31:1 | 4,5:1 | ok |
| escuro | --primary sobre --primary-container | `#C3A6F0` / `#4A3270` | 5,06:1 | 3:1 | ok |
| escuro | --snack-action sobre o snackbar | `#6B3FA0` / `#F2F0EB` | 6,48:1 | 4,5:1 | ok |

### 1.5 Regras

- Prioridade e situação nunca só pela cor: sempre há texto ou ícone junto.
- Texto colorido (`danger`, prioridades, categorias) só sobre `background`, `surface` ou `surfaceVariant`.
- Identidade roxa desde a versão 1.5.0 (decisão do dono do app, 18/11/2026). Categorias de seção continuam com as 8 cores, sem roxo.
- A cor festiva (`--festa-*`) só pinta decoração e partícula, nunca texto, botão, chave, aba ou foco, que continuam em `--primary`.

## 2. Tipografia

Fonte do sistema (Roboto no Android), sem download: `system-ui, Roboto, "Segoe UI", sans-serif`. Tamanhos em `rem` (1rem = 16sp) para seguir a escala de fonte do aparelho.

| Token | Uso | Tamanho/altura | Peso | Cor |
|---|---|---|---|---|
| `--type-title` | título da tela | 28/34 (1.75rem/2.125rem) | 600 | `textPrimary` |
| `--type-section` | seção e cabeçalho de dia | 16/22 (1rem/1.375rem) | 600 | `textSecondary` |
| `--type-body` | título da tarefa | 16/24 (1rem/1.5rem) | 400 | `textPrimary`; concluída: riscado + `textSecondary` |
| `--type-meta` | linha secundária | 13/18 (.8125rem/1.125rem) | 400 | `textSecondary` |
| `--type-label` | botão e rótulo | 14/20 (.875rem/1.25rem) | 500 | conforme o componente |
| `--type-number` | número grande (Progresso) | 34/40 (2.125rem/2.5rem) | 600 | `textPrimary` |

## 3. Espaçamento (escala de 4 dp)

| Token | Valor |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |

- Margem lateral da tela: `--space-4` (16 dp).
- Item da lista: altura mínima 56 dp, `--space-3` (12 dp) de espaço interno vertical.

## 4. Cantos, elevação e toque

| Token | Valor | Uso |
|---|---|---|
| `--radius-chip` | 8px | chips, caixa de conclusão (6px no desenho interno) |
| `--radius-card` | 12px | cartões, itens agrupados, campos, botões |
| `--radius-sheet` | 16px | topo da folha inferior |
| `--radius-fab` | 16px | botão flutuante |
| `--radius-full` | 999px | ponto de cor, trilho do anel |
| `--border-width` | 1px | todas as bordas |
| `--shadow-fab` | `0 8px 24px var(--sombra-cor)` | elementos flutuantes: botão flutuante, cartão de comemoração, menu de toque longo |
| `--shadow-sheet` | `0 -8px 24px var(--sombra-cor)` | folha inferior (mesma sombra, voltada para cima) |
| `--sombra-cor` | 12% de preto no claro, 40% no escuro | sombra estática, nunca animada; no máximo 3 níveis (fundo, cartão, flutuante) |
| `--scrim-folha` | `rgb(0 0 0 / .4)` | véu atrás da folha inferior |
| `--touch` | 48px | área mínima de tudo que é tocável |
| `--content-max` | 480px | coluna centralizada no computador e no tablet |
| `--alca-w` / `--alca-h` | 36px / 4px | alça da folha; `--zona-arrasto` 48px no topo da folha |
| `--mini-ring` / `--mini-stroke` | 24px / 3px | mini anel da faixa da semana |

- Elevação por borda de 1 dp (`border`) no lugar de sombra. Sombra só no botão flutuante e na folha inferior.

## 4.1 Movimento

Fonte única de toda duração e curva. CSS lê as variáveis; o JavaScript usa o objeto `MOV` de `animacoes.js`, com os mesmos valores. Nenhum `ms` ou `cubic-bezier` solto no código.

### Durações

| Token | Valor | Uso |
|---|---|---|
| `--dur-toque` | 100ms | resposta ao pressionar (escala, cor) |
| `--dur-rapida` | 160ms | alternar estados, check, chips, saída de elementos pequenos |
| `--dur-base` | 240ms | entrada de elementos, troca de aba, snackbar, saída da folha |
| `--dur-lenta` | 340ms | folha inferior, troca de dia, reorganizar lista (FLIP) |
| `--dur-comemoracao` | 1100ms | confete e comemoração do dia (única exceção ao limite de 400 ms) |
| `--dur-onda` | 400ms | onda do toque ao marcar e contagem dos números (limite da interface) |

- Saída ≈ 70% da entrada correspondente (folha: abre em 340 ms, fecha em 240 ms; elemento pequeno: entra em 240 ms, sai em 160 ms).
- Nenhuma animação de interface passa de 400 ms, fora as comemorações.

### Curvas

| Token | Valor | Uso |
|---|---|---|
| `--ease-saida` | `cubic-bezier(0.22, 1, 0.36, 1)` | entradas e respostas |
| `--ease-entrada` | `cubic-bezier(0.4, 0, 1, 1)` | saídas |
| `--ease-movimento` | `cubic-bezier(0.65, 0, 0.35, 1)` | elemento que muda de lugar (FLIP, troca de dia) |
| `--ease-mola` | ver abaixo; sem suporte a `linear()`, cai em `var(--ease-saida)` por `@supports` | folha, item que volta do gesto, indicador da aba, pulo do emoji, cartão de comemoração |

**Curva da mola** (rigidez 380, amortecimento 30, massa 1). Gerada por simulação física (passo de 0,25 ms), não por chute: fator de amortecimento 0,769, passa 2,2% do alvo e assenta (±0,1%) em 420 ms; amostrada em 25 pontos ao longo desse tempo. Usada com `--dur-lenta`, a mesma forma fica um pouco mais firme.

```
linear(0, 0.051 4.2%, 0.166 8.3%, 0.309 12.5%, 0.456 16.7%, 0.591 20.8%, 0.708 25%, 0.803 29.2%, 0.877 33.3%, 0.932 37.5%, 0.970 41.7%, 0.996 45.8%, 1.011 50%, 1.019 54.2%, 1.022 58.3%, 1.022 62.5%, 1.020 66.7%, 1.017 70.8%, 1.013 75%, 1.010 79.2%, 1.008 83.3%, 1.005 87.5%, 1.003 91.7%, 1.002 95.8%, 1)
```

### Durações extras

| Token | Valor | Uso |
|---|---|---|
| `--dur-periodo` | 600ms | troca do fundo do cabeçalho entre manhã, tarde e noite (opacidade) |
| `--dur-esqueleto` | 1200ms | brilho do esqueleto de carregamento (único loop permitido, só enquanto carrega) |
| `--dur-reduzida` | 120ms | troca de opacidade quando o movimento está reduzido |

### Constantes de comportamento (`MOV` em `animacoes.js`)

Espera antes de ir para Concluídas 350 ms · dica de gesto 800 ms de atraso, 700 ms de duração, 28 px · brilho da seção completa 500 ms · cartão de comemoração fecha em 2,5 s · 80 confetes · cascata de 30 ms, no máximo 8 itens · snackbar com Desfazer 5 s, aviso 2 s · gesto: trava de 8 px, limite de 40%, ou 0,5 px/ms depois de 15%, elástico depois de 60% com 30% do movimento.

### Regras

1. Só `transform` e `opacity`. Exceções: `stroke-dashoffset` dos anéis (SVG pequeno) e `background-color` em botões. Nunca `width`, `height`, `top`, `left`, `margin` nem `box-shadow`.
2. `will-change` só durante a animação.
3. Toda animação é interrompível: um toque novo nunca espera a anterior; a nova parte da posição atual (transições CSS retomam do valor corrente; na Web Animations API, `commitStyles()` + `cancel()` antes da próxima).
4. Cascata de entrada: 30 ms entre itens, no máximo 8 em cascata (o resto entra junto com o 8º). Só na primeira exibição de cada tela na sessão.
5. Dados antes da animação: a ação grava o estado e só depois anima.
6. **Reduzir movimento** (`prefers-reduced-motion: reduce` ou ajuste "Animações: Reduzidas"): deslocamento, escala e confete viram troca de opacidade de até 120 ms ou troca direta; gestos seguem o dedo, mas ao soltar o item vai direto ao destino; vibração e sons seguem os próprios ajustes.
7. Nada de animação em loop, fora o brilho do esqueleto enquanto carrega. Nada pisca mais de 3 vezes por segundo.

## 5. Ícones

Um conjunto só: **Material Icons** (Google, licença Apache 2.0), desenhados como SVG inline 24×24 com `fill: currentColor`. Os traços preenchido e vazado das abas (check_circle, event, insert_chart, settings) vieram do repositório oficial `google/material-design-icons`. Ícone sozinho sempre tem rótulo (`aria-label`). O emoji da seção é dado do usuário e continua.

## 6. Componentes (tokens de componente e estados)

| Componente | Tokens | Estados |
|---|---|---|
| Item de tarefa | `--item-bg: surface`, `--item-border: border`, `--item-radius: radius-card`, `--item-min-h: 56px`, `--item-pad-y: space-3` | normal; concluído (título riscado + `textSecondary`); pressionado (`surfaceVariant`); foco (contorno 2px `primary`) |
| Caixa de conclusão | `button` com `aria-pressed`, 24×24 visível, 48×48 de toque, borda 2px na cor da seção (ou `primary`), raio 6px | marcada: fundo preenche e o check é desenhado pelo traço em `--dur-rapida`; onda de 0,16 → 0 em 400 ms a partir do toque; risco do título cresce com `scaleX` em `--dur-base` |
| Cabeçalho de seção | `type-section`, `textSecondary`, altura 48 | recolhível: seta gira 180° |
| Chip | `--chip-bg: surfaceVariant`, `--chip-border: borderStrong`, `--chip-radius: radius-chip`, altura visível 32, toque 48 | selecionado: fundo `primaryContainer`, borda `primary`, texto `textPrimary` |
| Botão principal | `--btn-bg: primary`, `--btn-fg: onPrimary`, `radius-card`, altura 48, `type-label` | desabilitado: fundo `surfaceVariant`, texto `textSecondary` |
| Botão de texto | fundo transparente, texto `primary` (ou `danger`), altura 48 | pressionado: `surfaceVariant` |
| Botão flutuante | `--fab-bg: primaryContainer`, `--fab-fg: textPrimary`, `radius-fab`, altura 56, `shadow-fab`, ícone + "Nova tarefa" | pressionado: sombra menor |
| Snackbar | fundo `textPrimary`, texto `background`, ação `snackAction`, `radius-card`, 5 s, `role="status"` | entra de baixo em `--dur-base`; um novo substitui o anterior com animação, sem empilhar |
| Folha inferior | `surface`, topo `radius-sheet`, `shadow-sheet`, `scrim` atrás (até 40%) | sobe em `--dur-lenta` com `--ease-mola`; fecha em `--dur-base` com `--ease-entrada`; arrasta para baixo (fecha além de 30% ou 0,5 px/ms; elástico de 30% para cima) |
| Campo de texto | `surfaceVariant`, borda `borderStrong`, `radius-card`, altura 48 | foco: borda 2px `primary`; erro: borda e mensagem `danger` |
| Cartão | `surface`, borda `border`, `radius-card`, padding `space-4` | — |
| Anel de progresso | `--ring-size` 56×56, trilho `surfaceVariant`, arco `primary` com ponta arredondada, traço 5, percentual no centro | `stroke-dashoffset` em `--dur-lenta`; o número conta do valor antigo ao novo em 400 ms; some com total 0 |
| Cabeçalho da tela Hoje | degradê de `surface` para 8% de `priorityMedium` (manhã), 8% de `primary` (tarde) ou 10% de `priorityLow` (noite), cantos inferiores `radius-sheet` | troca de período por opacidade em `--dur-periodo`. Contraste do texto secundário sobre o fim do degradê: claro 6,07 / 6,03 / 5,91; escuro 6,54 / 6,63 / 6,36 |
| Cartão de seção | fundo pastel (`cat-*-container`, mantido por decisão do dono), borda de 1 px com 20% da cor da seção, emoji `--emoji-secao` (28 px) num círculo de 44 px com 14% da cor | seção completa: emoji 1 → 1,25 → 1 com `--ease-mola`; brilho de 25% atravessa o cartão em 500 ms |
| Barra do gráfico | `primary` (hoje) / `border-strong` com 40% de mistura (outros dias), raio 4 no topo, número em cima | zero: traço de 2px |
| Estado vazio | ilustração SVG original de 120 px (formas simples em `primaryContainer`, `surface`, `primary` e `priorityMedium`), título `type-section`, uma linha de apoio `textSecondary`, botão principal (verbo + objeto) | — |
| Esqueleto | blocos `surfaceVariant` com brilho de `surface` a 60% passando em `--dur-esqueleto` | com movimento reduzido, sem brilho |
| Menu de toque longo | `surface`, `radius-card`, `shadow-fab`, itens de 48 dp (Marcar/Desmarcar, Editar, Reordenar, Excluir em `danger`) | abre do ponto do toque: escala 0,92 → 1 e opacidade em `--dur-rapida` |
| Interruptor | trilho 52×32 `surfaceVariant` com borda `borderStrong`; ligado: `primary` com bolinha `onPrimary` | bolinha desliza com `--ease-mola` em `--dur-rapida` |
| Navegação inferior | `surface`, borda superior `border`, 4 destinos de 48+ dp | ativo: ícone preenchido e rótulo `textPrimary`; inativo: ícone vazado e `textSecondary` |
| Indicador de aba | pílula `primaryContainer` 64×32, raio `radius-full`, uma só para a barra | desliza até a aba tocada com `translateX` em `--dur-lenta` + `--ease-mola` |
| Faixa da semana | 7 dias (S T Q Q S S D + número + mini anel 24 px, traço 3), toque 48 dp, botão "Hoje" à direita | dia exibido: fundo `primary`, texto `onPrimary`; hoje: ponto embaixo; ≥50%: mini anel cheio em `primary`; futuro: `textSecondary` e sem toque |
| Cartão de comemoração | `surface`, `radius-sheet`, `shadow-sheet`, centrado, máx. `--dialog-max`, título `type-title`, linha `type-meta`, `aria-live="polite"` | entra com escala 0,9 → 1 e opacidade em `--dur-lenta` + `--ease-mola`; fecha em 2,5 s ou ao toque |
| Alça da folha | 36×4 dp, `border`, raio `radius-full`, área de arrasto de 48 dp no topo da folha | — |
| Barra do snackbar | 2 dp no rodapé do snackbar, `snackAction` | encolhe com `scaleX` 1 → 0 em 5 s, linear (contagem do Desfazer) |

### 6.1 Faculdade (aba nova)

Mesma arquitetura: os componentes abaixo só usam tokens que já existem. Nenhuma cor nova.

**Cor de nível de faltas (`--nv`, semântico local):** `ok` → `primary`; `atencao` → `priorityMedium`; `perigo` → `priorityHigh`; `ultima_chance` e `ultrapassado` → `danger`. Texto em `--nv` só sobre `surface`/`background` (contraste da tabela 1.4). O nível nunca aparece só pela cor: sempre há o percentual e o selo em texto.

| Componente | Tokens | Estados |
|---|---|---|
| Barra de faltas com marcas | trilho `surfaceVariant`, altura `space-2`, raio `radius-full`; preenchimento `--nv`; barra cheia = limite de faltas; duas marcas de 2 dp em `textSecondary` aos 60% e 80% do limite | preenche com `scaleX` em `--dur-lenta` + `--ease-saida`; passa do limite → fica cheia |
| Selo de nível | `type-meta` peso médio, texto `textPrimary`, fundo `--nv` a 14% sobre `surface`, borda `--nv` a 45%, ponto de 8 dp em `--nv`, raio `radius-full` | Em dia · Atenção · Perigo · Última chance · Reprovado por falta |
| Botões de presença | três botões de 48 dp em grade, `surfaceVariant`, `radius-chip`, `type-label`, `aria-pressed` | Presente: `primary`/`onPrimary`; Faltei: `danger`/`onDanger`; Sem aula: `textSecondary`/`surface`; pressionado: escala 0,97 em `--dur-toque` |
| Célula da grade | botão de 48 dp, `radius-chip`, `type-meta`, fundo `--cc` (contêiner da cor da matéria), borda `--c` a 30%; nome com reticências | vago: sem fundo, borda tracejada `borderStrong`, texto `textSecondary`; selecionada: anel 2 dp `primary`; tempo inexistente (5º da sexta): `surfaceVariant`, opacidade 0,5, desativado |
| Quadrado do calendário | alvo de 48 dp com quadrado visível de 40 dp, `radius-chip`, `type-meta` com números tabulares | presente: `--c`/`onPrimary`; falta: `danger`/`onDanger`; futuro: contorno `borderStrong`; sem aula: `surfaceVariant` riscado em `textSecondary`; sem marcação: `--cc` com borda tracejada `--c` |
| Miniatura de foto | quadrada (`aspect-ratio: 1`), mínimo 84 dp na grade da anotação e 53 dp na lista, `radius-chip`, fundo `surfaceVariant`, `object-fit: cover` | processando: indicador giratório (borda `borderStrong`, topo `primary`, `--dur-esqueleto` linear) |
| Visualizador de foto | tela cheia, fundo `p-night-950`, texto e ícones `p-white`, botões de 48 dp, áreas seguras respeitadas | abre/fecha por opacidade (`--dur-base`/`--dur-rapida`); pinça até 4x e arrastar quando ampliada; deslizar para os lados troca (limite 25% ou `GESTO.velocidade`), para baixo fecha; volta com `--ease-mola`; com movimento reduzido, só opacidade |
| Cartão de alerta de faltas | `card` com fundo `--nv` a 10% sobre `surface`, borda `--nv` a 45%, ícone de alerta em `--nv`, linhas de 48 dp em `textPrimary` | aparece na tela Hoje enquanto alguma matéria estiver em perigo ou acima |
| Diálogo de alerta | diálogo existente com ícone de alerta em `--nv` (`icon-lg`) acima do título | "Entendi" e "Ver matéria"; vários alertas entram em fila, do mais grave para o menos grave |

### 6.2 Datas comemorativas (versão 1.5.0)

**Arquitetura:** primitivas `--p-<festa>-1..4` (claro) e `--p-<festa>-1e..4e` (escuro) → semânticos `--festa-1..4`, trocados por `:root[data-festa="<id>"]` e repetidos nos dois seletores de modo escuro. Sem festa, `--festa-*` aponta para `--primary`. As cores festivas só pintam decoração e partícula; texto, botão, chave, aba e foco continuam em `--primary`.

**No auge:** `--background` recebe 4% de `--festa-1` sobre `--p-sand-50` (claro) ou 6% sobre `--p-night-950` (escuro). O `theme-color` não muda (usa as primitivas de fundo).

| Festa | `--festa-1` | `--festa-2` | `--festa-3` | `--festa-4` |
|---|---|---|---|---|
| Natal | `#C62828` / `#F28B82` | `#2E7D4F` / `#7FCB9A` | `#B8860B` / `#E8C468` | `#929292`* / `#F2F0EB` |
| Ano Novo | `#B8860B` / `#E8C468` | `#8A8F98` / `#C9CDD3` | `#6B3FA0` / `#C3A6F0` | `#1C1B19` / `#F2F0EB` |
| Carnaval | `#D6336C` / `#F48FB1` | `#1E88E5` / `#82B7F5` | `#BA8B00`* / `#F7D560` | `#27A569`* / `#7FD8A8` |
| Páscoa | `#CD8317`* / `#F3C77A` | `#559AC7`* / `#A9CCE6` | `#D175A4`* / `#ECB3CF` | `#6B4226` / `#C49A7A` |
| Namorados | `#D6336C` / `#F48FB1` | `#F06092`* / `#F7A8C4` | `#C2255C` / `#E6779F` | `#929292`* / `#F2F0EB` |
| Junina | `#E03131` / `#FF8787` | `#CA8300`* / `#FFC94D` | `#1C7ED6` / `#74B6F2` | `#2F9E44` / `#7BD389` |
| Halloween | `#E8590C` / `#FF922B` | `#1C1B19` / `#6C6961`* | `#6B3FA0` / `#C3A6F0` | `#CA8300`* / `#FFC94D` |
| Aniversário | `#6B3FA0` / `#C3A6F0` | `#CA8300`* / `#FFC94D` | `#1C7ED6` / `#74B6F2` | `#E64980` / `#F783AC` |

\* Ajuste de luminosidade (mesma matiz e saturação) para chegar a 3:1 contra o fundo onde a decoração aparece (`surface` `#FFFFFF` no claro, `#1E1D1B` no escuro). Valores originais e resultado: Natal-4 e Namorados-4 `#FFFFFF` → `#929292` (3,11:1); Carnaval-3 `#E0A800` → `#BA8B00` (3,10:1); Carnaval-4 `#2BB673` → `#27A569` (3,15:1); Páscoa-1 `#E9A23B` → `#CD8317` (3,06:1); Páscoa-2 `#7FB3D5` → `#559AC7` (3,07:1); Páscoa-3 `#D98CB3` → `#D175A4` (3,09:1); Namorados-2 `#F06595` → `#F06092` (3,09:1); Junina-2, Halloween-4 e Aniversário-2 `#F59F00` → `#CA8300` (3,11:1); Halloween-2 escuro `#2A2926` → `#6C6961` (3,07:1). As outras 52 cores já passavam de 3:1.

| Componente | Tokens | Estados |
|---|---|---|
| Chip de contagem (fase chegando) | pílula `surface`, borda `border`, `radius-full`, `type-label` peso médio em `textPrimary`, ícone de 24 dp da festa à esquerda | texto exato da especificação ("Faltam 15 dias para o Natal", "Falta 1 dia…"); a contagem está no texto, o ícone tem `aria-hidden` |
| Decoração do cabeçalho (auge) | SVG inline original, até 3 KB por festa, `aria-hidden`, `z-index` abaixo do texto; varal de luzes/bandeirinhas no topo (cabeçalho ganha `space-5` a mais em cima), enfeite de canto embaixo à direita, estrelas, confete e corações só na faixa de cima e no canto inferior direito | pisca-pisca só de opacidade (1 → 0,6) em 2,4 s, `--ease-movimento`, alternado e defasado (nunca mais que 3 vezes por segundo); parado com movimento reduzido |
| Saudação festiva | `h1` com a frase da festa; a saudação por horário desce para uma linha `type-label` `textSecondary` | o cabeçalho guarda em `data-desenho` período + saudação + dia + festa + fase e só redesenha quando isso muda |
| Cartão festivo | `card` com o desenho da festa (48 dp), título `type-section` `textPrimary`, botão de texto "Fechar" de 48 dp, `role="region"` "Data comemorativa" | em 31/12 mostra a contagem da virada (atualiza por minuto, sem `aria-live`); fechado, só volta no dia seguinte (`ajustes.festas.cartaoFechadoEm`) |
| Cartão de retrospectiva | `card` com título "Seu {ano} na rotina" e grade 2 × 2 de blocos `surfaceVariant`, número `type-title` com algarismos tabulares e rótulo `type-label` `textSecondary`, `role="region"` "Retrospectiva do ano" | números com a contagem animada existente (parada com movimento reduzido); "Fechar" grava `retrospectivaVista` |
| Folha "Escolher datas" | folha inferior com uma chave por festa (padrão do interruptor existente) e "Fechar" | Aniversário desativado (opacidade 0,55) com a dica "Informe seu aniversário para ativar" até existir data |
| Banner de prévia | fixo no topo, fundo `snackBg`, texto `snackFg`, botão "Sair da prévia" em `snackAction` com 48 dp, `role="status"`; o conteúdo desce enquanto ele aparece | some ao tocar em "Sair da prévia" ou depois de 30 s; não grava nada |
| Partículas | canvas existente (`Animacoes.confete`) com forma por festa (floco, faísca, ovo, coração, bandeirinha, morcego; confete retangular no Carnaval e no aniversário) e cores `--festa-1..4`; fogos com `Animacoes.faiscas` (até 60 por explosão, 1,4 s) | efeito ambiente (neve, confete, corações) com até 24 partículas por 8 s, uma vez por abertura, só `transform` e `opacity`, para quando a aba fica oculta; nada disso com movimento reduzido |

### 6.3 Árvore, Folhinha, abertura e widgets (versão 1.6.0)

**Árvore — tokens.** Primitivas `--p-arvore-*` (claro) e `--p-arvore-*-e` (escuro) → semânticos `--arvore-tronco`, `--arvore-folha-1..3`, `--arvore-flor`, `--arvore-fruto`, `--arvore-terra`, repetidos nos dois seletores de modo escuro. A flor usa `--primary` no claro (a identidade roxa continua) e `#7A45C8` no escuro: o `--primary` escuro (`#C3A6F0`) ficava com 1,29:1 sobre as folhas claras; `#7A45C8` dá 3,68:1. O verde é só da árvore: não pinta texto, botão nem foco.

| Token | Claro | Escuro | Uso e contraste |
|---|---|---|---|
| `--arvore-tronco` | `#7C5A3A` | `#C9A27E` | tronco e galhos; 6,21:1 / 7,18:1 contra `surface` |
| `--arvore-folha-1` | `#2E7D4F` | `#7FCB9A` | folhas e quadrado "ganhou" dos 30 dias; 5,05:1 / 8,75:1 contra `surface` |
| `--arvore-folha-2` | `#4C9A63` | `#9BD9AE` | folhas |
| `--arvore-folha-3` | `#6DB07A` | `#B6E5C2` | folhas |
| `--arvore-fruto` | `#E8590C` | `#FF922B` | frutos (estágio 8 em diante) |
| `--arvore-terra` | `#B8A88A` | `#5A5146` | elipse do chão |

**Árvore — desenho.** SVG inline original (`viewBox 0 0 200 220`), 10 esqueletos e uma copa por estágio. As folhas ficam numa espiral de Vogel com capacidade por estágio (no máximo 120 desenhadas); flores (12, estágio 7+) e frutos (9, estágio 8+) têm espiral própria. `role="img"` com `aria-label` "Sua árvore: {estágio}, {n} folhas". Luzinhas só no auge do Natal.

| Componente | Tokens | Estados |
|---|---|---|
| Cartão da árvore (Progresso) | `card`, palco de 240 px, nome do estágio `type-title`, "{n} folhas" `type-label` `textSecondary` com algarismos tabulares, `bar` em `--arvore-folha-1`, dicas `hint` | "Faltam {k} folhas para {próximo}" ou "Estágio máximo"; 30 quadrados em 15 colunas (`--arvore-folha-1` ganhou, `surfaceVariant` sem mudança, `danger` perdeu), cada um com `title` e `aria-label` |
| Linha da árvore (Hoje) | botão pílula alinhado à direita sob o cabeçalho, árvore de 32 px, `type-meta` `textSecondary`, alvo de 48 dp | abre Progresso |
| Folha nova | `scale` 0 → 1 com `--ease-mola` em `--dur-lenta` | movimento reduzido: só opacidade em `--dur-reduzida` |
| Subir de estágio | esqueleto em crossfade de 400 ms; folhas em cascata de no máximo 20 ms cada, 600 ms no total | movimento reduzido: só opacidade |
| Folha caindo | cópia da folha cai 150 px com giro e balanço em 1,2 s, `fill: forwards`, removida no fim; uma vez por evento | movimento reduzido: some com opacidade |

**Folhinha.** Personagem original em SVG (`viewBox 0 0 64 64`): folha com rosto, cabinho e broto. Fica fixa embaixo à esquerda, alinhada à coluna de 480 px, acima da navegação; tamanho `touch + space-2` (56 dp), `z-index` 6, sombra `drop-shadow` com `--sombra-cor`.

| Estado | Visual |
|---|---|
| `parada` | balanço do cabinho ±4° em 3 s, alternado, `--ease-movimento`; pisca a cada 4–7 s (140 ms) |
| `falando` | boca alterna aberta/fechada a cada 0,26 s enquanto o texto aparece (600 ms) |
| `triste` | boca para baixo, pupilas e corpo descem 2 px |
| `comemorando` | olhos fechados de alegria, pulinho de 8 px e broto girando 360° |

- **Balão:** `surface`, `radius-card`, `shadow-fab`, até 280 px, seta para a Folhinha, texto `type-body`, "Entendi" de 48 dp. Fecha sozinho em 6 s, salvo quando fixo. O leitor de tela recebe o texto inteiro por `role="status"`; o texto digitado fica com `aria-hidden`.
- **Some** com folha ou diálogo abertos, snackbar visível, teclado aberto e durante a abertura. Com movimento reduzido não balança, não fala animado e não pula. Pausa quando a aba fica oculta.
- **Conteúdo:** dica na primeira visita de cada aba e no máximo uma aparição espontânea por dia (`ajustes.folhinha.ultimaAparicao`). As dicas ao tocar seguem em sequência (`proximaDica`) e pulam as que não valem (widget só no APK; anotação só com a Faculdade visível). As reações da árvore juntam vários dias de perda numa linha; quando ganha e sobe juntos, mostra só que subiu. Com "Mostrar a Folhinha" desligado, as reações viram snackbar.

**Abertura.** Tela cheia sobre o app (`z-index` 8: as folhas do assistente e de "Escolher datas" ficam por cima), coluna de 480 px em 4 faixas:
1. topo com "Voltar" e a barra "Passo X de 10" (8 no PWA, sem os passos 6 e 9);
2. conteúdo rolável com título `type-title`;
3. Folhinha com balão;
4. rodapé com botão principal e "Pular".

O rodapé sobe com `--teclado`, e a fala some com o teclado aberto. Avanço com deslize horizontal (25% da largura ou velocidade de gesto). Conteúdo entra deslizando 24 px na direção do passo, em `--dur-base`. Cada avanço grava `ajustes.abertura.passo`, então a abertura retoma de onde parou. Os cartões de modelo usam a cor da seção (`--c` / `--cc`), com itens e dias em chips. Ao rever pelos Ajustes, aparece um botão "Fechar".

**Novidades (quem já usa).** Folha inferior com a Folhinha comemorando, a árvore atual e só o que falta (aniversário, "Você faz faculdade?", widgets no APK). Grava `novidadesVistas = "1.6.0"` ao abrir, para não insistir.

**Widgets (APK).** Fundo `#FFFFFF` / `#1E1D1B` com cantos `system_app_widget_background_radius` no Android 12+ e 16 dp antes. Texto `#1C1B19` (17,21:1) e `#5F5B53` (6,76:1) no claro; `#F2F0EB` (14,79:1) e `#B3AEA4` (7,63:1) no escuro. Check `#6B3FA0` / `#C3A6F0`.

| Nível de faltas | Claro | Escuro |
|---|---|---|
| `ok` | `#6B3FA0` (7,38:1) | `#C3A6F0` (8,05:1) |
| `atencao` | `#9A5E07` (5,28:1) | `#E6B84A` (9,08:1) |
| `perigo` | `#C0400C` (5,28:1) | `#FB8B5B` (7,18:1) |
| `ultima_chance` / `ultrapassado` | `#B91C1C` (6,47:1) | `#F87171` (6,09:1) |

| Widget | Tamanho | Conteúdo |
|---|---|---|
| Árvore | 2×2 até 4×3 | vetor `arvore_estagio_{n}`, estágio, "{pct}% hoje", "Sequência: {d} dias"; toque abre Progresso |
| Hoje | 4×2 até 4×5 | "Hoje · {feitos} de {total}" e lista de até 30 itens com check de 48 dp; tocar marca sem abrir o app |
| Próxima aula | 4×1 até 4×2 | "{dia}, {tempos} · {matéria} · {sala}" e "Faltas: {pct}" na cor do nível |

Os três mostram "Abra o app para atualizar" quando o retrato tem mais de 7 dias. Nada sai do aparelho: o app publica um retrato local (`SharedPreferences rotina_widget`) e lê as marcações do widget como pendências, aplicadas pelo `em` e de forma idempotente.
