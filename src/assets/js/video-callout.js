(function () {
  // Click-to-load YouTube facade: no iframe (and no YouTube tracking/weight)
  // until a visitor actually clicks the thumbnail. Shared across every page
  // that uses the video-callout partial; harmless no-op on pages with none.
  document.querySelectorAll(".video-callout-media[data-video-id]").forEach(function (media) {
    media.addEventListener("click", function () {
      var videoId = media.dataset.videoId;
      if (!videoId) return;
      var iframe = document.createElement("iframe");
      iframe.className = "video-callout-iframe";
      iframe.src = "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1";
      iframe.title = media.dataset.videoTitle || "YouTube video player";
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      );
      iframe.setAttribute("allowfullscreen", "");
      iframe.frameBorder = "0";
      media.replaceWith(iframe);
    });
  });
})();
