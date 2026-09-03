const https = require('https');

https.get('https://audio.nrpstream.com/public/nogoumfm/embed', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('NRP Embed HTML length:', data.length);
    const audioMatches = data.match(/https?:\/\/[^\s"'<>]+\.(?:mp3|aac|m3u8)[^\s"'<>]*/gi) || [];
    const listenMatches = data.match(/https?:\/\/[^\s"'<>]+listen[^\s"'<>]*/gi) || [];
    const jsonMatches = data.match(/https?:\/\/[^\s"'<>]+\.json[^\s"'<>]*/gi) || [];
    console.log('Audio matches:', audioMatches);
    console.log('Listen matches:', listenMatches);
    console.log('Any URLs:', data.match(/https?:\/\/[a-zA-Z0-9./_-]+/g));
  });
}).on('error', e => console.error(e));
