import type { SequenceStep } from "@/components/lab/SequencePlayer";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  chart: string;
  /** Steps must align 1:1 with arrows in the sequence diagram */
  steps: Omit<SequenceStep, "onActivate" | "onAction">[];
}

export const scenarios: Scenario[] = [
  {
    id: "spa-login-api",
    title: "Usuário loga no SPA e acessa API protegida",
    description: "Authorization Code + PKCE clássico. SPA público, API confidencial.",
    chart: `sequenceDiagram
  participant U as Usuário
  participant B as Browser/SPA
  participant E as Entra ID
  participant A as AuthService API
  U->>B: Abre app
  B->>E: Redirect /authorize (PKCE challenge)
  E->>U: Tela de login
  U->>E: Credenciais + MFA
  E->>B: Redirect /callback?code=...
  B->>E: POST /token (code + verifier)
  E->>B: id_token + access_token
  B->>A: GET /api/me (Bearer access_token)
  A->>B: 200 OK + dados`,
    steps: [
      { title: "Usuário abre o SPA", description: "MSAL detecta que não há sessão e dispara o redirect para o Entra ID." },
      { title: "Redirect /authorize com PKCE", description: "SPA gera code_verifier e envia code_challenge. Garante que ninguém intercepte o code.", technical: "GET https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize\n  ?client_id=...\n  &response_type=code\n  &code_challenge=...\n  &code_challenge_method=S256\n  &scope=openid profile api://.../access_as_user" },
      { title: "Entra ID exibe login", description: "O usuário vê a tela hospedada pela Microsoft. SPA não toca em senha." },
      { title: "Usuário autentica", description: "Senha + MFA conforme políticas de Conditional Access do tenant." },
      { title: "Callback com authorization code", description: "Redirect de volta ao SPA carregando o code (curto, single-use)." },
      { title: "SPA troca code por tokens", description: "POST no /token enviando code + code_verifier. PKCE prova a posse.", technical: "POST /oauth2/v2.0/token\nContent-Type: application/x-www-form-urlencoded\ngrant_type=authorization_code&code=...&code_verifier=..." },
      { title: "Entra ID retorna tokens", description: "id_token (identidade) + access_token (autorização para API) + refresh_token." },
      { title: "SPA chama API com Bearer", description: "Access token vai no header Authorization. API valida assinatura via JWKS.", technical: "GET /api/me\nAuthorization: Bearer eyJ0eXAi..." },
      { title: "API responde", description: "Após validar issuer, audience, expiração e scopes, devolve os dados." },
    ],
  },
  {
    id: "obo",
    title: "SPA → API → outra API (On-Behalf-Of)",
    description: "API intermediária precisa chamar outra API mantendo a identidade do usuário.",
    chart: `sequenceDiagram
  participant B as SPA
  participant A1 as API (AuthService)
  participant E as Entra ID
  participant A2 as Downstream API (Graph)
  B->>A1: GET /api/users (Bearer token1)
  A1->>A1: Valida token1
  A1->>E: POST /token (OBO: token1 + client_secret)
  E->>A1: token2 (audience = Graph)
  A1->>A2: GET /v1.0/users (Bearer token2)
  A2->>A1: 200 OK + lista
  A1->>B: 200 OK + dados normalizados`,
    steps: [
      { title: "SPA chama API com seu token", description: "Token tem audience da AuthService API." },
      { title: "API valida o token entrante", description: "Microsoft.Identity.Web checa assinatura, issuer, audience e scopes." },
      { title: "API solicita OBO ao Entra ID", description: "Troca o token do usuário por um novo com audience da downstream API.", technical: "POST /oauth2/v2.0/token\ngrant_type=urn:ietf:params:oauth:grant-type:jwt-bearer\nassertion=<token1>&requested_token_use=on_behalf_of\nscope=https://graph.microsoft.com/.default" },
      { title: "Entra ID emite novo access token", description: "Mantém oid/tid do usuário original — a downstream API vê o usuário, não a API intermediária." },
      { title: "API chama Graph com token novo", description: "Token2 tem aud=graph e scopes delegated do usuário." },
      { title: "Graph responde", description: "Retorna apenas o que o usuário tem permissão de ver." },
      { title: "API devolve ao SPA", description: "Resposta normalizada/agregada, sem expor o token2." },
    ],
  },
  {
    id: "client-credentials",
    title: "Daemon sincroniza dados (Client Credentials)",
    description: "Sem usuário. App se autentica como ele mesmo usando secret/cert/federated identity.",
    chart: `sequenceDiagram
  participant D as Daemon/Worker
  participant E as Entra ID
  participant A as API/Graph
  D->>E: POST /token (client_id + secret + scope=.default)
  E->>D: access_token (roles)
  D->>A: GET /v1.0/users (Bearer)
  A->>D: 200 OK`,
    steps: [
      { title: "Daemon precisa rodar sem usuário", description: "Job agendado, integração backend, sincronização noturna." },
      { title: "Solicita token ao Entra ID", description: "Envia client_id + credencial + scope=.default. Sem usuário no fluxo.", technical: "POST /oauth2/v2.0/token\ngrant_type=client_credentials\nclient_id=...\nclient_secret=...\nscope=https://graph.microsoft.com/.default" },
      { title: "Entra emite token com 'roles'", description: "Sem 'scp'. As permissões são Application (concedidas pelo admin)." },
      { title: "Daemon chama a API", description: "Acesso amplo: admin já consentiu permissões a nível de tenant." },
      { title: "API responde", description: "Valida token e roles. Sem contexto de usuário — auditoria mostra o appid." },
    ],
  },
  {
    id: "saml",
    title: "App federado entra via SAML 2.0",
    description: "Cenário enterprise: app legado que só fala SAML, federado com Entra ID como IdP.",
    chart: `sequenceDiagram
  participant U as Usuário
  participant SP as App SAML (SP)
  participant E as Entra ID (IdP)
  U->>SP: Acessa /protected
  SP->>U: Redirect com SAMLRequest assinado
  U->>E: GET /saml2 (SAMLRequest)
  E->>U: Tela de login
  U->>E: Credenciais
  E->>U: HTML com SAMLResponse (POST auto)
  U->>SP: POST /acs (SAMLResponse XML assinado)
  SP->>SP: Valida assinatura + assertion
  SP->>U: Sessão estabelecida`,
    steps: [
      { title: "Usuário acessa app SAML", description: "App não fala OIDC — depende de SAML 2.0 (comum em apps Java/legados)." },
      { title: "SP redireciona com SAMLRequest", description: "XML codificado em base64 dentro da query string. SP-initiated flow." },
      { title: "Entra ID processa SAMLRequest", description: "Configurado em Enterprise Applications → Single sign-on → SAML." },
      { title: "Usuário autentica", description: "Mesma tela de login do Entra ID, mesmas políticas de Conditional Access." },
      { title: "Entra emite SAMLResponse", description: "XML assinado contendo <Assertion> com claims (NameID, atributos).", technical: "<saml2:Assertion>\n  <saml2:Subject><saml2:NameID>user@tenant.com</saml2:NameID></saml2:Subject>\n  <saml2:AttributeStatement>...</saml2:AttributeStatement>\n  <ds:Signature>...</ds:Signature>\n</saml2:Assertion>" },
      { title: "Browser faz POST no ACS", description: "Assertion Consumer Service do SP recebe o XML." },
      { title: "SP valida assinatura", description: "Confere usando o certificado público do IdP (configurado no setup)." },
      { title: "Sessão estabelecida", description: "SP cria sessão local. Sem JWT — claims ficam no cookie de sessão do app." },
    ],
  },
];
