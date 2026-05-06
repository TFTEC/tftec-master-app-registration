# 🗺️ Roadmap Avançado — Próximos Passos após App Registration

> Você dominou App Registration. **E agora?** Esses são os próximos tópicos pra dominar identity & access management na Microsoft.

---

## 🎯 Como ler este roadmap

Cada tópico tem:
- 🎓 **Pré-requisito** — o que vc precisa saber antes
- 💡 **Por quê importa** — qual problema real resolve
- 📚 **Como estudar** — link oficial + exercício prático
- ⏱️ **Investimento** — tempo estimado pra ficar confortável

---

## 1️⃣ Conditional Access — Restringir login por contexto

🎓 **Pré-req:** App Registration ✅ + entender claims básico

💡 **Por quê:** Permitir login só em situações seguras: durante horário comercial, do escritório, em devices gerenciados, com MFA. Bloqueia 99% dos ataques de credential stuffing.

📚 **Estudar:**
- Doc oficial: https://learn.microsoft.com/entra/identity/conditional-access/
- **Exercício prático:** Criar policy "Block login fora do Brasil para SP de produção" no `tftec-auth`
- Lab: ativar policy em modo "Report-only" antes de "Enabled" pra ver impacto

⏱️ **2 semanas** — política simples em 1 dia, mas avaliar todos os edge cases (break glass accounts, emergency access) leva tempo.

---

## 2️⃣ Authentication Methods Policy — MFA moderno (FIDO2, passkeys, TOTP)

🎓 **Pré-req:** Conditional Access (#1)

💡 **Por quê:** SMS-OTP é fraco (SIM swap). Authenticator app é OK. **FIDO2 (passkeys) é o futuro** — phishing-resistant. Configurar a política certa = reduzir 90%+ dos ataques de identity.

📚 **Estudar:**
- Doc: https://learn.microsoft.com/entra/identity/authentication/concept-authentication-methods
- **Exercício prático:** Habilitar passkeys (FIDO2) pro tenant TFTEC + testar com YubiKey ou Windows Hello

⏱️ **1 semana** — configuração rápida, mas migração de users existentes (de SMS pra FIDO2) leva meses.

---

## 3️⃣ Workload Identity Federation (OIDC) — Eliminar client secrets em CI/CD

🎓 **Pré-req:** App Registration ✅ + entender CI/CD básico

💡 **Por quê:** **JÁ APLICAMOS no `tftec-auth`!** GitHub Actions deploya no Azure SEM client_secret. Auth via federated credential subject `repo:OWNER/REPO:ref:refs/heads/main`. Zero rotação, zero leak.

📚 **Estudar:**
- Doc: https://learn.microsoft.com/entra/workload-id/workload-identity-federation
- **Exercício prático:** Aplicar OIDC federation em outro projeto seu — comparar com SP+secret antes/depois
- Olha o `.github/workflows/deploy-azure.yml` do `tftec-auth` como referência viva

⏱️ **3 dias** — conceito simples, complexidade está em entender JWT exchange e subject claim format.

🛡️ **Suporta:** GitHub Actions, GitLab CI, Bitbucket, Terraform Cloud, AWS, GCP, Kubernetes (OIDC discovery).

---

## 4️⃣ Managed Identity — Zero secret pra apps no Azure

🎓 **Pré-req:** App Registration + entender resources Azure (App Service, Function App, VM)

💡 **Por quê:** Sua app no Azure App Service pode autenticar como ela mesma usando **identity injetada pelo Azure**. Sem código de auth, sem secret, sem federated credential. Azure cuida de tudo.

📚 **Estudar:**
- Doc: https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview
- **Exercício prático:** Habilitar System-assigned Managed Identity no `authservice-api-tftec` → grant role no Storage Account → ler blob sem secret nenhum
- 2 tipos: System-assigned (vinculada ao recurso) vs User-assigned (compartilhável)

⏱️ **1 semana** — fácil ativar, complexo migrar apps que já usam client_secret.

---

## 5️⃣ Certificate-based Authentication — Substituir client_secret por cert

🎓 **Pré-req:** App Registration + Key Vault básico

💡 **Por quê:** Client secret é uma senha (vaza fácil em logs). Certificate é par chave pública/privada — chave privada **nunca trafega**. Mais seguro pra apps que precisam de credential persistente.

📚 **Estudar:**
- Doc: https://learn.microsoft.com/entra/identity-platform/certificate-credentials
- **Exercício prático:** Gerar self-signed cert → upload public key na App Reg → autenticar com chave privada do Key Vault
- Compara: client_secret vs certificate vs federated credential

⏱️ **1 semana** — entender PKI básico é o gargalo, depois é configuração.

---

## 6️⃣ Custom Claims & Claim Mapping Policy — Dados extra no JWT

🎓 **Pré-req:** Claims básicas ✅ + Microsoft Graph

💡 **Por quê:** Quer adicionar `department` ou `costCenter` do RH no token? Isso é Custom Claims. Permite RBAC mais rico sem chamar API extra a cada request.

📚 **Estudar:**
- Doc: https://learn.microsoft.com/entra/identity-platform/saml-claims-customization
- **Exercício prático:** Adicionar claim `tftec_role` baseado em group membership do user
- Limitações: nem todo claim aceita custom (security claims protegidas)

⏱️ **2 semanas** — configuração via Graph API ou PowerShell, debugar claims missing é trabalhoso.

---

## 7️⃣ App Roles vs Groups vs Scopes — Modelos de autorização

🎓 **Pré-req:** Claims ✅ + entender authorization básico

💡 **Por quê:** **3 modelos diferentes** de RBAC:
- **Scopes** (`scp`): granularidade de operação ("read calendar")
- **App Roles** (`roles`): role customizada do seu app ("Editor", "Admin")
- **Groups** (`groups`): grupos do Entra ID ("Engenharia", "RH")

Saber qual usar = arquitetura limpa de authorization.

📚 **Estudar:**
- Doc: https://learn.microsoft.com/entra/identity-platform/howto-add-app-roles-in-apps
- **Exercício prático:** Implementar 3 roles no `tftec-auth` (`User`, `Editor`, `Admin`) + middleware `[Authorize(Roles="Admin")]` em endpoint
- Comparação: quando user pode estar em 100 grupos, mas só 5 app roles

⏱️ **1 semana** — código simples, mas modelar permission system corretamente é arte.

---

## 8️⃣ B2C vs B2B — Quando usar cada um

🎓 **Pré-req:** Multi-tenant ✅

💡 **Por quê:**
- **B2B** (External Identities): convidar usuários de outras orgs Entra ID pro seu tenant. Ex: parceiro do TFTEC acessa SharePoint.
- **B2C** (Customer Identity): apps voltadas pra **consumidores finais** (clientes que tem Gmail, Facebook, conta local). Diferente do Entra ID.

> 🚨 **B2C é OUTRO produto** (Microsoft Entra External ID for customers). API e configuração diferentes.

📚 **Estudar:**
- B2B: https://learn.microsoft.com/entra/external-id/what-is-b2b
- B2C: https://learn.microsoft.com/entra/external-id/customers/overview-customers-ciam
- **Exercício prático:** Convidar email externo via B2B no tenant TFTEC; criar tenant B2C separado pra app de cliente final

⏱️ **B2B: 3 dias.** B2C: **3-4 semanas** (é outro mundo).

---

## 🎓 Path Sugerido (ordem de aprendizado)

```
Você está aqui ──▶ App Registration ✅
                      │
                      ▼
                 Conditional Access (#1) ──┬──▶ Authentication Methods (#2)
                                           │
                                           ▼
                                   Workload Identity Federation (#3)
                                           │
                                           ▼
                                   Managed Identity (#4) ──┬──▶ Certificate-based (#5)
                                                            │
                                                            ▼
                                                     Custom Claims (#6) ──▶ App Roles (#7)
                                                                                  │
                                                                                  ▼
                                                                            B2B/B2C (#8)
```

**Tempo total estimado:** ~3 meses de estudo focado pra dominar todo esse stack.

---

## 📚 Recursos Master

### Cursos / Certificações
- **AZ-104** Azure Administrator (inclui Entra ID básico)
- **SC-300** Identity & Access Administrator (foco identity)
- **SC-100** Cybersecurity Architect (estratégia de identity)

### Comunidades
- 🐙 GitHub: https://github.com/AzureAD (libs oficiais MSAL)
- 💬 Reddit: r/AZURE
- 🐦 Twitter/X: @MicrosoftEntra, @azureadvocates

### Blogs essenciais
- 📝 https://learn.microsoft.com/entra/architecture/ (arquiteturas reais)
- 📝 https://devblogs.microsoft.com/identity/ (novidades técnicas)

---

## 🚀 Onde aplicar tudo isso

> No `tftec-auth` específicamente, dá pra praticar **todos os 8 tópicos** sem precisar criar projeto novo. O sistema já tem:
> - ✅ Multi-tenant
> - ✅ OBO + Client Credentials + Auth Code (Cena 6 da aula)
> - ✅ OIDC federation (CI/CD)
> - 🔜 Managed Identity (próximo workshop)
> - 🔜 Conditional Access (depende de policy de tenant)

**Próximo workshop sugerido:** Conditional Access aplicado ao `tftec-auth` — bloquear deploy do GitHub Actions fora do horário comercial 🎯
