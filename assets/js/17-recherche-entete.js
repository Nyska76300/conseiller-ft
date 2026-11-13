document.addEventListener('click', function (e) { var l = e.target.closest && e.target.closest('.ft-hsearch'); if (l) { e.preventDefault(); window.ftHeaderSearch(); } });
window.ftHeaderSearch = function () {
  var h = document.getElementById('ft-header-search');
  if (h) h.blur();
  if (typeof window.ftPalOpen === 'function') window.ftPalOpen();
};
