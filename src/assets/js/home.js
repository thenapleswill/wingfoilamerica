(function () {
  var STORAGE_KEY = "wfa_experience_level";
  var cards = document.querySelectorAll(".experience-card[data-level]");
  if (!cards.length) return;

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      try {
        localStorage.setItem(STORAGE_KEY, card.getAttribute("data-level"));
      } catch (e) {
        // localStorage unavailable (private browsing, blocked storage, etc.) — not fatal,
        // the link still navigates normally.
      }
    });
  });

  var savedLevel;
  try {
    savedLevel = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    savedLevel = null;
  }
  if (!savedLevel) return;

  var matchingCard = document.querySelector('.experience-card[data-level="' + savedLevel + '"]');
  if (!matchingCard) return;

  var banner = document.getElementById("welcomeBack");
  var levelEl = document.getElementById("welcomeBackLevel");
  var linkEl = document.getElementById("welcomeBackLink");
  if (!banner || !levelEl || !linkEl) return;

  levelEl.textContent = matchingCard.getAttribute("data-level-label");
  linkEl.href = matchingCard.getAttribute("href");
  banner.hidden = false;
})();
