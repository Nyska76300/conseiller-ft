// Espace Conseiller : envoi des notifications push (Web Push)
// Déploiement : Supabase → Edge Functions → « Deploy a new function » → nom « send-push » → coller ce fichier.
// Secrets à définir (Edge Functions → Secrets) : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ex. mailto:vous@exemple.fr),
// et facultativement FT_PUSH_TOKEN (pour les envois automatiques depuis GitHub).
// Rappels personnels : appelée toutes les 5 minutes par la base (script securite_rappels_bugs.sql), avec un jeton interne.
// Dans les réglages de la fonction, désactiver « Verify JWT » : la fonction fait elle-même le contrôle (administrateur ou jeton).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ft-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

/* Résumé mensuel : nouveautés du site et changements réglementaires du mois écoulé */
const SITE = "https://nyska76300.github.io/conseiller-ft/";
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
// deno-lint-ignore no-explicit-any
async function monthly(db: any) {
  const now = new Date(), prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const y = prev.getUTCFullYear(), m = prev.getUTCMonth() + 1, ym = y + "-" + String(m).padStart(2, "0");
  let news: string[] = [], regs = 0;
  try {
    const js = await (await fetch(SITE + "assets/js/43-nouveautes.js", { cache: "no-store" })).text();
    for (const e of js.matchAll(/\{ v: '[^']+', date: '(\d{2})\/(\d{2})\/(\d{4})', items: \[([\s\S]*?)\] \}/g)) {
      if (+e[2] === m && +e[3] === y) news = news.concat([...e[4].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1].replace(/\\'/g, "'")));
    }
  } catch (_) { /* site injoignable */ }
  try {
    const mj = await (await fetch(SITE + "reglementation/maj.json", { cache: "no-store" })).json();
    regs = ((mj && mj.updates) || []).filter((u: { date?: string }) => String(u.date || "").startsWith(ym)).length;
  } catch (_) { /* fichier absent */ }
  if (!news.length && !regs) return { monthly: "rien à signaler", month: ym };
  const first = news[0] ? (news[0].split(" : ")[0] || "").slice(0, 60) : "";
  const parts = [news.length ? news.length + " nouveauté" + (news.length > 1 ? "s" : "") + " sur le site" + (first ? " (dont « " + first + " »)" : "") : "", regs ? regs + " changement" + (regs > 1 ? "s" : "") + " réglementaire" + (regs > 1 ? "s" : "") : ""].filter(Boolean);
  const payload = JSON.stringify({ title: "📅 Le mois " + (/^[aeiouyàâéèêëîïôûù]/i.test(MOIS[m - 1]) ? "d’" : "de ") + MOIS[m - 1] + " en bref", body: parts.join(" · ") + ". Touchez pour voir le détail.", go: "news", tag: "ft-mensuel-" + ym });
  const { data: subs } = await db.from("push_subs").select("endpoint,p256dh,auth");
  let sent = 0;
  for (const s of subs || []) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 172800 }); sent++; }
    catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) await db.from("push_subs").delete().eq("endpoint", s.endpoint); }
  }
  return { monthly: ym, news: news.length, regs, sent };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, service, { auth: { persistSession: false } });

  const pub = Deno.env.get("VAPID_PUBLIC_KEY"), priv = Deno.env.get("VAPID_PRIVATE_KEY");
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch (_) { /* vide */ }

  // Rappels arrivés à échéance (appel interne de la base, toutes les 5 minutes)
  const cron = req.headers.get("x-ft-cron");
  if (cron) {
    const { data: c } = await db.from("ft_cron").select("token").eq("id", 1).maybeSingle();
    if (!c || c.token !== cron) return json({ error: "Jeton interne invalide" }, 403);
    if (!pub || !priv) return json({ error: "Clés VAPID absentes" }, 500);
    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.org", pub, priv);
    if (body.action === "monthly") return json(await monthly(db));
    const { data: due } = await db.from("reminders").select("id,user_id,body,go").is("sent_at", null).lte("due_at", new Date().toISOString()).limit(200);
    let sent = 0;
    for (const r of due || []) {
      const { data: subs } = await db.from("push_subs").select("endpoint,p256dh,auth").eq("user_id", r.user_id);
      const payload = JSON.stringify({ title: "⏰ Rappel", body: r.body, go: r.go || "", tag: "ft-rem-" + r.id });
      for (const s of subs || []) {
        try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 }); sent++; }
        catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) await db.from("push_subs").delete().eq("endpoint", s.endpoint); }
      }
      await db.from("reminders").update({ sent_at: new Date().toISOString() }).eq("id", r.id);
    }
    return json({ reminders: (due || []).length, sent });
  }

  // Contrôle d'accès : jeton secret (GitHub) ou administrateur connecté (avec le code de double vérification s'il l'a activée)
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
        let aal = "aal1";
        try { aal = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).aal || "aal1"; } catch (_) { /* jeton illisible */ }
        const mfa = (data.user.factors || []).some((f: { status: string }) => f.status === "verified");
        ok = !!a && (!mfa || aal === "aal2");
      }
    }
  }
  if (!ok) return json({ error: "Accès réservé à l'administrateur" }, 403);

  if (body.action === "status") {
    const { count } = await db.from("push_subs").select("*", { count: "exact", head: true });
    return json({ configured: !!(pub && priv), subscribers: count || 0 });
  }
  if (!pub || !priv) return json({ error: "Clés VAPID absentes : ajoutez VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY dans les secrets." }, 500);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.org", pub, priv);

  let q = db.from("push_subs").select("endpoint,p256dh,auth,user_id");
  if (body.audience === "me" && callerId) q = q.eq("user_id", callerId);
  else if (body.audience === "agence") {
    const { data: ids } = await db.rpc("ft_agence_users", { a: body.agence || "" });
    q = q.in("user_id", ((ids || []) as unknown[]).map((x) => typeof x === "string" ? x : (x as Record<string, string>).ft_agence_users));
  }
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
