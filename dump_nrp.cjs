const https = require('https');
const fs = require('fs');

https.get('https://audio.nrpstream.com/public/nogoumfm/embed', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    fs.writeFileSync('nrp_embed.html', data);
    console.log('Wrote nrp_embed.html, lines:', data.split('\n').length);
  });
});
