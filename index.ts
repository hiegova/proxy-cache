import parseUrl from 'parseurl';
import { getCache, getRequestBody, headersConvert, headersToString, setCache } from './helpers';
import fetch, { HeadersInit } from 'node-fetch';
import zlib from 'zlib';
import http, { RequestListener } from 'http';


/** ================ Config ================ */
/** Specify the URL of your real server API */
const REAL_API_ROOT = 'https://stores-api.zakaz.ua';
/** Port the server will listen on */
const LOCAL_PORT = 8000;
/** The IP address or host on the local network on which the server is running */
const LOCAL_HOST = 'http://192.168.3.34';
const CACHE_IS_ENABLED = true;
export const CACHE_DIR = './cache';
/** ================ Config ================ */


const requestListener: RequestListener = async (req, res) => {
  const parsedUrl = parseUrl(req)!;
  const apiUrl = [
    REAL_API_ROOT,
    parsedUrl.pathname || '',
    parsedUrl.search || '',
  ].join('');

  const cacheKey = `${req.method}__${apiUrl.split(REAL_API_ROOT)[1].replace(/:|\?|-|\.|\//g, '_')}`;
  const cachedResponse = await getCache(cacheKey);

  if (CACHE_IS_ENABLED && cachedResponse) {
    Object.keys(cachedResponse.headers).forEach((key) => {
      res.setHeader(key, cachedResponse.headers[key]);
    });
    res.statusCode = cachedResponse.status;

    if (cachedResponse.body) {
      if (cachedResponse.headers['content-encoding']?.includes('gzip')) {
        const buffer = new Buffer(JSON.stringify(cachedResponse.body));
        zlib.gzip(buffer, function (_, result) {
          res.end(result);
        });
      } else {
        res.end(JSON.stringify(cachedResponse.body));
      }
    }

    console.log('CACHE ', req.method, apiUrl);

    return;
  }

  console.log(req.method, apiUrl);

  const requestHeaders: HeadersInit = {
    ...headersToString(req.headers),
    origin: REAL_API_ROOT,
  };

  const apiRes = await fetch(apiUrl, {
    method: req.method,
    body: JSON.stringify(getRequestBody(req)),
    headers: requestHeaders,
  });

  const fakeOrigin = req.headers.origin || '*';

  apiRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.setHeader('access-control-allow-origin', fakeOrigin);
  res.statusCode = apiRes.status;

  const buffer = await apiRes.buffer();
  if (apiRes.headers.get('content-encoding')?.includes('gzip')) {
    zlib.gzip(buffer, function (_, result) {
      res.end(result);
    });
  } else {
    res.end(buffer);
  }

  if (CACHE_IS_ENABLED && !cachedResponse) {
    setCache({
      key: cacheKey,
      status: apiRes.status,
      body: buffer.toString() ? JSON.parse(buffer.toString()) : null,
      headers: {
        ...headersConvert(apiRes.headers),
        'access-control-allow-origin': fakeOrigin,
      },
    });
  }
};


const server = http.createServer(requestListener);
server.listen(LOCAL_PORT);
console.log(`HTTP webserver running. Access it at: ${LOCAL_HOST}:${LOCAL_PORT}`);
