---
marp: true
theme: default
paginate: true
header: 'TFTEC Masters — App Registration'
footer: '🔐 AuthService demo • hands-on.md no GitHub'
style: |
  section { font-size: 24px; }
  h1 { color: #0078d4; }
  h2 { color: #1e3a5f; }
  code { background: #f3f3f3; padding: 2px 6px; border-radius: 3px; }
  table { font-size: 19px; }
  .badge-good { background: #065f46; color: white; padding: 2px 8px; border-radius: 4px; }
  .badge-bad { background: #7c2d12; color: white; padding: 2px 8px; border-radius: 4px; }
  .badge-info { background: #1e3a5f; color: white; padding: 2px 8px; border-radius: 4px; }
---

<!-- _class: lead -->

# 🔐 App Registration na prática

## Da teoria ao código — usando `tftec-auth` como laboratório

**TFTEC Masters**
Guilherme Campos

<!--
Slide 1 — Cover (0-30s)
Abertura curta. Não vende, provoca.
Próximo: Hook adversarial com AADSTS.
-->

---

# 🪝 Quem aqui já viu isso?

```
AADSTS50011: The redirect URI specified in the request
does not match the redirect URIs configured for the application.
```

**Levanta a mão quem já apanhou.**

<!--
Slide 2 — Hook (30s-1:30)
Espera mãos. 70%+ devem subir.
Provocações:
  - "Quem nunca conseguiu login Microsoft e xingou o Azure?"
  - "Quem teve que pedir socorro pro DevOps?"
Próximo: tabela de outros AADSTS comuns.
-->

---

# Outros velhos conhecidos…

| Erro | Significado |
|------|-------------|
| `AADSTS65001` | User/admin consent required |
| `AADSTS7000215` | Invalid client secret |
| `AADSTS90002` | Tenant not found |
| `AADSTS50158` | MFA required (Conditional Access) |
| `AADSTS7000229` | Missing service principal (multi-tenant) |

> Esses 5 + redirect URI = 90% dos AADSTS que vc vai encontrar.

<!--
Slide 3 — Validation (1:30-2:30)
"Cada um tem causa rastreável dentro de App Registration."
"Hoje vc sai diagnosticando em 30 segundos."
-->

---

# O que você vai sair sabendo

✅ Criar uma App Reg do zero (multi-tenant, SPA + API)
✅ Configurar redirect URIs, App ID URI, scopes
✅ Decodificar JWT real e entender cada claim
✅ Atribuir App Roles e diferenciar `scp` vs `roles`
✅ Escolher credencial certa (Secret / Cert / FIC / MI)
✅ Diagnosticar AADSTS em ≤ 30 segundos

> 📚 **Estrutura:** 8 blocos · 2 horas · hands-on dirigido pelo `hands-on.md`

<!--
Slide 4 — Promise (2:30-3:30)
Promessa concreta. Aluno sente investimento valendo a pena.
-->

---

# Mapa da aula

| # | Bloco | Min | Hands-on cap |
|---|-------|----:|--------------|
| 1 | Abertura (este slide) | 5 | — |
| 2 | Quadro mental + tipos de app | 10 | Cap 0 + Cap 1 |
| 3 | Criar App Reg ao vivo | 15 | Cap 2 |
| 4 | URLs + Tokens (quebra deliberada) | 20 | Cap 3 + Cap 4 |
| 5 | Permissions + Credenciais | 20 | Cap 5 + Cap 6 |
| 6 | Multi-tenant + integrar no código | 20 | Cap 7 + Cap 8 |
| 7 | Debug AADSTS LIVE (adversarial) | 15 | Cap 9 |
| 8 | Síntese + Q&A | 15 | Apêndices |

<!--
Slide 5 — Mapa (3:30-4:30)
"50% hands-on, 50% eu narrando."
"Quem ainda não clonou o repo: 1 minuto."
-->

---

# 🚀 Pra continuar: abra o `hands-on.md`

## `github.com/tftec-guilherme/entra-auth-gateway` → `docs/aula/hands-on.md`

**Próximos 115 minutos:** eu narro, você executa.

- `hands-on.md` é a espinha dorsal — 10 capítulos, checkpoints em cada um
- Conceitos detalhados: [glossário](./glossario.md)
- Comandos `az`: [cheat-sheet](./cheat-sheet.md)
- "E se...?": [FAQ](./perguntas-frequentes.md)

> 🌱 **Repo é vivo.** PR aceito = teu nome em contributors.

<!--
Slide 6 — Handoff (4:30-5:00)
Projeta QR code do repo se possível.
"Confirma que `npm run dev` funciona antes do Bloco 2."
Transição: "Bloco 2 começa agora — quadro mental."

A partir daqui NÃO TEM MAIS SLIDE. Tudo é hands-on + portal + IDE.
Roteiro detalhado em docs/playbook/roteiro-aula.md.
-->
