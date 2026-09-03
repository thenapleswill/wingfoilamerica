(function () {
  // Reuses the same Airtable base as Submit-a-Spot (index.md), in its own
  // "Spot Corrections" table + Form view. Submission happens on Airtable's
  // own hosted form (safe: no API key ships to the browser) — we just get
  // there pre-filled from our own richer form (free text + optional pin
  // drag), via the form's prefill_<Field Name> URL params.
  var AIRTABLE_BASE_ID = "appJHchIsjqLQ4gvL";
  var AIRTABLE_FORM_SHARE_ID = "shruxXMTJf28vUXnj";

  var openLink = document.getElementById("spotFeedbackOpen");
  var modal = document.getElementById("spotFeedbackModal");
  if (!openLink || !modal) return;

  var choiceEl = document.getElementById("spotFeedbackChoice");
  var formEl = document.getElementById("spotFeedbackForm");
  var formIntro = document.getElementById("spotFeedbackFormIntro");
  var messageEl = document.getElementById("spotFeedbackMessage");
  var emailEl = document.getElementById("spotFeedbackEmail");
  var mapWrap = document.getElementById("spotFeedbackMapWrap");
  var mapEl = document.getElementById("spotFeedbackMap");
  var airtableWrap = document.getElementById("spotFeedbackAirtableWrap");
  var iframe = document.getElementById("spotFeedbackIframe");

  var spotId = openLink.dataset.spotId;
  var spotName = openLink.dataset.spotName;
  var spotLat = parseFloat(openLink.dataset.spotLat);
  var spotLng = parseFloat(openLink.dataset.spotLng);

  var feedbackType = null;
  var leafletMap = null;
  var marker = null;
  var lastFocused = null;

  function resetModal() {
    choiceEl.hidden = false;
    formEl.hidden = true;
    airtableWrap.hidden = true;
    mapWrap.hidden = true;
    messageEl.value = "";
    emailEl.value = "";
    feedbackType = null;
    iframe.removeAttribute("src");
  }

  function openModal() {
    lastFocused = document.activeElement;
    resetModal();
    modal.removeAttribute("hidden");
    document.body.classList.add("modal-open");
    var firstBtn = choiceEl.querySelector("button");
    if (firstBtn) firstBtn.focus();
  }

  function closeModal() {
    modal.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
    if (lastFocused) lastFocused.focus();
  }

  openLink.addEventListener("click", function (event) {
    event.preventDefault();
    openModal();
  });

  modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
  });

  function initMapIfNeeded() {
    if (leafletMap || typeof L === "undefined" || isNaN(spotLat) || isNaN(spotLng)) return;
    leafletMap = L.map(mapEl, { scrollWheelZoom: false }).setView([spotLat, spotLng], 15);
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          '&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 18,
      }
    ).addTo(leafletMap);
    marker = L.marker([spotLat, spotLng], { draggable: true }).addTo(leafletMap);
    // The map starts inside a hidden container, which gives Leaflet a
    // zero-size box to measure; fix its size once it's actually visible.
    setTimeout(function () { leafletMap.invalidateSize(); }, 50);
  }

  choiceEl.querySelectorAll("[data-feedback-type]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      feedbackType = btn.dataset.feedbackType;
      choiceEl.hidden = true;
      formEl.hidden = false;
      if (feedbackType === "confirmation") {
        formIntro.textContent =
          "Tell us about riding or teaching here, and drag the pin below if the launch location needs adjusting.";
        mapWrap.hidden = false;
        initMapIfNeeded();
      } else {
        formIntro.textContent = "What's wrong, and what should it say instead?";
        mapWrap.hidden = true;
      }
      messageEl.focus();
    });
  });

  formEl.addEventListener("submit", function (event) {
    event.preventDefault();
    var message = messageEl.value.trim();
    if (!message) {
      messageEl.focus();
      return;
    }

    var params = new URLSearchParams();
    params.set("prefill_Spot ID", spotId || "");
    params.set("prefill_Spot Name", spotName || "");
    params.set("prefill_Submission Type", feedbackType === "confirmation" ? "Confirmation" : "Correction");
    params.set("prefill_Message", message);
    if (emailEl.value.trim()) params.set("prefill_Email", emailEl.value.trim());
    if (feedbackType === "confirmation" && marker) {
      var pos = marker.getLatLng();
      params.set("prefill_Submitted Lat", pos.lat.toFixed(6));
      params.set("prefill_Submitted Lng", pos.lng.toFixed(6));
    }
    params.set("prefill_Status", "New");

    iframe.src = "https://airtable.com/embed/" + AIRTABLE_BASE_ID + "/" + AIRTABLE_FORM_SHARE_ID + "?" + params.toString();
    formEl.hidden = true;
    airtableWrap.hidden = false;
  });
})();
