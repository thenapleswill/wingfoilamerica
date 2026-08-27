---
layout: layouts/guide-page.njk
title: "What Gear Do You Actually Need"
description: "An interactive calculator to help you size your first wing, board, and foil setup."
order: 2
extraCss:
  - /assets/css/gear-calculator.css
extraJs:
  - /assets/js/gear-calculator.js
---

Answer a few questions about your weight, local wind conditions, and goals, and this
calculator will suggest a starter wing, board, and foil size range.

<div id="gear-calculator-root">
<div class="calc-wrap">

  <div class="card">
    <div class="field">
      <label>Your weight <span class="hint">(affects wing power, board float, and foil lift)</span></label>
      <input type="range" id="weight" min="90" max="260" step="5" value="165">
      <div class="range-value"><span>90 lb</span><strong id="weightOut">165 lb</strong><span>260 lb</span></div>
    </div>

    <div class="field">
      <label>Your experience</label>
      <div class="segmented" id="experience">
        <button data-value="new"><strong>Never wing foiled</strong>Interested, excited to learn</button>
        <button data-value="beginner"><strong>Been a few times</strong>Very much a beginner</button>
        <button data-value="intermediate"><strong>A couple years in</strong>Comfortable, building skill</button>
        <button data-value="expert"><strong>Competent / expert</strong>Honing skills, new gear</button>
      </div>
    </div>

    <div class="field">
      <label>Typical wind where you'll ride</label>
      <div class="segmented" id="wind">
        <button data-value="light"><strong>Light</strong>10–15 mph</button>
        <button data-value="moderate"><strong>Moderate</strong>15–20 mph</button>
        <button data-value="strong"><strong>Strong</strong>20–25 mph</button>
        <button data-value="verystrong"><strong>Very strong</strong>25+ mph</button>
      </div>
    </div>

    <div class="field">
      <label>Budget</label>
      <div class="segmented" id="budget">
        <button data-value="used"><strong>Keep it lean</strong>Used gear, budget-conscious</button>
        <button data-value="mid"><strong>Mid-range</strong>Mix of new and value picks</button>
        <button data-value="premium"><strong>No real constraint</strong>New, top-of-line</button>
      </div>
    </div>

    <button class="btn-primary" id="calcBtn">Get My Recommendation</button>
  </div>

  <div class="card results" id="results">
    <div class="result-grid">
      <div class="result-tile">
        <div class="label">Wing</div>
        <div class="value" id="outWing">–</div>
        <div class="sub" id="outWingSub"></div>
      </div>
      <div class="result-tile">
        <div class="label">Board</div>
        <div class="value" id="outBoard">–</div>
        <div class="sub" id="outBoardSub"></div>
      </div>
      <div class="result-tile">
        <div class="label">Foil (front wing)</div>
        <div class="value" id="outFoil">–</div>
        <div class="sub" id="outFoilSub"></div>
      </div>
      <div class="result-tile">
        <div class="label">Mast length</div>
        <div class="value" id="outMast">–</div>
        <div class="sub" id="outMastSub"></div>
      </div>
    </div>

    <div class="cost-box">
      <div class="total" id="outCostTotal">$0</div>
      <div class="cost-line"><span>Wing</span><span id="costWing"></span></div>
      <div class="cost-line"><span>Board</span><span id="costBoard"></span></div>
      <div class="cost-line"><span>Foil set (wing + fuselage + stab + mast)</span><span id="costFoil"></span></div>
      <div class="cost-line"><span>Harness, pump, bag, accessories</span><span id="costAccessories"></span></div>
    </div>

    <p class="note">
      These are starting points, not gospel — riders vary, and every quiver grows over time
      (most wing foilers end up owning 2+ wings for different wind days). Treat this as where
      to start shopping, not the only right answer.
    </p>
  </div>

</div>
</div>

Not sure yet what gear to even look at? Read [New vs. Used Gear & Budget](/beginner-guide/new-vs-used-gear-and-budget/)
and [Common Beginner Mistakes](/beginner-guide/common-beginner-mistakes/) first.
