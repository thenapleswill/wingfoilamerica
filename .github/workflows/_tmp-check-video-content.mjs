const VIDEO_ID = "-Ij_IpABKGA";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function main() {
  // 1. oEmbed — stable, simple, gives real title/author.
  const oembedRes = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + VIDEO_ID)}&format=json`
  );
  console.log("=== OEMBED STATUS ===", oembedRes.status);
  if (oembedRes.ok) {
    const oembed = await oembedRes.json();
    console.log("=== OEMBED ===");
    console.log(JSON.stringify(oembed, null, 2));
  } else {
    console.log(await oembedRes.text());
  }

  // 2. Watch page HTML — try videoDetails.shortDescription (ytInitialPlayerResponse).
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${VIDEO_ID}`, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
  });
  console.log("=== WATCH PAGE STATUS ===", watchRes.status);
  const html = await watchRes.text();
  console.log("=== HTML LENGTH ===", html.length);

  const vdMatch = html.match(/"videoDetails":\{.*?"shortDescription":"((?:[^"\\]|\\.)*)"/);
  console.log("=== videoDetails.shortDescription FOUND ===", !!vdMatch);
  if (vdMatch) {
    try {
      console.log(JSON.parse('"' + vdMatch[1] + '"'));
    } catch (e) {
      console.log("raw:", vdMatch[1].slice(0, 2000));
    }
  }

  const titleMatch = html.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
  console.log("=== title (initial data) ===", titleMatch ? titleMatch[1] : "not found");

  // 3. Caption tracks, broader search.
  const capIdx = html.indexOf("captionTracks");
  console.log("=== captionTracks index ===", capIdx);
  if (capIdx !== -1) {
    console.log(html.slice(capIdx, capIdx + 1500));
  }
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exitCode = 1;
});
