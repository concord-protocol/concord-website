/**
 * Direct download links for clients that only publish versioned filenames.
 *
 * GitHub's `releases/latest/download/<name>` only works when the asset's name
 * is stable, and Vector and Amethyst both put the version in theirs. So the
 * newest file per platform is looked up once, at build time — the same lookup
 * vectorapp.io does in the browser — and a link goes out of date only as far
 * as the next deploy. An older asset stays downloadable, so a stale link is
 * one version behind, not broken.
 *
 * A build never requires the network: offline, rate-limited, or with an asset
 * renamed upstream, each link falls back to the release page, which is what
 * these cards linked before.
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
