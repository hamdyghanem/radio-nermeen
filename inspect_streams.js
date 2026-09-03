const https = require('https');
const fs = require('fs');

function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', ...headers } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching main page...');
  const main = await fetch('https://egyptradio.net/');
  fs.writeFileSync('egyptradio_main.html', main.body);
  console.log('Main page saved, length:', main.body.length);

  // Look for js scripts
  const scripts = [...main.body.matchAll(/src="([^"]+main[^"]+\.js)"/g)].map(m => m[1]);
  console.log('Scripts:', scripts);

  // Look for stations api
  const apiMatch = main.body.match(/https:\/\/api\.instant\.audio\/[^"']+/g);
  console.log('API matches on main:', apiMatch);

  // Also check station page
  const st = await fetch('https://egyptradio.net/9090/');
  fs.writeFileSync('egyptradio_9090.html', st.body);
  const stApi = st.body.match(/https:\/\/api\.instant\.audio\/[^"']+/g);
  console.log('API matches on 9090:', stApi);
  
  // Try fetching API with Referer
  if (stApi && stApi.length > 0) {
    const apiUrl = stApi[0];
    console.log('Trying API URL with referer:', apiUrl);
    const apiRes = await fetch(apiUrl, {
      'Referer': 'https://egyptradio.net/9090/',
      'Origin': 'https://egyptradio.net',
      'Accept': 'application/json, text/plain, */*'
    });
    console.log('API status:', apiRes.status);
    console.log('API body:', apiRes.body.slice(0, 500));
  }
}

run().catch(console.error);
