// Netlify serverless function: reads a hand-drawn physics sketch with Claude vision.
// Keeps your API key server-side. Set ANTHROPIC_API_KEY in Netlify env vars.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { statusCode: 200, body: JSON.stringify({ error: "no_key" }) };

  let image;
  try { image = JSON.parse(event.body || "{}").image; } catch { return { statusCode: 400, body: "bad json" }; }
  if (!image) return { statusCode: 400, body: "no image" };

  const system = `You read a hand-drawn sketch of a classic introductory-physics system and map it to ONE of these systems, extracting plausible parameters from the drawing (tilt -> angles, relative sizes -> masses/lengths). Use EXACTLY these keys:
pendulum {length_m, angle_deg, gravity, damping}
double_pendulum {l1_m, l2_m, m1_kg, m2_kg, angle1_deg, angle2_deg, gravity}
projectile {speed_ms, angle_deg, height_m, gravity}
incline {angle_deg, mass_kg, mu, gravity}
spring {k_Nm, mass_kg, amplitude_m, damping, orientation}
atwood {m1_kg, m2_kg, gravity}
orbit {radius, speed_frac, gravity}
bounce {height_m, restitution, gravity}
Default gravity 9.81. orientation is "vertical" or "horizontal". speed_frac is fraction of circular speed (1.0=circular).
Output ONLY minified JSON: {"system":"<one>","interpretation":"<=22 words, first person, what you see + the setup","confidence":<0-100>,"params":{...},"note":"<=14 words on the governing physics"}
If empty or ambiguous, choose the closest plausible system and lower confidence.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/png", data: image } },
          { type: "text", text: "Interpret this sketch into a physics system." },
        ] }],
      }),
    });
    const data = await res.json();
    const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const c = txt.replace(/```json|```/g, "").trim();
    const s = c.indexOf("{"), e = c.lastIndexOf("}");
    const parsed = JSON.parse(s >= 0 ? c.slice(s, e + 1) : c);
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(parsed) };
  } catch (err) {
    return { statusCode: 200, body: JSON.stringify({ error: "upstream" }) };
  }
};
