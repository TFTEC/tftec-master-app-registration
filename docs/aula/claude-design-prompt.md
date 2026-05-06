# 🎨 Prompts Claude Design — Gerar Apresentação Visual

> Prompts drop-in pra gerar a apresentação visual do `slides.md` no Claude (artifacts) ou tools similares (Gamma, Beautiful.ai, Tome).

---

## 📋 Como usar

1. **Abre** [claude.ai](https://claude.ai) (Sonnet 4.5+ ou Opus 4.7+)
2. **Cola** o conteúdo de `docs/aula/slides.md` na conversa
3. **Cola** um dos prompts abaixo
4. Claude gera **artifact HTML/React** com a apresentação
5. **Refina** pedindo ajustes específicos por slide

---

## 🎯 Prompt FULL (recomendado — controle máximo)

```
Você é um designer especialista em apresentações técnicas didáticas.

CONTEXTO
========
Estou ministrando uma aula presencial de 2 horas para o programa TFTEC Masters
sobre "App Registration no Microsoft Entra ID". A audiência são desenvolvedores
intermediários brasileiros, em sua maioria com experiência em backend mas pouca
em IAM/identity management.

OBJETIVO
========
Transformar o markdown Marp anexado (slides.md, 34 slides em 8 cenas) em uma
apresentação visual profissional, projetável em sala (1920×1080), entregue como
artifact HTML/React que eu possa exibir em fullscreen via browser.

REQUISITOS VISUAIS
==================
- **Tema:** Dark mode com acentos azuis Microsoft (#0078d4, #1e3a5f) e
  detalhes em laranja (#f97316) para CTAs
- **Tipografia:** sans-serif limpa (Inter, Segoe UI, ou system-ui).
  Tamanho mínimo de TEXTO em slides: 22pt. Títulos: 36-48pt.
- **Hierarquia visual:** H1 grande e colorido, H2 secundário, body em cinza claro
  para reduzir glare
- **Layout:** padding generoso (40-60px), respiração entre elementos
- **Animações:** sutis, não-distrativas. Apenas transições entre slides
  (fade ou slide horizontal)

ELEMENTOS ESPECÍFICOS POR TIPO DE SLIDE
========================================
1. **Slides "lead" (`<!-- _class: lead -->`):**
   Fundo escuro completo, título centralizado e MAIOR (54pt+), subtítulo abaixo.
   Sem footer. Use como dividers entre cenas.

2. **Slides com tabelas:**
   Tabelas com bordas sutis, header destacado em fundo azul-escuro.
   Linha alternada (zebra) com transparência baixa para leitura confortável.
   Texto da tabela em 18-20pt.

3. **Slides com código:**
   Code blocks com syntax highlighting (estilo Dracula ou Tokyo Night).
   Padding generoso, font monospace clara (Fira Code, JetBrains Mono).
   Highlight ativo em linhas críticas.

4. **Slides com Mermaid sequence diagrams:**
   Renderiza os diagramas Mermaid (não placeholders). Cores combinando
   com o tema dark. Setas grossas e atores destacados.

5. **Speaker notes (`<!-- ... -->`):**
   PRESERVA todas as speaker notes em formato acessível.
   Idealmente: panel separado ou tooltip ao hover. NÃO renderiza no slide.

6. **Listas de bullets:**
   Ícones lucide-react (✅ ❌ ⚠️ 🔴 🟡 🟢) com cor destacada.
   Espaçamento confortável (line-height 1.6).

7. **Slide de capa (slide 1):**
   Composição visual: gradiente azul-roxo no fundo, título com
   wave underline, ícone de cadeado discreto, autor + data no canto inferior.

8. **Slide de fechamento (Obrigado!):**
   Centralizado, large emoji (🎓), URL repo destacada, citação em itálico.

OUTPUT FORMAT
=============
Entrega como artifact React com:
- Componente único `Presentation`
- Navegação: setas teclado (←/→), espaço, ESC pra sair fullscreen
- Indicador de progresso no rodapé (slide N/total)
- Botão de "presenter mode" que mostra speaker notes
- Responsive 16:9 (escala se janela menor)
- Tailwind CSS pra estilos
- Sem dependências externas além de React, Tailwind, e lucide-react icons
- Mermaid renderizado via mermaid-js (CDN ok)

EVITA
=====
- Stock photos genéricas
- Animações exageradas (parallax, scroll-jack, etc.)
- Mais de 3 cores além da paleta principal
- Fontes script ou decorativas
- Background patterns chamativos

ATENÇÃO ESPECIAL
================
- O tópico é técnico — diagrams e code blocks são CRÍTICOS, não decorativos.
- Fonte monospace pra qualquer claim, código, ou ID Azure.
- Mantém TODOS os 34 slides — não combina/reduz.
- Speaker notes devem ser acessíveis em "presenter mode" toggle.

Pode começar gerando os primeiros 5 slides (cobertura + Cena 1 Hook + abertura
Cena 2). Se ficar bom, eu peço pra continuar com o restante.
```

---

## ⚡ Prompt QUICK (resultado rápido, menos controle)

```
Pega esse markdown Marp e transforma numa apresentação React fullscreen
(artifact). Tema: dark mode azul/laranja Microsoft, fonte Inter, 16:9,
navegação por setas, presenter mode com speaker notes (extraídas dos
<!-- _notes -->). Renderiza Mermaid diagrams. 34 slides.

[anexa slides.md aqui]

Começa gerando os 5 primeiros pra eu validar, depois os 29 restantes.
```

---

## 🔄 Prompt ITERATIVO (refinement turn-by-turn)

### Turn 1 — base
```
Lê esse markdown Marp [anexa slides.md] e me diz:
1. Quantos slides tem
2. Que tipos de elementos visuais aparecem (tabela, código, Mermaid, etc.)
3. Sugira uma identidade visual unificada (paleta, tipografia, layout)
NÃO gera slides ainda.
```

### Turn 2 — aprovação visual
```
Aprovado. Agora gera só o slide de capa + Slide 2 (Hook AADSTS50011)
em React + Tailwind como artifact. Vou validar e ajustar antes
de seguir.
```

### Turn 3 — feedback + scale
```
Bom! Ajusta:
- Fonte do código pra JetBrains Mono
- Footer com pagination "1/34"
- Slide 2 mais espaçoso

Depois gera os slides 3 a 8 (Cena 1 + Big Picture).
```

### Turn 4..N — completa por blocos
```
Continue: slides 9 a 15 (Cena 3 First Aha + Cena 4 Lab 1 setup).
```

---

## 🎬 Prompts Alternativos (outras tools)

### Gamma.app (auto-gera)
```
Generate a 30-slide presentation for a technical workshop on Microsoft
App Registration / Entra ID. Audience: intermediate Brazilian developers.
Duration: 2 hours. Theme: dark mode Microsoft blue. Include code blocks,
sequence diagrams, comparison tables. Match the structure of attached
slides.md (8 scenes: Hook, Big Picture, Live Demo, Hands-On Lab 1, Deep
Dive, Hands-On Lab 2, Troubleshooting, Q&A).
```

### Beautiful.ai (template-driven)
```
Use template "Workshop Technical" with dark theme. Convert this Marp
markdown to slides preserving:
- Tables (use Beautiful's table component)
- Code blocks (with syntax highlight)
- Mermaid diagrams (render via beautiful's diagram tool)
- Speaker notes (mirror exactly)
[paste slides.md]
```

### PowerPoint via Office Copilot
```
Office Copilot prompt:
"Create PowerPoint from this markdown file: [paste]. Use Microsoft
template, dark theme, presenter notes section. Include all Mermaid
diagrams as images. Slide ratio 16:9."
```

---

## 🎨 Prompts de Refinamento (após gerar v1)

Use estes pra ajustar:

### Tipografia
```
A fonte do body tá pequena pra projetor. Aumenta pra 24pt mínimo,
e títulos pra 48pt. Mantém line-height confortável.
```

### Cores
```
O laranja tá saturado demais. Usa #f97316 com opacidade 80% nos
acentos. Background mais escuro (#0a0a0f).
```

### Mermaid
```
Os diagramas Mermaid não estão renderizando — só vejo o código.
Adiciona mermaid via CDN e auto-render no useEffect.
```

### Speaker mode
```
Adiciona um toggle "Presenter Mode" no canto inferior direito.
Quando ativado, mostra speaker notes em painel inferior 30%
da tela, com texto maior (18pt).
```

### Acessibilidade
```
Adiciona contraste WCAG AA mínimo. Verifica pares texto/fundo.
Adiciona aria-labels nos elementos interativos.
```

### Print/PDF
```
Adiciona modo de impressão: Ctrl+P deve gerar PDF com 1 slide
por página, sem header/footer da apresentação web.
```

---

## ✅ Checklist Pós-geração

Antes de usar na aula, valida:

- [ ] Todos os 34 slides estão presentes
- [ ] Mermaid diagrams renderizam (não só código bruto)
- [ ] Code blocks com syntax highlighting
- [ ] Tabelas legíveis a 3m de distância
- [ ] Navegação por setas + espaço funciona
- [ ] Presenter mode mostra speaker notes
- [ ] Fullscreen (F11) sem cropping
- [ ] Resolução 1920×1080 OK
- [ ] Carrega em < 2s
- [ ] Sem console errors

---

## 🆘 Troubleshooting do Claude Design

| Problema | Fix |
|----------|-----|
| Claude reduz/combina slides | "NÃO REDUZA. Quero TODOS os 34 slides exatos." |
| Mermaid não renderiza | "Adiciona `import mermaid from 'mermaid'` + `mermaid.initialize`" |
| Speaker notes desaparecem | "Preserva os `<!-- _notes -->` em painel separado" |
| Output é HTML estático (não React) | "Quero como React artifact, não HTML puro" |
| Fonts não carregam | "Usa system fonts (Segoe UI, sans-serif) como fallback" |
| Mobile responsive quebrado | "Foco em 1920×1080 desktop. Mobile é nice-to-have" |

---

## 📚 Referências

- Markdown source: `docs/aula/slides.md` (34 slides, 8 cenas)
- Speaker script: `docs/playbook/demo-class.md`
- FAQ pra Q&A: `docs/aula/perguntas-frequentes.md`
- Cheat sheet: `docs/aula/cheat-sheet.md`

---

**💡 Dica final:** Se o Claude começar a inventar conteúdo NOVO ao gerar (em vez de seguir o markdown), corta e reinicia com instrução explícita:

> "USE EXCLUSIVAMENTE o conteúdo do markdown anexado. NÃO ADICIONE slides novos. NÃO REESCREVA o texto. Apenas converte pra visual."
