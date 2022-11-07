import { promises as fs } from 'fs';
import { IncomingMessage } from 'http';
import { Headers } from 'node-fetch';
import { CACHE_DIR } from '.';

export interface Data {
  status: number;
  headers: string[][];
  body: string;
}

export async function setCache({ key, body, headers, status }) {
  const fileName = `${CACHE_DIR}/${key}`;

  const data = {
    status,
    headers,
    body,
  };

  try {
    await fs.mkdir('./cache');
  } catch (_err) {
    // nothing to do here.
  }
  await fs.writeFile(fileName, JSON.stringify(data));
}

export async function getCache(key: string): Promise<null | Data> {
  const fileName = `${CACHE_DIR}/${key}`;
  let cache;

  try {
    cache = (await fs.readFile(fileName)).toString();
  } catch (_e) {
    return null;
  }

  return JSON.parse(cache);
}

export function headersToString(headers): string[][] {
  const result: string[][] = [];

  Object.keys(headers).forEach((key) => {
    if (key === 'host') {
      return;
    }

    if (Array.isArray(headers[key])) {
      // @ts-ignore
      result[key] = headers[key].join(', ');
    } else {
      result[key] = headers[key];
    }
  });

  return result;
}

export function headersConvert(headers: Headers) {
  const result = {};

  headers.forEach((value, key) => {
    if (Array.isArray(value)) {
      // @ts-ignore
      result[key] = value.join(', ');
    } else {
      result[key] = value;
    }
  });

  return result;
}

export function getRequestBody(req: IncomingMessage) {
  let chunks: any[] = [];

  req.on('error', (err) => {
    console.error(err);
  }).on('data', (chunk) => {
    chunks.push(chunk);
  }).on('end', () => {
    return Buffer.concat(chunks).toString();
  });
}
