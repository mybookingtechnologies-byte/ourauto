import { MeiliSearch } from "meilisearch";

const host = process.env.MEILI_HOST;

export const meili = host
  ? new MeiliSearch({
      host,
      apiKey: process.env.MEILI_MASTER_KEY,
    })
  : null;
