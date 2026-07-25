// Cloudflare Pages Function  ->  POST /api/pi-complete   body: { paymentId, txid }
// Passo 4 do fluxo U2A: confirma o pagamento com o txid da blockchain Pi.
// SO depois desta chamada o cliente credita a recompensa.
// Env: PI_SERVER_API_KEY = chave de SERVIDOR do app (Pi Developer Portal).
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestPost({ request, env }) {
  const key = env.PI_SERVER_API_KEY;
  if (!key) return json({ error: 'missing_PI_SERVER_API_KEY' }, 500);

  let body = {};
  try { body = await request.json(); } catch { body = {}; }
  const paymentId = body && body.paymentId;
  const txid = body && body.txid;
  if (!paymentId || !txid) return json({ error: 'missing_paymentId_or_txid' }, 400);

  try {
    const r = await fetch(
      `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/complete`,
      {
        method: 'POST',
        headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid })
      }
    );
    const data = await r.json().catch(() => ({}));
    return json({ ok: r.ok, data }, r.ok ? 200 : r.status);
  } catch (e) {
    return json({ error: 'pi_api_error', detail: String((e && e.message) || e) }, 502);
  }
}
