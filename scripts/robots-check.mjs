// Minimal robots.txt parser shared by the diagnostic and the real scraper.
// Honors the "*" user-agent group only (the brief asks to respect robots.txt,
// not to identify as a specific named crawler), using standard longest-match
// -wins semantics between Allow/Disallow rules.

export function parseRobots(robotsTxt) {
  const lines = robotsTxt.split(/\r?\n/).map((l) => l.replace(/#.*$/, "").trim());
  const groups = []; // { agents: string[], rules: {type, path}[] }
  let current = null;
  for (const line of lines) {
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === "user-agent") {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((field === "disallow" || field === "allow") && current) {
      current.rules.push({ type: field, path: value });
    }
  }
  const starGroup = groups.find((g) => g.agents.includes("*"));
  return { rules: starGroup ? starGroup.rules : [] };
}

export function isAllowed(robotsTxt, pathname) {
  const { rules } = parseRobots(robotsTxt);
  let best = null; // { type, path }
  for (const rule of rules) {
    if (rule.path === "") continue; // empty Disallow means "allow everything"
    if (pathname.startsWith(rule.path)) {
      if (!best || rule.path.length > best.path.length) best = rule;
    }
  }
  if (!best) return true;
  return best.type === "allow";
}
