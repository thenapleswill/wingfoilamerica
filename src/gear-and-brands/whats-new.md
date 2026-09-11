---
layout: layouts/article-page.njk
title: "What's New in Gear"
eyebrow: "Gear & Brands"
description: "New posts from the news pages of the brands we track, checked automatically every week — every entry a real link this site's own scraper found, nothing invented."
---

Once a week, a script checks the official news/blog page of each brand covered on this site — Naish, Armstrong Foils, Slingshot Sports, Duotone, F-One, North, Cabrinha, Ozone, and Axis Foils — for posts it hasn't seen before. No AI is involved: it's a plain scraper that reads each page and links directly to whatever it finds. If a brand hasn't posted anything new, nothing gets added here — this list only grows when there's something real to link to.

{% if gearNewsState.lastChecked %}<p class="gear-news-checked-note">Last checked: {{ gearNewsState.lastChecked }}</p>{% endif %}

{% if gearNews and gearNews.length > 0 %}
<div class="gear-news-list">
  {% for item in gearNews %}
  <article class="gear-news-item">
    <div class="gear-news-item-head">
      <span class="gear-news-brand">{{ item.brand }}</span>
      <time class="gear-news-date" datetime="{{ item.dateFound }}">Found {{ item.dateFound }}</time>
    </div>
    <h2 class="gear-news-item-title"><a href="{{ item.url }}" target="_blank" rel="noopener">{{ item.title }}</a></h2>
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
  "description": "New posts from tracked wing foiling brands' own news pages, checked weekly.",
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
