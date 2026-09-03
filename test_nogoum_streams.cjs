const https = require('https');
const http = require('http');

async function testUrl(url) {
  return new Promise(resolve => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        resolve({ url, status: res.statusCode, type: res.headers['content-type'], location: res.headers['location'] });
        res.destroy();
      });
      req.on('error', e => resolve({ url, error: e.message }));
      req.setTimeout(4000, () => { req.destroy(); resolve({ url, error: 'timeout' }); });
    } catch (e) {
      resolve({ url, error: e.message });
    }
  });
}

async function run() {
  const candidates = [
    'https://audio.nrpstream.com/listen/nogoumfm/radio.mp3',
    'https://audio.nrpstream.com/hls/nogoumfm/live.m3u8',
    'http://audio.nrpstream.com/listen/nogoumfm/radio.mp3',
    'https://stream.zeno.fm/qb1zvsykm98uv',
    'https://icecast.nrpstream.com/nogoumfm',
    'https://securestreams.autopo.st:1140/stream'
  ];

  for (const c of candidates) {
    console.log(await testUrl(c));
  }
}
run();
