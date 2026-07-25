// Cloudflare Pages Function  ->  POST /api/pi-approve   body: { paymentId }
// Passo 2 do fluxo U2A: aprova o pagamento no servidor (Pi Platform API).
// Env (Pages -> Settings -> Environment variables / Secret):
//   PI_SERVER_API_KEY = chave de SERVIDOR do app (Pi Developer Portal).
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
  if (!paymentId) return json({ error: 'missing_paymentId' }, 400);

  try {
    const r = await fetch(
      `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/approve`,
      { method: 'POST', headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' } }
    );
    const data = await r.json().catch(() => ({}));
    return json({ ok: r.ok, data }, r.ok ? 200 : r.status);
  } catch (e) {
    return json({ error: 'pi_api_error', detail: String((e && e.message) || e) }, 502);
  }
}
