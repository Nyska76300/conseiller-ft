/* Thème de couleurs choisi dans Paramètres : chargé avant l’affichage pour éviter un éclair de l’ancien thème */
(function () {
  document.documentElement.classList.add('ft-lite'); /* affichage allégé permanent : posé avant le premier affichage */
  var P = ['emeraude', 'sarcelle', 'amethyste', 'framboise', 'ardoise'], p = '';
  try { p = (JSON.parse(localStorage.getItem('ft_prefs') || '{}') || {}).pal || ''; } catch (e) {}
  if (P.indexOf(p) < 0) return;
  var v = (document.querySelector('meta[name="ft-version"]') || {}).content || '';
  document.documentElement.setAttribute('data-pal', p);
  document.write('<link rel="stylesheet" id="ft-pal" href="assets/css/pal-' + p + '.css?v=' + v + '">');
})();
