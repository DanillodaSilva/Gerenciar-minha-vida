# DESIGN.md — Minha Rotina

Fonte única de verdade do visual. Todo valor de cor, tamanho, espaçamento, canto, sombra e duração usado em `index.html` vem daqui, como variável CSS. Nenhum componente usa valor solto.

- Produto: app de rotina e tarefas do dia, offline, instalado pelo Chrome (PWA).
- Público: quem anota o dia no celular e quer ver rápido o que falta.
- Ação principal: **Nova tarefa** (botão flutuante). Secundária: concluir tarefa.
- Base: Material 3 com cores próprias. Cor semente `#2F6B4F`. **Sem roxo ou lavanda em nenhum lugar.**
- Idioma: pt-BR.

## Arquitetura dos tokens

```
Primitivo  (valor bruto, nunca usado direto em componente)   --p-green-600: #2F6B4F
   ↓
Semântico  (função, muda entre claro e escuro)               --primary: var(--p-green-600)
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
| `--primary` | `#2F6B4F` | `#6FBF95` | ação principal, seleção, anel, barra de hoje |
| `--on-primary` | `#FFFFFF` | `#0E2A1C` | texto e ícone sobre `--primary` |
| `--danger` | `#B91C1C` | `#F87171` | excluir, erro, horário passado |
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
| `--primary-container` | `#C2EBD8` | `#2E5644` | botão flutuante, chip selecionado, indicador da aba, trilho do anel, cartão "Tudo feito" |
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
| `primary` | 5.82 / 6.29 / 5.38 | 8.39 / 7.67 / 6.62 |
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
| `onPrimary` sobre `primary` | 6.29 | 7.00 |
| `borderStrong` sobre background / surface / surfaceVariant | 3.29 / 3.55 / 3.04 | 3.80 / 3.47 / 3.00 |

### 1.5 Regras

- Prioridade e situação nunca só pela cor: sempre há texto ou ícone junto.
- Texto colorido (`danger`, prioridades, categorias) só sobre `background`, `surface` ou `surfaceVariant`.
- Proibido roxo ou lavanda, inclusive tons padrão do Material.

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

## 4. Cantos, elevação, toque e movimento

| Token | Valor | Uso |
|---|---|---|
| `--radius-chip` | 8px | chips, caixa de conclusão (6px no desenho interno) |
| `--radius-card` | 12px | cartões, itens agrupados, campos, botões |
| `--radius-sheet` | 16px | topo da folha inferior |
| `--radius-fab` | 16px | botão flutuante |
| `--radius-full` | 999px | ponto de cor, trilho do anel |
| `--border-width` | 1px | todas as bordas |
| `--shadow-fab` | `0 3px 8px rgb(0 0 0 / .18), 0 1px 3px rgb(0 0 0 / .12)` | só botão flutuante |
| `--shadow-sheet` | `0 -4px 16px rgb(0 0 0 / .16)` | só folha inferior |
| `--touch` | 48px | área mínima de tudo que é tocável |
| `--dur-fast` | 150ms | estados, chips |
| `--dur-check` | 200ms | animação do check |
| `--dur-move` | 250ms | item descendo, folha, snackbar |
| `--ease-out` | `cubic-bezier(.2, 0, 0, 1)` | todas as transições |

- Elevação por borda de 1 dp (`border`) no lugar de sombra. Sombra só no botão flutuante e na folha inferior.
- Nada de animação em loop.
- Com `prefers-reduced-motion: reduce` (Android: "Remover animações"), todas as durações viram 0 e os movimentos viram troca direta.

## 5. Ícones

Um conjunto só: **Material Icons**, desenhados como SVG inline 24×24 com `fill: currentColor`. Ícone sozinho sempre tem rótulo (`aria-label`). O emoji da seção é dado do usuário e continua.

## 6. Componentes (tokens de componente e estados)

| Componente | Tokens | Estados |
|---|---|---|
| Item de tarefa | `--item-bg: surface`, `--item-border: border`, `--item-radius: radius-card`, `--item-min-h: 56px`, `--item-pad-y: space-3` | normal; concluído (título riscado + `textSecondary`); pressionado (`surfaceVariant`); foco (contorno 2px `primary`) |
| Caixa de conclusão | 24×24 visível, 48×48 de toque, borda 2px na cor da seção (ou `primary`), raio 6px | marcada: fundo `primary` (ou cor da seção), check `onPrimary`, 200 ms |
| Cabeçalho de seção | `type-section`, `textSecondary`, altura 48 | recolhível: seta gira 180° |
| Chip | `--chip-bg: surfaceVariant`, `--chip-border: borderStrong`, `--chip-radius: radius-chip`, altura visível 32, toque 48 | selecionado: fundo `primaryContainer`, borda `primary`, texto `textPrimary` |
| Botão principal | `--btn-bg: primary`, `--btn-fg: onPrimary`, `radius-card`, altura 48, `type-label` | desabilitado: fundo `surfaceVariant`, texto `textSecondary` |
| Botão de texto | fundo transparente, texto `primary` (ou `danger`), altura 48 | pressionado: `surfaceVariant` |
| Botão flutuante | `--fab-bg: primaryContainer`, `--fab-fg: textPrimary`, `radius-fab`, altura 56, `shadow-fab`, ícone + "Nova tarefa" | pressionado: sombra menor |
| Snackbar | fundo `textPrimary`, texto `background`, ação `primary` invertido, `radius-card`, 5 s | entra de baixo em 250 ms |
| Folha inferior | `surface`, topo `radius-sheet`, `shadow-sheet`, `scrim` atrás | sobe em 250 ms |
| Campo de texto | `surfaceVariant`, borda `borderStrong`, `radius-card`, altura 48 | foco: borda 2px `primary`; erro: borda e mensagem `danger` |
| Cartão | `surface`, borda `border`, `radius-card`, padding `space-4` | — |
| Anel de progresso | 48×48, trilho `primaryContainer`, arco `primary`, traço 5 | some com total 0 |
| Barra do gráfico | `primary` (hoje) / `border-strong` com 40% de mistura (outros dias), raio 4 no topo, número em cima | zero: traço de 2px |
| Estado vazio | ícone 48 `textSecondary`, texto `type-body`, botão principal | — |
| Navegação inferior | `surface`, borda superior `border`, 4 destinos de 48+ dp, indicador `primaryContainer` atrás do ícone ativo | ativo: ícone e rótulo `textPrimary`; inativo: `textSecondary` |
