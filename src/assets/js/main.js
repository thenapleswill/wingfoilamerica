(function () {
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  document.querySelectorAll("[data-newsletter-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      var action = form.getAttribute("data-action");
      var status = form.parentElement.querySelector("[data-newsletter-status]");
      if (!action || action.indexOf("REPLACE_WITH_YOUR_PROVIDER_ENDPOINT") !== -1) {
        event.preventDefault();
        if (status) {
          status.hidden = false;
          status.textContent = "Thanks! Signups open soon — check back shortly.";
        }
        form.reset();
      }
      // Once data-action is set to a real provider endpoint, remove the guard above
      // so the form posts normally.
    });
  });
})();
