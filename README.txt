HEXANOVA — Pi Network (autenticação + pagamento U2A)
Deploy: Cloudflare Pages
=====================================================

ESTRUTURA DESTE PACOTE
----------------------
  index.html                    -> o jogo (versão Pi; era o hexa_pi.html)
  _headers                      -> regras de cache do Cloudflare Pages
  functions/api/pi-approve.js   -> aprova o pagamento (passo 2 do fluxo U2A)
  functions/api/pi-complete.js  -> completa o pagamento com o txid (passo 4)
  functions/api/pi-cancel.js    -> cancela pagamento pendente (incomplete)
  README.txt                    -> este arquivo

  >>> FALTAM 2 ARQUIVOS (binários que eu não tinha aqui) <<<
  Coloque na RAIZ, ao lado do index.html, os mesmos dois do deploy do
  hexa_physics.html:
      bgm.mp3          (música de fundo)
      bg_game.webp     (arte de fundo do gameplay)
  Sem eles o jogo abre, mas sem música e sem o fundo.


PASSO A PASSO (Cloudflare Pages)
--------------------------------
1) Adicione bgm.mp3 e bg_game.webp na raiz (ver acima).

2) Suba a pasta:
   - Direto pelo painel: Workers & Pages -> Create -> Pages ->
     "Upload assets" e arraste o CONTEÚDO desta pasta (não a pasta em si).
   - Ou por Git: faça commit destes arquivos e conecte o repositório.
   - Ou por CLI:  npx wrangler pages deploy .   (rodando dentro desta pasta)

3) Variável de ambiente (obrigatória p/ o pagamento fechar):
   Settings -> Environment variables -> Add
       Nome:  PI_SERVER_API_KEY
       Valor: a chave de SERVIDOR do app (Pi Developer Portal)
              (NÃO é a chave de cliente/frontend)
   Marque também em "Production" (e "Preview" se for testar lá).
   Depois de adicionar, refaça o deploy pra a env valer nas Functions.

4) As rotas ficam automáticas (mesmo domínio do jogo):
       /api/pi-approve
       /api/pi-complete
       /api/pi-cancel
   O index.html já chama elas em same-origin — não precisa configurar URL.


SANDBOX vs PRODUÇÃO
-------------------
No index.html, no topo (PONTO DE INTEGRAÇÃO PI #1), tem:
    Pi.init({version:"2.0", sandbox:false})
- Para testar no sandbox da Pi, troque para  sandbox:true
- Em produção, deixe  sandbox:false
O app precisa estar registrado no Pi Developer Portal e ser aberto pelo
Pi Browser pra autenticação e pagamento funcionarem de verdade.


PREÇOS EM PI (onde mexer)
-------------------------
No index.html, seção "PRECOS EM PI":
    SHOP_PI   = {100:1, 250:2, 500:3, 1000:5}   // diamantes -> Pi
    REVIVE_PI = 1     // reviver após "Board Full"
    UNLOCK_PI = 1     // desbloquear célula travada
    WIN_CLAIM_PI = 1  // bônus X do fim de fase


COMO O PAGAMENTO FUNCIONA (resumo)
----------------------------------
1. Cliente chama Pi.createPayment(...).
2. onReadyForServerApproval  -> POST /api/pi-approve   (backend aprova)
3. Usuário assina na carteira Pi.
4. onReadyForServerCompletion -> POST /api/pi-complete  (backend confirma o txid)
   -> SÓ AGORA o jogo credita a recompensa.
5. Cancelar/erro -> nada é creditado.

Fora do Pi Browser (navegador comum de desenvolvimento) o pagamento é
SIMULADO, só pra testar a interface. Dentro do Pi Browser, sem o backend +
PI_SERVER_API_KEY, o pagamento NÃO fecha (é regra da Pi, não do jogo).
