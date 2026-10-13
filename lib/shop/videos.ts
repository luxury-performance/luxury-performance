export function youtubeId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    let id: string | null = null;
    if (['youtu.be', 'www.youtu.be'].includes(url.hostname)) id = url.pathname.split('/')[1];
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else if (/^\/(embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split('/')[2];
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
export function videoIds(value: unknown): string[] {
  let urls: unknown = value;
  if (typeof value === 'string') { try { urls = JSON.parse(value); } catch { urls = [value]; } }
  if (!Array.isArray(urls)) return [];
  return [...new Set(urls.map(youtubeId).filter((id): id is string => !!id))];
}
// Read only the product-specific video posters, excluding site-wide/social links.
export function publishedVideoIds(html: string): string[] {
  const urls = [...html.matchAll(/<a\b[^>]*>/gi)].flatMap(([tag]) => {
    const classes = tag.match(/\bclass\s*=\s*(["'])(.*?)\1/i)?.[2].split(/\s+/) || [];
    if (!classes.includes('valvetronic-videos__poster')) return [];
    const href = tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
    return href ? [href.replaceAll('&amp;', '&')] : [];
  });
  return videoIds(urls);
}
