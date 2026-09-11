---
layout: layouts/article-page.njk
title: "What's New in Gear"
eyebrow: "Gear & Brands"
description: "New wing, board, and hydrofoil releases from the brands we track, checked automatically every week — every entry linked to a real source, nothing invented."
---

We check the official sites of the brands covered on this site — Naish, Armstrong Foils, Slingshot Sports, Duotone, F-One, North, Cabrinha, Ozone, and Axis Foils — once a week for genuinely new wings, boards, hydrofoils, and accessories. If a brand hasn't actually released or announced anything new, nothing gets added — this list only grows when there's something real to report, with a working link to where we found it.

{% if gearNewsState.lastChecked %}<p class="gear-news-checked-note">Last checked: {{ gearNewsState.lastChecked }}</p>{% endif %}

{% if gearNews and gearNews.length > 0 %}
<div class="gear-news-list">
  {% for item in gearNews %}
  <article class="gear-news-item">
    <div class="gear-news-item-head">
      <span class="gear-news-category gear-news-category--{{ item.category }}">{{ item.category }}</span>
      <time class="gear-news-date" datetime="{{ item.date }}">{{ item.date }}</time>
    </div>
    <h2 class="gear-news-item-title">{{ item.brand }} &mdash; {{ item.product }}</h2>
    <p class="gear-news-item-summary">{{ item.summary }}</p>
    <p class="gear-news-item-source">Source: <a href="{{ item.sourceUrl }}" target="_blank" rel="noopener">{{ item.sourceName }}</a></p>
  </article>
  {% endfor %}
</div>
{% else %}
<p class="gear-news-empty">Nothing new to report yet &mdash; check back soon.</p>
{% endif %}

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "What's New in Gear",
  "description": "New wing foiling gear releases and announcements, checked weekly.",
  "url": "{{ site.siteUrl }}{{ page.url | url }}",
  "numberOfItems": {{ gearNews.length if gearNews else 0 }},
  "itemListElement": [
    {%- for item in gearNews %}
    {
      "@type": "ListItem",
      "position": {{ loop.index }},
      "item": {
        "@type": "Product",
        "name": {{ (item.brand + " " + item.product) | jsonify | safe }},
        "brand": {{ item.brand | jsonify | safe }},
        "category": {{ item.category | jsonify | safe }},
        "description": {{ item.summary | jsonify | safe }},
        "releaseDate": {{ item.date | jsonify | safe }},
        "url": {{ item.sourceUrl | jsonify | safe }}
      }
    }{% if not loop.last %},{% endif %}
    {%- endfor %}
  ]
}
</script>
