(function () {
  // Only fetch the hero background video on wide-enough viewports, and only
  // if the visitor hasn't asked for reduced motion — no <source> is ever
  // added otherwise, so mobile/reduced-motion visitors never download it at
  // all (CSS also hides the element as a second line of defense).
  var heroVideo = document.getElementById("heroVideo");
  if (heroVideo) {
    // Mirrors the CSS breakpoint that hides .hero-video: off below 700px
    // wide, and off on short/landscape phones too (not just portrait), so
    // JS never fetches a video CSS is about to hide anyway.
    var isHiddenByCss = window.matchMedia(
      "(max-width: 700px), (max-height: 700px) and (orientation: landscape)"
    ).matches;
    var okToAnimate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isHiddenByCss && okToAnimate && heroVideo.dataset.src) {
      var source = document.createElement("source");
      source.src = heroVideo.dataset.src;
      source.type = "video/mp4";
      heroVideo.appendChild(source);
      heroVideo.load();
      heroVideo.play().catch(function () {
        // Autoplay blocked by the browser — the poster frame stays put, which
        // is a fine fallback.
      });
    }
  }
})();

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

function syncBrandWaveWidth() {
  document.querySelectorAll(".brand-lockup-inner").forEach(function (inner) {
    var main = inner.querySelector(".brand-lockup-main");
    var wave = inner.querySelector(".brand-wave");
    var windLines = inner.querySelector(".wind-lines");
    if (!main || !wave || !windLines) return;
    var leftEdge = main.getBoundingClientRect().left;
    var rightEdge = windLines.getBoundingClientRect().right;
    var w = rightEdge - leftEdge;
    if (w > 0) {
      wave.style.width = w + "px";
    }
  });
}
syncBrandWaveWidth();
window.addEventListener("resize", syncBrandWaveWidth);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(syncBrandWaveWidth);
}
window.addEventListener("load", syncBrandWaveWidth);
