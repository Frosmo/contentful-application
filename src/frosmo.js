import { Grid } from "@contentful/forma-36-react-components";

const GRANIITTI_URLS = {
    'eu': 'https://graniitti.inpref.com/v0',
    'fi1': 'https://graniitti.fi1.frosmo.com/v0',
    'eu2': 'https://graniitti.fi1.frosmo.com/v0',
    'asia': 'https://graniitti.fi1.frosmo.com/v0',
    'us': 'https://graniitti.fi1.frosmo.com/v0',
};

export interface FrosmoSite {
    url: string;
}

export function getBaseUrl(region) {
    return GRANIITTI_URLS[region];
}