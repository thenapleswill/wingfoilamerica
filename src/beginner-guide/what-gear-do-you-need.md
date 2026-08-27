---
layout: layouts/guide-page.njk
title: "What Gear Do You Actually Need?"
description: "A quick calculator that turns your weight, experience, and local wind into a real starting-point gear setup, plus the principles behind every wing foil gear decision."
order: 2
extraCss:
  - /assets/css/gear-calculator.css
extraJs:
  - /assets/js/gear-calculator.js
---

Ask five different people what wing you should buy and you'll get five different answers, and five different opinions on the board and foil to go with it. That's not because the sport is complicated — it's because there's no single right setup. The gear that gets one rider planing is the wrong call for someone twenty pounds lighter, riding a gustier beach, or picking this up for the first time versus their second season.

That gap between "what works for someone" and "what works for you" is the single biggest thing that trips people up before they've even gotten wet. New riders face a wall of wing sizes, board volumes, and foil configurations, get pulled in three directions by well-meaning advice, and either freeze up or spend real money on a setup that fights them from day one. An oversized foil, a board with too little volume to find your feet on, a wing sized for someone else's weight and wind — these aren't rare mistakes, they're the default outcome of guessing.

The calculator below exists to take the guessing out of it. Enter your body weight, experience level, the wind you actually ride in, and roughly what you want to spend, and it hands back a starting-point recommendation: a wing size, board volume, foil size, and mast length, plus a ballpark total cost. Treat it as a well-informed first draft, not a verdict — it can't feel the water or know your local sandbar, so use the output as the start of a conversation with a shop or instructor, not the last word.

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

## What's actually driving those numbers

However you use the calculator, it's worth understanding why those four inputs are the ones that matter.

**Body weight** sets the baseline for nearly everything else — how much lift you need from the wing and foil, and how much board volume you need to float comfortably before you're up on foil.

**Experience level** matters because skill changes what "manageable" means. A beginner needs more stability and forgiveness built into every piece of gear; a rider with a season or two under them can handle smaller, twitchier equipment that rewards precision instead of punishing it.

**Typical local wind** decides how much power the wing needs to generate. A wing sized for a gusty 25-knot afternoon will be miserable on a light 12-knot day and vice versa — gear has to match the wind you'll actually ride, not the wind on your best day ever.

**Budget** shapes what's realistic to buy new versus used, and whether you spread money across pieces or concentrate it into one solid setup. It doesn't change the physics, but it changes the plan.

One more reality worth expecting early: almost nobody rides one wing size forever. As you progress, you'll likely build a small "quiver" of a couple of wing sizes for different wind strengths, since no single wing covers a truly light day and a truly windy one equally well. Boards and foils change less often — the wing is the piece most riders end up doubling up on.

If you're a total beginner, size your board up slightly beyond what feels minimally necessary. Extra volume buys stability while you're finding your balance, and that stability is what lets you log time on the water instead of fighting to stay on the board. Resist buying "advanced" gear on day one to save a step later — smaller, twitchier equipment is a reward you earn with hours, not a shortcut to them. Let your gear evolve alongside your skill.

For a deeper look at spending that budget wisely, see [New vs. Used Gear & Realistic Budgets](/beginner-guide/new-vs-used-gear-and-budget/).
