const VIDEO_ID = "-Ij_IpABKGA";

async function main() {
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${VIDEO_ID}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  const html = await watchRes.text();

  const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  const description = descMatch ? JSON.parse('"' + descMatch[1] + '"') : null;
  console.log("=== DESCRIPTION ===");
  console.log(description);

  const titleMatch = html.match(/<meta name="title" content="([^"]*)"/);
  console.log("=== TITLE ===");
  console.log(titleMatch ? titleMatch[1] : "not found");

  // Try to find caption track list
  const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
  if (captionMatch) {
    try {
      const tracks = JSON.parse(captionMatch[1]);
      console.log("=== CAPTION TRACKS ===");
      for (const t of tracks) {
        console.log(t.languageCode, t.baseUrl);
      }
      const enTrack = tracks.find((t) => t.languageCode === "en") || tracks[0];
      if (enTrack) {
        const capRes = await fetch(enTrack.baseUrl);
        const capXml = await capRes.text();
        console.log("=== CAPTIONS (first 4000 chars) ===");
        console.log(capXml.slice(0, 4000));
      }
    } catch (e) {
      console.log("caption parse error:", e.message);
    }
  } else {
    console.log("=== NO CAPTION TRACKS FOUND ===");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
