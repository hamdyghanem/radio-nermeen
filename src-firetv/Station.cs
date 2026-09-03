namespace RadioNermeen.FireTV;

public sealed record Station(string Id, string Name, string Freq, string Stream);

public static class Stations
{
    // Verified Egyptian radio streams (ported from the web app's station list).
    public static readonly Station[] All =
    [
        new("nogoum-fm", "نجوم أف أم - Nogoum FM", "100.6 FM", "https://audio.nrpstream.com/listen/nogoumfm/radio.mp3"),
        new("mega-fm-92-7", "ميجا أف أم - Mega FM", "92.7 FM", "https://megafm927.radioca.st/stream/1/"),
        new("nagham-fm", "نغم أف أم - Nagham FM", "105.3 FM", "https://ahmsamir.radioca.st/stream/1/"),
        new("hits", "راديو هيتس - Radio Hits", "88.2 FM", "https://radiohits882.radioca.st/stream/1/"),
        new("shaabi-95", "شعبي أف أم - Shaabi FM", "95.0 FM", "https://radio95.radioca.st/stream/1/"),
        new("nile-fm", "نايل أف أم - Nile FM", "104.2 FM", "https://audio.nrpstream.com/listen/nile_fm/radio.mp3"),
        new("arabic-90s-fm", "التسعينات أف أم - 90s FM", "النوستالجيا", "https://eu1.fastcast4u.com/proxy/prontofm?mp=/stream/1/"),
        new("arab-mix-fm", "عرب ميكس أف أم - Arab Mix", "Mix FM", "https://stream.zeno.fm/efx5psd00qruv"),
        new("arab-mix-drama", "عرب ميكس دراما - Arab Mix Drama", "دراما FM", "https://stream.zeno.fm/egynebf171zuv"),
        new("arab-mix", "راديو مكس عربي - Arab Mix", "أونلاين", "https://stream.zeno.fm/na3vpvn10qruv"),
        new("el-gouna", "راديو الجونة - El Gouna Radio", "100.0 FM", "http://82.201.132.237:8000/;"),
        new("moga", "راديو موجة - Radio Moga", "أونلاين", "http://radio.hhost.host:8040/listen.pls?sid=1"),
        new("banha", "راديو بنها سيتي - Banha City Radio", "أونلاين", "http://whsh4u-panel.com:14113/listen.pls?sid=1"),
        new("egonair", "راديو مصر على الهوا - Egonair", "أونلاين", "https://radio.socialgenix.com/8004/stream"),
        new("sotak", "راديو صوتك - Radio Sotak", "أونلاين", "https://radio.radiosotak.com/sotak_mp3"),
        new("al-aghani", "إذاعة الأغاني المصرية الرسمية", "105.8 FM", "https://stream.zeno.fm/frvxg7wgeq8uv"),
        new("om-kalthoum", "إذاعة أم كلثوم - كوكب الشرق", "تراث مصري", "https://stream.zeno.fm/zsgrfxg71s8uv"),
        new("abdel-halim", "إذاعة عبد الحليم حافظ", "تراث مصري", "https://stream.zeno.fm/8a4eqkd0pnhvv"),
    ];
}
