/* Mise à jour forcée : vide la copie hors ligne et recharge la dernière version du site */
window.ftHardReload = function () {
  try { if (window.showToast) showToast('Mise à jour en cours…', 'info'); } catch (e) {}
  var go = function () { location.replace(location.pathname + '?v=' + Date.now() + location.hash); };
  var p = [];
  try { if (window.caches) p.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })); } catch (e) {}
  try { if (navigator.serviceWorker) p.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.update().catch(function () {}); })); })); } catch (e) {}
  Promise.all(p).then(go, go); setTimeout(go, 2500);
};
