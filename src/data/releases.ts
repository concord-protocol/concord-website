/**
 * Direct download links for clients whose asset names include the version
 * (Vector, Amethyst), so GitHub's `releases/latest/download/<name>` can't be
 * used. The latest release is looked up at build time; links update on the
 * next deploy.
 *
 * If the lookup fails (offline, rate-limited, asset renamed), the link falls
 * back to the repo's latest release page. Set GITHUB_TOKEN to raise the rate
 * limit.
 */

interface Asset {
  name: string;
  browser_download_url: string;
}

const cache = new Map<string, Promise<Asset[]>>();

function assets(repo: string): Promise<Asset[]> {
  let pending = cache.get(repo);
  if (!pending) {
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    pending = fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    })
      .then((response) => (response.ok ? response.json() : { assets: [] }))
      .then((release) => (release.assets ?? []) as Asset[])
      .catch(() => []);
    cache.set(repo, pending);
  }
  return pending;
}

/** The newest asset in `repo` whose name matches, or its release page. */
export async function latestAsset(repo: string, pattern: RegExp): Promise<string> {
  const match = (await assets(repo)).find((asset) => pattern.test(asset.name));
  return match?.browser_download_url ?? `https://github.com/${repo}/releases/latest`;
}
