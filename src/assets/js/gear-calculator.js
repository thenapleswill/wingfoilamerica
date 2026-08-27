(function () {
  var state = { experience: 'beginner', wind: 'moderate', budget: 'mid' };

  // ---------------------------------------------------------------
  // RULES — heuristic sizing tables. Tune freely.
  // ---------------------------------------------------------------
  var EXPERIENCE_ORDER = ['new', 'beginner', 'intermediate', 'expert'];

  // Base wing size (m²) by wind tier, for a ~165lb rider at "beginner" experience.
  var WIND_BASE_WING = { light: 5.5, moderate: 4.5, strong: 3.5, verystrong: 2.5 };

  // Wing size adjustment by experience (beginners size up a touch for stability,
  // experts size down and run smaller high-wind wings).
  var EXPERIENCE_WING_ADJUST = { new: 0.5, beginner: 0.5, intermediate: 0, expert: -0.5 };

  // Board volume = weight(kg) * multiplier, by experience.
  var BOARD_MULTIPLIER = { new: 2.1, beginner: 1.7, intermediate: 1.2, expert: 0.8 };
  var BOARD_TYPE = {
    new: 'Large inflatable / soft-top',
    beginner: 'Compact inflatable or entry hardboard',
    intermediate: 'Performance hardboard',
    expert: 'Low-volume strapless performance board'
  };

  // Foil front wing area (cm²) by experience.
  var FOIL_SIZE = { new: [1900, 2400], beginner: [1500, 1900], intermediate: [1100, 1500], expert: [650, 1100] };

  // Mast length (cm) by experience.
  var MAST_LENGTH = { new: [60, 68], beginner: [68, 75], intermediate: [75, 85], expert: [85, 95] };

  // Package cost ranges (USD) by budget tier: [wing, board, foilSet, accessories]
  var COST_TABLE = {
    used:    { wing: [350, 600],   board: [500, 900],   foil: [500, 900],   accessories: [150, 300] },
    mid:     { wing: [800, 1100],  board: [1000, 1500],  foil: [900, 1400],  accessories: [250, 450] },
    premium: { wing: [1100, 1500], board: [1600, 2400],  foil: [1400, 2200], accessories: [400, 700] }
  };

  function lbToKg(lb) { return lb * 0.453592; }

  function fmtRange(lo, hi, unit) {
    return Math.round(lo) + '–' + Math.round(hi) + (unit || '');
  }

  function fmtMoney(lo, hi) {
    return '$' + Math.round(lo).toLocaleString() + '–$' + Math.round(hi).toLocaleString();
  }

  function weightAdjustForWing(weightLb) {
    // Rough correction: every ~35lb away from 165lb shifts wing size ~0.5m²
    return ((weightLb - 165) / 35) * 0.5;
  }

  function calculate() {
    var weightLb = parseInt(document.getElementById('weight').value, 10);
    var exp = state.experience, wind = state.wind, budget = state.budget;

    // Wing
    var wing = WIND_BASE_WING[wind] + EXPERIENCE_WING_ADJUST[exp] + weightAdjustForWing(weightLb);
    wing = Math.max(2, Math.round(wing * 2) / 2); // round to nearest 0.5m²
    var altWing = Math.max(2, Math.round((wing - 1.5) * 2) / 2);

    // Board
    var boardVolume = Math.round(lbToKg(weightLb) * BOARD_MULTIPLIER[exp]);

    // Foil
    var foilRange = FOIL_SIZE[exp];

    // Mast
    var mastRange = MAST_LENGTH[exp];

    // Cost
    var c = COST_TABLE[budget];
    var totalLo = c.wing[0] + c.board[0] + c.foil[0] + c.accessories[0];
    var totalHi = c.wing[1] + c.board[1] + c.foil[1] + c.accessories[1];

    document.getElementById('outWing').textContent = wing + 'm²';
    document.getElementById('outWingSub').textContent =
      'Add a ' + altWing + 'm² for stronger-wind days';

    document.getElementById('outBoard').textContent = boardVolume + 'L';
    document.getElementById('outBoardSub').textContent = BOARD_TYPE[exp];

    document.getElementById('outFoil').textContent = fmtRange(foilRange[0], foilRange[1], ' cm²');
    document.getElementById('outFoilSub').textContent =
      exp === 'expert' ? 'Smaller, faster, less forgiving' : 'Bigger surface = more stability & lift';

    document.getElementById('outMast').textContent = fmtRange(mastRange[0], mastRange[1], ' cm');
    document.getElementById('outMastSub').textContent =
      exp === 'new' || exp === 'beginner' ? 'Shorter = safer while you\'re learning' : 'More clearance for carving & maneuvers';

    document.getElementById('outCostTotal').textContent = fmtMoney(totalLo, totalHi) + ' total package';
    document.getElementById('costWing').textContent = fmtMoney(c.wing[0], c.wing[1]);
    document.getElementById('costBoard').textContent = fmtMoney(c.board[0], c.board[1]);
    document.getElementById('costFoil').textContent = fmtMoney(c.foil[0], c.foil[1]);
    document.getElementById('costAccessories').textContent = fmtMoney(c.accessories[0], c.accessories[1]);

    document.getElementById('results').classList.add('visible');
  }

  function wireSegmented(groupId, stateKey, defaultValue) {
    var group = document.getElementById(groupId);
    var buttons = group.querySelectorAll('button');
    buttons.forEach(function (btn) {
      if (btn.dataset.value === defaultValue) btn.classList.add('active');
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state[stateKey] = btn.dataset.value;
      });
    });
  }

  wireSegmented('experience', 'experience', state.experience);
  wireSegmented('wind', 'wind', state.wind);
  wireSegmented('budget', 'budget', state.budget);

  var weightSlider = document.getElementById('weight');
  var weightOut = document.getElementById('weightOut');
  weightSlider.addEventListener('input', function () {
    weightOut.textContent = weightSlider.value + ' lb';
  });

  document.getElementById('calcBtn').addEventListener('click', calculate);
})();
