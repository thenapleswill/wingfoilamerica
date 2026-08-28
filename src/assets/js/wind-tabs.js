(function () {
  var tabs = document.querySelectorAll(".wind-tab");
  if (!tabs.length) return;

  var panels = document.querySelectorAll(".wind-tab-panel");

  function activate(tab) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute("aria-selected", selected ? "true" : "false");
      t.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.id !== tab.getAttribute("aria-controls");
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activate(tab);
    });
    tab.addEventListener("keydown", function (event) {
      var newIndex = null;
      if (event.key === "ArrowRight") newIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") newIndex = (index - 1 + tabs.length) % tabs.length;
      if (newIndex !== null) {
        event.preventDefault();
        tabs[newIndex].focus();
        activate(tabs[newIndex]);
      }
    });
  });
})();
