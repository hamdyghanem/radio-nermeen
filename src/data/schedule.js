// Cairo Time Schedule & Now Playing Resolver for Egyptian Radio Stations

export function getCairoNow() {
  try {
    const now = new Date();
    // Use Intl API to extract Cairo local time components
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

export function getStationScheduleNow(stationId) {
  const { day, hour } = getCairoNow();
  const isWeekend = day === 'Fri' || day === 'Sat';

  // 1. Nogoum FM (100.6 FM)
  if (stationId === 'nogoum-fm') {
    if (isWeekend) {
      if (hour >= 8 && hour < 14) {
        return {
          title: 'صباح الويك إند وجمعة مباركة 🌸',
          artist: 'نجوم إف إم 100.6'
        };
      }
      if (hour >= 14 && hour < 18) {
        return {
          title: 'كوكتيل ويك إند نجوم',
          artist: 'أجمل الأغاني والموسيقى'
        };
      }
      if (hour >= 18 && hour < 20) {
        return {
          title: 'أجمد أغاني الأسبوع',
          artist: 'نجوم إف إم 100.6'
        };
      }
      if (hour >= 20 || hour < 2) {
        return {
          title: 'سهرة الويك إند وأحلى الأغاني',
          artist: 'نجوم إف إم 100.6'
        };
      }
      return {
        title: 'نجوم زمان وأحلى أغاني الليل 🌙',
        artist: 'نجوم إف إم 100.6'
      };
    }

    // Weekdays (Sun - Thu)
    if (hour >= 0 && hour < 2) {
      if (day === 'Sun' || day === 'Tue') {
        return {
          title: 'برنامج: أنا والنجوم وهواك ❤️',
          artist: 'أسامة منير • نجوم إف إم'
        };
      }
      return {
        title: 'أغاني وسهرة الليل 🌙',
        artist: 'نجوم إف إم 100.6'
      };
    }
    if (hour >= 2 && hour < 8) {
      return {
        title: 'نجوم زمان وأحلى الأغاني الكلاسيكية 🎶',
        artist: 'نجوم إف إم 100.6'
      };
    }
    if (hour >= 8 && hour < 10) {
      return {
        title: 'برنامج: عيش صباحك ☀️',
        artist: 'يوسف التهامي وفانا إمام'
      };
    }
    if (hour >= 10 && hour < 12) {
      return {
        title: 'ساعة مع نجم وأحلى الأغاني',
        artist: 'نجوم إف إم 100.6'
      };
    }
    if (hour >= 12 && hour < 15) {
      return {
        title: 'توب كافيه • أفضل الأغاني العربية',
        artist: 'نجوم إف إم 100.6'
      };
    }
    if (hour >= 15 && hour < 17) {
      if (day === 'Wed') {
        return {
          title: 'برنامج: لدي أقوال أخرى 🎙️',
          artist: 'إبراهيم عيسى • نجوم إف إم'
        };
      }
      return {
        title: 'برنامج: معاك في السكة 🚗',
        artist: 'نجوم إف إم 100.6'
      };
    }
    if (hour >= 17 && hour < 19) {
      return {
        title: 'برنامج: كلام في الزحمة 🚦',
        artist: 'مروان قدري ويارا الجندي'
      };
    }
    if (hour >= 19 && hour < 20) {
      return {
        title: 'برنامج: أجمد 7 الساعة 7 ⭐',
        artist: 'جيهان عبد الله'
      };
    }
    if (hour >= 20 && hour < 22) {
      if (day === 'Wed') {
        return {
          title: 'برنامج: تِربو Turbo 🏎️',
          artist: 'تامر بشير'
        };
      }
      if (day === 'Sun') {
        return {
          title: 'برنامج: في الاستاد ⚽',
          artist: 'كريم خطاب'
        };
      }
      return {
        title: 'برنامج: نجوم الكاسيت 📼',
        artist: 'نجوم إف إم 100.6'
      };
    }
    if (hour >= 22 || hour < 24) {
      if (day === 'Thu') {
        return {
          title: 'برنامج: أسرار النجوم ✨',
          artist: 'إنجي علي'
        };
      }
      return {
        title: 'سهرة الطرب وأحلى الأغاني',
        artist: 'نجوم إف إم 100.6'
      };
    }
  }

  // 2. Nile FM (104.2 FM)
  if (stationId === 'nile-fm') {
    if (hour >= 7 && hour < 10) {
      return { title: 'The Big Drive ☀️', artist: 'Mark & Sally • Nile FM' };
    }
    if (hour >= 10 && hour < 13) {
      return { title: 'Nile FM Hit Music 🎵', artist: '104.2 FM' };
    }
    if (hour >= 13 && hour < 16) {
      return { title: 'The Afternoon Show 🎧', artist: 'Nile FM 104.2' };
    }
    if (hour >= 16 && hour < 19) {
      return { title: 'Drive Time Hits 🚗', artist: 'Nile FM 104.2' };
    }
    if (hour >= 19 && hour < 22) {
      return { title: 'Nile FM Top 20 ⭐', artist: '104.2 FM' };
    }
    return { title: 'Non-Stop Hit Music 🎶', artist: 'Nile FM 104.2' };
  }

  // 3. Mega FM (92.7 FM)
  if (stationId === 'mega-fm-92-7') {
    if (hour >= 8 && hour < 11) {
      return { title: 'صباح الخير يا مصر ☀️', artist: 'ميجا أف أم 92.7' };
    }
    if (hour >= 11 && hour < 15) {
      return { title: 'أحلى الأغاني المنوعة 🎶', artist: 'ميجا أف أم 92.7' };
    }
    if (hour >= 15 && hour < 18) {
      return { title: 'ميجا درايف في الزحمة 🚗', artist: 'ميجا أف أم 92.7' };
    }
    if (hour >= 18 && hour < 22) {
      return { title: 'ميجا ميكس وأقوى الأغاني ⭐', artist: 'ميجا أف أم 92.7' };
    }
    return { title: 'سهرة ميجا وأجمل الأغاني 🌙', artist: 'ميجا أف أم 92.7' };
  }

  // 4. Shaabi FM (95.0 FM)
  if (stationId === 'shaabi-95') {
    return {
      title: 'أجمل الأغاني الشعبية والموال الأصيل 🪕',
      artist: 'شعبي أف أم 95.0'
    };
  }

  // 5. Nagham FM (105.3 FM)
  if (stationId === 'nagham-fm') {
    return {
      title: 'نغم مصر الأصيل وأحلى الأغاني 🎵',
      artist: 'نغم أف أم 105.3'
    };
  }

  // 6. Radio Hits (88.2 FM)
  if (stationId === 'hits') {
    return {
      title: 'أحدث الهيتس والأغاني الشبابية ⚡',
      artist: 'راديو هيتس 88.2'
    };
  }

  // 7. 90s FM (التسعينات)
  if (stationId === 'arabic-90s-fm') {
    return {
      title: 'ذكريات وروائع التسعينات والثمانينات 📼',
      artist: 'راديو التسعينات 90s FM'
    };
  }

  // 8. Quran Radio (إذاعة القرآن الكريم)
  if (stationId === 'quran-cairo' || stationId.includes('quran')) {
    return {
      title: 'تلاوات مباركة وبرامج إذاعة القرآن الكريم 📖',
      artist: 'إذاعة القرآن الكريم من القاهرة'
    };
  }

  return null;
}
