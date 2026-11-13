/* Hauteur automatique des mails générés : tout le texte visible, sans ascenseur interne (jusqu’à 70 % de l’écran) */
window.ftMailFit = function (ta) {
  if (!ta || !ta.offsetParent) return;
  ta.style.height = 'auto';
  ta.style.height = Math.max(140, Math.min(ta.scrollHeight + 4, Math.round(window.innerHeight * 0.7))) + 'px';
};
document.addEventListener('input', e => { if (e.target.matches && e.target.matches('.ft-mail textarea')) window.ftMailFit(e.target); });
