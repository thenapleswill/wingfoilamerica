---
layout: layouts/article-page.njk
title: "What's New in Gear"
eyebrow: "Gear & Brands"
description: "Real posts pulled straight from each tracked brand's own RSS/Atom feed, checked automatically every week — no AI, no paraphrasing, nothing invented."
---

Once a week, a script checks each tracked brand directly: Naish, Armstrong Foils, Slingshot Sports, Cabrinha, Axis Foils, and North each have a real, live RSS/Atom feed, so their posts below are pulled straight from that feed — real title, real publish date, a real excerpt from the feed itself. Duotone, F-One, and Ozone don't currently have a working feed; those three are checked for page changes instead (see below) rather than guessed at. No AI is involved anywhere in this pipeline, and nothing here is paraphrased — every excerpt is the brand's own text, trimmed to length.

{% if gearNewsState.lastChecked %}<p class="gear-news-checked-note">Last checked: {{ gearNewsState.lastChecked }}</p>{% endif %}

{% if gearNews and gearNews.length > 0 %}
<div class="gear-news-list">
  {% for item in gearNews %}
  <article class="gear-news-item">
    <div class="gear-news-item-head">
      <span class="gear-news-brand">{{ item.brand }}</span>
      <time class="gear-news-date" datetime="{{ item.publishedDate or item.dateFound }}">{{ item.publishedDate or item.dateFound }}</time>
    </div>
    <h2 class="gear-news-item-title"><a href="{{ item.url }}" target="_blank" rel="noopener">{{ item.title }}</a></h2>
    {% if item.excerpt %}<p class="gear-news-item-excerpt">{{ item.excerpt }}</p>{% endif %}
  </article>
  {% endfor %}
</div>
{% else %}
<p class="gear-news-empty">Nothing new to report yet &mdash; check back soon.</p>
{% endif %}

{% if gearNewsManualReview and gearNewsManualReview.length > 0 %}
<h2>Brands worth a manual check</h2>
<p class="gear-news-manual-review-note">These brands don't have a working feed to pull from automatically. Their news page's content changed since the last check — worth a human look rather than a guess at what's new.</p>
<ul class="gear-news-manual-review-list">
  {% for flag in gearNewsManualReview %}
  <li><strong>{{ flag.brand }}</strong> — page changed {{ flag.detectedAt }} — <a href="{{ flag.url }}" target="_blank" rel="noopener">check their news page &rarr;</a></li>
  {% endfor %}
</ul>
{% endif %}

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "What's New in Gear",
  "description": "Real posts pulled from tracked wing foiling brands' own RSS/Atom feeds, checked weekly.",
  "url": "{{ site.siteUrl }}{{ page.url | url }}",
  "numberOfItems": {{ gearNews.length if gearNews else 0 }},
  "itemListElement": [
    {%- for item in gearNews %}
    {
      "@type": "ListItem",
      "position": {{ loop.index }},
      "item": {
        "@type": "CreativeWork",
        "name": {{ item.title | jsonify | safe }},
        "url": {{ item.url | jsonify | safe }},
        "datePublished": {{ (item.publishedDate or item.dateFound) | jsonify | safe }},
        "creator": {
          "@type": "Organization",
          "name": {{ item.brand | jsonify | safe }}
        }
      }
    }{% if not loop.last %},{% endif %}
    {%- endfor %}
  ]
}
</script>
