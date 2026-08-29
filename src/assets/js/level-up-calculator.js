(function () {
  var root = document.getElementById("luCalcBtn");
  if (!root) return;

  var state = { wind: "moderate", focus: "freeride", focusTouched: false };

  // Same base wing/wind table and weight adjustment as the beginner gear
  // calculator (src/assets/js/gear-calculator.js), minus the experience term
  // (this tool doesn't collect experience) — keeps the primary wing number
  // consistent between both tools for the same weight/wind inputs.
  var WIND_BASE_WING = { light: 5.5, moderate: 4.5, strong: 3.5, verystrong: 2.5 };
  var TIER_LABEL = { light: "light-wind", moderate: "moderate-wind", strong: "strong-wind", verystrong: "very-strong-wind" };

  var FOIL_TEXT = {
    downwind: "Lean toward a higher-aspect-ratio front wing. It glides longer between pumps, which is exactly what you want linking swell — the tradeoff is it won't turn as sharply as a stockier foil.",
    jumping: "Lean toward a more maneuverable, lower-to-mid-aspect foil. It won't hold top-end speed as long, but it turns and responds faster, which matters more once you're setting up jumps and tricks.",
    freeride: "A mid-aspect all-rounder foil is the safest next step — it doesn't specialize hard in either direction, which keeps your options open while you figure out what you like."
  };

  function weightAdjustForWing(weightLb) {
    return ((weightLb - 165) / 35) * 0.5;
  }

  function fmtRange(lo, hi) {
    return Math.round(lo * 2) / 2 + "–" + Math.round(hi * 2) / 2 + "m²";
  }

  function checkedBlockers() {
    var out = {};
    document.querySelectorAll('#luBlockers input[type="checkbox"]').forEach(function (cb) {
      out[cb.value] = cb.checked;
    });
    return out;
  }

  function calculate() {
    var weightLb = parseInt(document.getElementById("luWeight").value, 10);
    var wind = state.wind;
    var focus = state.focus;
    var b = checkedBlockers();

    // ---- Wing quiver ----
    var primary = WIND_BASE_WING[wind] + weightAdjustForWing(weightLb);
    primary = Math.max(2, Math.round(primary * 2) / 2);
    var lightRange = fmtRange(primary + 1, primary + 1.5);
    var strongRange = fmtRange(Math.max(1.5, primary - 1.5), Math.max(2, primary - 1));

    var wingText =
      "Primary: ~" + primary + "m² for your typical " + TIER_LABEL[wind] + " days. " +
      "Add roughly " + lightRange + " for light-wind days, and roughly " + strongRange +
      " for when it's blowing harder than usual.";
    document.getElementById("luWingOut").textContent = wingText;

    var wingNote = document.getElementById("luWingNote");
    if (focus === "downwind") {
      wingNote.textContent =
        "For downwind runs specifically, lean toward the smaller end of your range rather than the larger — a wing that's too big gets hard to manage at downwind speed.";
      wingNote.hidden = false;
    } else {
      wingNote.hidden = true;
    }

    // ---- Foil direction ----
    document.getElementById("luFoilOut").textContent = FOIL_TEXT[focus];
    var foilNote = document.getElementById("luFoilNote");
    if (b.E) {
      foilNote.textContent =
        "Feeling unstable at speed is more often a technique-and-time thing than a foil problem at this stage — it's usually worth logging more sessions on your current foil before assuming you need a different one.";
      foilNote.hidden = false;
    } else {
      foilNote.hidden = true;
    }

    // ---- Board direction ----
    var boardText;
    if (b.B) {
      boardText = "Sounds like it's time to size down. A smaller-volume board will feel livelier and respond faster — the tradeoff is less stability and a narrower wind range, so expect an adjustment period.";
    } else if (b.C) {
      boardText = "For jumping, look toward a board on the smaller/lighter end of what you can comfortably ride — it's easier to get in the air and control once it's off the water. This is also the point most riders start considering foot straps — see the Jumping & Freestyle guide for more on that.";
    } else if (b.D) {
      boardText = "For downwinding, a mid-length board with moderate volume is the better starting point — not your smallest board. Stability matters more than you'd expect while you're still learning to link bumps.";
    } else if (b.A) {
      boardText = "This usually isn't a board-size problem — before sizing anything down, make sure you're not just under-winged for the conditions (see your wing quiver above). Sizing down a board while you're still struggling to get going in light wind usually makes it harder, not easier.";
    } else {
      boardText = "No strong signal to size your board down yet — keep riding what you have and revisit this once something specific starts to feel like a limit.";
    }
    document.getElementById("luBoardOut").textContent = boardText;

    // ---- Links ----
    // Hrefs come from data-* attributes rendered server-side through Eleventy's
    // `url` filter (see level-up-widget.njk), so the GitHub Pages path prefix
    // is already baked in correctly — building href strings by hand here would
    // skip that and break in production (see the .eleventy.js transform notes).
    var linksEl = document.getElementById("luLinks");
    var links = [];
    if (b.C || focus === "jumping") {
      links.push({ href: linksEl.dataset.jumping, label: "Jumping & Freestyle Guide" });
    }
    if (b.D || focus === "downwind") {
      links.push({ href: linksEl.dataset.downwind, label: "Downwinding Guide" });
    }
    links.push({ href: linksEl.dataset.shopGear, label: "Shop Wings, Boards & Foils" });
    links.push({ href: linksEl.dataset.shopBrands, label: "Browse the Brand Directory" });

    linksEl.innerHTML = "";
    links.forEach(function (link) {
      var a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      linksEl.appendChild(a);
    });

    document.getElementById("luResults").classList.add("visible");
    document.getElementById("luResults").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function wireSegmented(groupId, stateKey, defaultValue, onChange) {
    var group = document.getElementById(groupId);
    var buttons = group.querySelectorAll("button");
    buttons.forEach(function (btn) {
      if (btn.dataset.value === defaultValue) btn.classList.add("active");
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        state[stateKey] = btn.dataset.value;
        if (onChange) onChange(btn.dataset.value);
      });
    });
  }

  function setFocus(value) {
    state.focus = value;
    var group = document.getElementById("luFocus");
    group.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.value === value);
    });
  }

  wireSegmented("luWind", "wind", state.wind);
  wireSegmented("luFocus", "focus", state.focus, function () {
    state.focusTouched = true;
  });

  // Nice-to-have: default the focus selection when a rider flags jumping or
  // downwinding as a blocker, unless they've already picked a focus themselves.
  document.querySelectorAll('#luBlockers input[type="checkbox"]').forEach(function (cb) {
    cb.addEventListener("change", function () {
      cb.closest(".checkbox-card").classList.toggle("checked", cb.checked);
      if (state.focusTouched) return;
      if (cb.value === "C" && cb.checked) setFocus("jumping");
      if (cb.value === "D" && cb.checked) setFocus("downwind");
    });
  });

  var weightSlider = document.getElementById("luWeight");
  var weightOut = document.getElementById("luWeightOut");
  weightSlider.addEventListener("input", function () {
    weightOut.textContent = weightSlider.value + " lb";
  });

  document.getElementById("luCalcBtn").addEventListener("click", calculate);
})();
