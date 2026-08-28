(function () {
  var mount = document.getElementById("navSearch");
  if (!mount || typeof PagefindUI === "undefined") return;

  new PagefindUI({
    element: "#navSearch",
    showSubResults: true,
    showImages: false,
    excerptLength: 15,
  });
})();
