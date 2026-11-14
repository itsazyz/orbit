/** Fire-and-forget analytics event for a public planet. */
export function trackPlanet(
  username: string,
  event: 'view' | 'star_open' | 'link_click' | 'share',
  extra: { dim?: string; s?: string | null; ref?: string } = {}
) {
  try {
    const payload = JSON.stringify({ username, event, ...extra });
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon('/api/track', blob)) return;
    void fetch('/api/track', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    });
  } catch {
    /* analytics must never break the page */
  }
}
