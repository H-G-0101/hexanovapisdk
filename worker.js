// Cloudflare Worker (com assets estáticos) — Hexanova + pagamentos Pi.
// As rotas /api/pi-* rodam AQUI; todo o resto vem de ./public (binding ASSETS).
// Secret necessária: PI_SERVER_API_KEY
//   -> npx wrangler secret put PI_SERVER_API_KEY
//   -> ou no painel: seu Worker > Settings > Variables and Secrets

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

async function piCall(env, paymentId, action, extraBody) {
  const key = env.PI_SERVER_API_KEY;
  if (!key) return json({ error: 'missing_PI_SERVER_API_KEY' }, 500);
  if (!paymentId) return json({ error: 'missing_paymentId' }, 400);
  try {
    const init = { method: 'POST', headers: { Authorization: `Key ${key}` } };
    if (extraBody) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(extraBody);
    }
    const r = await fetch(
      `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/${action}`,
      init
    );
    const data = await r.json().catch(() => ({}));
    return json({ ok: r.ok, data }, r.ok ? 200 : r.status);
  } catch (e) {
    return json({ error: 'pi_api_error', detail: String((e && e.message) || e) }, 502);
  }
}

async function readBody(request) {
  try { return await request.json(); } catch { return {}; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p.startsWith('/api/pi-')) {
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
      const body = await readBody(request);
      if (p === '/api/pi-approve') return piCall(env, body.paymentId, 'approve');
      if (p === '/api/pi-complete') {
        if (!body.txid) return json({ error: 'missing_txid' }, 400);
        return piCall(env, body.paymentId, 'complete', { txid: body.txid });
      }
      if (p === '/api/pi-cancel') return piCall(env, body.paymentId, 'cancel');
      return json({ error: 'not_found' }, 404);
    }

    // qualquer outra rota = arquivo estático (index.html, bgm.mp3, bg_game.webp, ...)
    return env.ASSETS.fetch(request);
  }
};
