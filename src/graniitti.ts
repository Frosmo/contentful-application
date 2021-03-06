type Region = 'eu' | 'fi1' | 'asia' | 'us' | 'eu2';
export interface Config {
  token: string;
  region: Region;
  siteId: number;
}

const GRANIITTI_URLS = {
  'eu': 'https://graniitti.inpref.com/v0',
  'fi1': 'https://graniitti.fi1.frosmo.com/v0',
  'eu2': 'https://graniitti.eu2.frosmo.com/v0',
  'asia': 'https://graniitti.asia.frosmo.com/v0',
  'us': 'https://graniitti.us.frosmo.com/v0',
};

export interface Site {
  id: number,
  url: string;
}

export interface SegmentGroup {
  name: string;
}

export interface Segment {
  segment_name: string,
  title: string;
  group: null | SegmentGroup
}

export class GraniittiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraniittiError";
  }
}

async function request(
  url: string,
  token: string,
): Promise<any | void> {
  const res = await fetch(`${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  });

  const result = await res.json();

  if (!res.ok) {
    switch (res.status) {
      // The server could not authenticate the request because the access token is invalid or missing.
      case 401:
        throw new GraniittiError('The Frosmo Graniitti API access token is invalid. Check that the token and region are valid for the specified site.');
      // The server could not authorize access to the target resource because the access token does not grant sufficient permission.
      case 403:
        throw new GraniittiError('The Frosmo Graniitti API access token is not valid for the specified site.');
      // The server could not find the requested site.
      case 404:
        throw new GraniittiError('The site does not exist. Check that the site ID is correct.');
      default:
        throw new GraniittiError(result.message || 'The app encountered an unknown error.')
    }
  }

  return result;
}

export async function getSite(config: Config): Promise<Site> {
  const url = `${getBaseUrl(config.region)}/sites/${config.siteId}`;
  return request(url, config.token);
}

export async function getSites(config: Config): Promise<Site[]> {
  const url = `${getBaseUrl(config.region)}/sites?fields=id,url`;
  return request(url, config.token);
}

export async function getSegments(config: Config): Promise<Segment[]> {
  const url = `${getBaseUrl(config.region)}/sites/${config.siteId}/segments?includes=group`;
  const segments = await request(url, config.token);
  return segments.map((s: Segment) => {
    return {
      title: s.title,
      segment_name: s.segment_name,
      group: s.group
    }
  });
}

export function getBaseUrl(region: Config['region']) {
  return GRANIITTI_URLS[region];
}
