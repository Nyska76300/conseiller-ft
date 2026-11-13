// Espace Conseiller : envoi des notifications push (Web Push)
// Déploiement : Supabase → Edge Functions → « Deploy a new function » → nom « send-push » → coller ce fichier.
// Secrets à définir (Edge Functions → Secrets) : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ex. mailto:vous@exemple.fr),
// et facultativement FT_PUSH_TOKEN (pour les envois automatiques depuis GitHub).
// Dans les réglages de la fonction, désactiver « Verify JWT » : la fonction fait elle-même le contrôle (administrateur ou jeton).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ft-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, service, { auth: { persistSession: false } });

  // Contrôle d'accès : jeton secret (GitHub) ou administrateur connecté
  let callerId: string | null = null;
  const token = req.headers.get("x-ft-token");
  const secret = Deno.env.get("FT_PUSH_TOKEN");
  let ok = !!(token && secret && token === secret);
  if (!ok) {
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (jwt) {
      const { data } = await db.auth.getUser(jwt);
      if (data?.user) {
        callerId = data.user.id;
        const { data: a } = await db.from("app_admins").select("user_id").eq("user_id", callerId).maybeSingle();
        ok = !!a;
      }
    }
  }
  if (!ok) return json({ error: "Accès réservé à l'administrateur" }, 403);

  const pub = Deno.env.get("VAPID_PUBLIC_KEY"), priv = Deno.env.get("VAPID_PRIVATE_KEY");
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch (_) { /* vide */ }

  if (body.action === "status") {
    const { count } = await db.from("push_subs").select("*", { count: "exact", head: true });
    return json({ configured: !!(pub && priv), subscribers: count || 0 });
  }
  if (!pub || !priv) return json({ error: "Clés VAPID absentes : ajoutez VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY dans les secrets." }, 500);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.org", pub, priv);

  let q = db.from("push_subs").select("endpoint,p256dh,auth,user_id");
  if (body.audience === "me" && callerId) q = q.eq("user_id", callerId);
  else if (body.audience === "admins") {
    const { data: ads } = await db.from("app_admins").select("user_id");
    q = q.in("user_id", (ads || []).map((x: { user_id: string }) => x.user_id));
  }
  const { data: subs, error } = await q;
  if (error) return json({ error: error.message }, 500);

  const payload = JSON.stringify({ title: body.title || "Espace Conseiller", body: body.body || "", go: body.go || "", tag: body.tag || "ft" });
  let sent = 0, gone = 0, failed = 0;
  await Promise.all((subs || []).map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { gone++; await db.from("push_subs").delete().eq("endpoint", s.endpoint); }
      else failed++;
    }
  }));
  return json({ sent, gone, failed, total: (subs || []).length });
});
