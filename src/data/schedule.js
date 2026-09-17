// Cairo Time Schedule & Show Artwork Engine for Radio Nermeen

export function getCairoNow() {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    let day = 'Sun';
    let hour = 0;
    let minute = 0;

    for (const p of parts) {
      if (p.type === 'weekday') day = p.value;
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
    }

    if (hour === 24) hour = 0;

    return { day, hour, minute };
  } catch (e) {
    const d = new Date();
    return { day: 'Sun', hour: d.getHours(), minute: d.getMinutes() };
  }
}

// Full Day Schedule Resolver
export function getStationDailySchedule(stationId) {
  const { day, hour: currentHour } = getCairoNow();
  const isWeekend = day === 'Fri' || day === 'Sat';

  if (stationId === 'nogoum-fm') {
    const defaultNogoumLogo = 'https://cdn.instant.audio/images/logos/egyptradio-net/nogoum-fm.png';

    if (isWeekend) {
      return [
        {
          start: '02:00',
          end: '08:00',
          startH: 2,
          endH: 8,
          title: 'نجوم زمان وأحلى أغاني الليل',
          host: 'نجوم إف إم',
          art: defaultNogoumLogo,
          desc: 'روائع الأغاني الكلاسيكية والطرب الأصيل'
        },
        {
          start: '08:00',
          end: '14:00',
          startH: 8,
          endH: 14,
          title: 'صباح الويك إند وجمعة مباركة',
          host: 'نجوم إف إم',
          art: defaultNogoumLogo,
          desc: 'أغاني الصباح المبهجة وفقرات الويك إند'
        },
        {
          start: '14:00',
          end: '18:00',
          startH: 14,
          endH: 18,
          title: 'كوكتيل ويك إند نجوم',
          host: 'أجمل الأغاني المنوعة',
          art: defaultNogoumLogo,
          desc: 'أحدث الأغاني العربية والمصرية المعاصرة'
        },
        {
          start: '18:00',
          end: '20:00',
          startH: 18,
          endH: 20,
          title: 'أجمد أغاني الأسبوع',
          host: 'نجوم إف إم 100.6',
          art: defaultNogoumLogo,
          desc: 'سباق وتوب أغاني الأسبوع'
        },
        {
          start: '20:00',
          end: '02:00',
          startH: 20,
          endH: 26, // past midnight
          title: 'سهرة الويك إند وأحلى الأغاني',
          host: 'نجوم إف إم 100.6',
          art: defaultNogoumLogo,
          desc: 'سهرة غنائية مميزة حتى الفجر'
        }
      ].map(item => ({
        ...item,
        isCurrent: item.endH > 24 
          ? (currentHour >= item.startH || currentHour < item.endH - 24)
          : (currentHour >= item.startH && currentHour < item.endH)
      }));
    }

    // Weekdays (Sun - Thu)
    const shows = [
      {
        start: '00:00',
        end: '02:00',
        startH: 0,
        endH: 2,
        title: (day === 'Sun' || day === 'Tue') ? 'برنامج: أنا والنجوم وهواك ❤️' : 'أغاني وسهرة الليل 🌙',
        host: (day === 'Sun' || day === 'Tue') ? 'أسامة منير' : 'نجوم إف إم',
        art: (day === 'Sun' || day === 'Tue') 
          ? 'https://images.weserv.nl/?url=www.nogoumfm.net/wp-content/uploads/2015/09/Osama-Mounir.jpg&w=512&h=512&fit=cover'
          : defaultNogoumLogo,
        desc: 'أشهر البرامج العاطفية والاجتماعية في العالم العربي'
      },
      {
        start: '02:00',
        end: '08:00',
        startH: 2,
        endH: 8,
        title: 'نجوم زمان وأحلى الأغاني الكلاسيكية 🎶',
        host: 'نجوم إف إم 100.6',
        art: defaultNogoumLogo,
        desc: 'كلوديات وأغاني الزمن الجميل في هدوء الليل'
      },
      {
        start: '08:00',
        end: '10:00',
        startH: 8,
        endH: 10,
        title: 'برنامج: عيش صباحك ☀️',
        host: 'يوسف التهامي وفانا إمام',
        art: defaultNogoumLogo,
        desc: 'بداية يومك بطاقة ونشاط وأهم الأخبار والأغاني'
      },
      {
        start: '10:00',
        end: '12:00',
        startH: 10,
        endH: 12,
        title: 'ساعة مع نجم وأحلى الأغاني 🎵',
        host: 'نجوم إف إم 100.6',
        art: defaultNogoumLogo,
        desc: 'أجمل أغاني ومحطات كبار النجوم'
      },
      {
        start: '12:00',
        end: '15:00',
        startH: 12,
        endH: 15,
        title: 'توب كافيه • أفضل الأغاني العربية ☕',
        host: 'نجوم إف إم 100.6',
        art: defaultNogoumLogo,
        desc: 'موسيقى وأغاني مميزة ترافقك وقت الظهيرة'
      },
      {
        start: '15:00',
        end: '17:00',
        startH: 15,
        endH: 17,
        title: day === 'Wed' ? 'برنامج: لدي أقوال أخرى 🎙️' : 'برنامج: معاك في السكة 🚗',
        host: day === 'Wed' ? 'إبراهيم عيسى' : 'نجوم إف إم',
        art: defaultNogoumLogo,
        desc: 'حوارات فكرية وفنية وتغطيات متنوعة'
      },
      {
        start: '17:00',
        end: '19:00',
        startH: 17,
        endH: 19,
        title: 'برنامج: كلام في الزحمة 🚦',
        host: 'مروان قدري ويارا الجندي',
        art: 'https://images.weserv.nl/?url=www.nogoumfm.net/wp-content/uploads/2018/09/Kalam-Fel-Zahma.jpg&w=512&h=512&fit=cover',
        desc: 'متابعة حالة المرور وأخبار السوشيال ميديا وأحلى أغاني الطريق'
      },
      {
        start: '19:00',
        end: '20:00',
        startH: 19,
        endH: 20,
        title: 'برنامج: أجمد 7 الساعة 7 ⭐',
        host: 'جيهان عبد الله',
        art: 'https://images.weserv.nl/?url=www.nogoumfm.net/wp-content/uploads/2015/09/Gehan-Abdallah.jpg&w=512&h=512&fit=cover',
        desc: 'سباق الأغاني العربية الأسبوعي والأكثر استماعاً'
      },
      {
        start: '20:00',
        end: '22:00',
        startH: 20,
        endH: 22,
        title: day === 'Wed' ? 'برنامج: تِربو Turbo 🏎️' : (day === 'Sun' ? 'برنامج: في الاستاد ⚽' : 'برنامج: نجوم الكاسيت 📼'),
        host: day === 'Wed' ? 'تامر بشير' : (day === 'Sun' ? 'كريم خطاب' : 'نجوم إف إم'),
        art: day === 'Wed'
          ? 'https://images.weserv.nl/?url=www.nogoumfm.net/wp-content/uploads/2015/09/Tamer-Bashir.jpg&w=512&h=512&fit=cover'
          : defaultNogoumLogo,
        desc: 'برامج متخصصة في السيارات، الرياضة، وموسيقى الكاسيت'
      },
      {
        start: '22:00',
        end: '00:00',
        startH: 22,
        endH: 24,
        title: day === 'Thu' ? 'برنامج: أسرار النجوم ✨' : 'سهرة الطرب وأحلى الأغاني 🌙',
        host: day === 'Thu' ? 'إنجي علي' : 'نجوم إف إم 100.6',
        art: defaultNogoumLogo,
        desc: 'حوارات خاصة مع ألمع نجوم الفن والسينما'
      }
    ];

    return shows.map(item => ({
      ...item,
      isCurrent: currentHour >= item.startH && currentHour < item.endH
    }));
  }

  // Nile FM
  if (stationId === 'nile-fm') {
    return [
      { start: '07:00', end: '10:00', startH: 7, endH: 10, title: 'The Big Drive ☀️', host: 'Mark & Sally', art: 'https://cdn.instant.audio/images/logos/egyptradio-net/nile-fm.png', desc: 'Wake up with hit music, laughs, and Cairo morning updates' },
      { start: '10:00', end: '13:00', startH: 10, endH: 13, title: 'Nile FM Hit Music 🎵', host: 'Nile FM 104.2', art: 'https://cdn.instant.audio/images/logos/egyptradio-net/nile-fm.png', desc: 'Non-stop top international hits' },
      { start: '13:00', end: '16:00', startH: 13, endH: 16, title: 'The Afternoon Show 🎧', host: 'Nile FM 104.2', art: 'https://cdn.instant.audio/images/logos/egyptradio-net/nile-fm.png', desc: 'Top chart music and entertainment' },
      { start: '16:00', end: '19:00', startH: 16, endH: 19, title: 'Drive Time Hits 🚗', host: 'Nile FM 104.2', art: 'https://cdn.instant.audio/images/logos/egyptradio-net/nile-fm.png', desc: 'Beating the traffic with the hottest tracks' },
      { start: '19:00', end: '22:00', startH: 19, endH: 22, title: 'Nile FM Top 20 ⭐', host: 'Nile FM 104.2', art: 'https://cdn.instant.audio/images/logos/egyptradio-net/nile-fm.png', desc: 'The countdown of the week’s biggest hits' },
      { start: '22:00', end: '07:00', startH: 22, endH: 31, title: 'Non-Stop Hit Music 🎶', host: 'Nile FM 104.2', art: 'https://cdn.instant.audio/images/logos/egyptradio-net/nile-fm.png', desc: 'Late night international playlist' }
    ].map(item => ({
      ...item,
      isCurrent: item.endH > 24 
        ? (currentHour >= item.startH || currentHour < item.endH - 24)
        : (currentHour >= item.startH && currentHour < item.endH)
    }));
  }

  // Generic stations default
  return [
    { start: '00:00', end: '24:00', startH: 0, endH: 24, title: 'بث مباشر متواصل 24/7', host: 'البث الحي', art: 'https://cdn.instant.audio/images/logos/egyptradio-net/nogoum-fm.png', desc: 'استماع مباشر على مدار الساعة', isCurrent: true }
  ];
}

// Current Show Resolver
export function getStationScheduleNow(stationId) {
  const schedule = getStationDailySchedule(stationId);
  const current = schedule.find(s => s.isCurrent);
  if (current) {
    return {
      title: current.title,
      artist: current.host ? `${current.host} • ${current.start} - ${current.end}` : current.start,
      art: current.art,
      showObj: current
    };
  }
  return null;
}
