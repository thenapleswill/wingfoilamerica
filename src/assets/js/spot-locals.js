(function () {
  // Same pattern as spot-feedback.js: submission happens on Airtable's own
  // hosted Form view (safe — no API key ships to the browser), reached
  // pre-filled via the form's prefill_<Field Name> URL params. Table:
  // "Spot Locals" in the same base as Submit-a-Spot/Spot Corrections.
  var AIRTABLE_BASE_ID = "appJHchIsjqLQ4gvL";
  var AIRTABLE_FORM_SHARE_ID = "PENDING_SPOT_LOCALS_FORM_SHARE_ID"; // TODO: replace once the Spot Locals table has a shared Form view

  var openBtn = document.getElementById("spotLocalsOpen");
  var modal = document.getElementById("spotLocalsModal");
  if (!openBtn || !modal) return;

  var formEl = document.getElementById("spotLocalsForm");
  var nameEl = document.getElementById("spotLocalsName");
  var socialEl = document.getElementById("spotLocalsSocial");
  var noteEl = document.getElementById("spotLocalsNote");
  var emailEl = document.getElementById("spotLocalsEmail");
  var airtableWrap = document.getElementById("spotLocalsAirtableWrap");
  var iframe = document.getElementById("spotLocalsIframe");

  var spotId = openBtn.dataset.spotId;
  var spotName = openBtn.dataset.spotName;
  var lastFocused = null;

  function resetModal() {
    formEl.hidden = false;
    airtableWrap.hidden = true;
    nameEl.value = "";
    socialEl.value = "";
    noteEl.value = "";
    emailEl.value = "";
    iframe.removeAttribute("src");
  }

  function openModal() {
    lastFocused = document.activeElement;
    resetModal();
    modal.removeAttribute("hidden");
    document.body.classList.add("modal-open");
    nameEl.focus();
  }

  function closeModal() {
    modal.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
    if (lastFocused) lastFocused.focus();
  }

  openBtn.addEventListener("click", openModal);

  modal.querySelectorAll("[data-locals-modal-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
  });

  formEl.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = nameEl.value.trim();
    if (!name) {
      nameEl.focus();
      return;
    }

    var params = new URLSearchParams();
    params.set("prefill_Spot ID", spotId || "");
    params.set("prefill_Spot Name", spotName || "");
    params.set("prefill_Display Name / Handle", name);
    if (socialEl.value.trim()) params.set("prefill_Social Link", socialEl.value.trim());
    if (noteEl.value.trim()) params.set("prefill_Short Note", noteEl.value.trim());
    if (emailEl.value.trim()) params.set("prefill_Email", emailEl.value.trim());
    params.set("prefill_Status", "New");

    // Hide every field the visitor doesn't need to touch — same pattern as
    // Submit-a-Spot/Spot Corrections' hide_<Field Name> params.
    params.set("hide_Spot ID", "true");
    params.set("hide_Spot Name", "true");
    params.set("hide_Status", "true");

    iframe.src = "https://airtable.com/embed/" + AIRTABLE_BASE_ID + "/" + AIRTABLE_FORM_SHARE_ID + "?" + params.toString();
    formEl.hidden = true;
    airtableWrap.hidden = false;
  });
})();
