const https = require('https');

https.get('https://www.nogoumfm.net/live-radio-stream/', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const urls = [];
    const regex = /https?:\/\/[^\s"'<>]+\.(?:mp3|m3u8|aac)/gi;
    let m;
    while ((m = regex.exec(data)) !== null) {
      urls.push(m[0]);
    }
    const genericStream = /https?:\/\/[^\s"'<>]+(?:stream|icecast|audio|live|nrp)[^\s"'<>]*/gi;
    while ((m = genericStream.exec(data)) !== null) {
      urls.push(m[0]);
    }
    console.log('Stream matches:', Array.from(new Set(urls)));
    
    // Also look for iframe or audio tags
    const iframes = data.match(/<iframe[^>]+src=["']([^"']+)["']/gi);
    console.log('Iframes:', iframes);
    const audios = data.match(/<audio[^>]*>([\s\S]*?)<\/audio>/gi);
    console.log('Audios:', audios);
  });
}).on('error', e => console.error(e));
