export const SUPABASE_URL = 'https://qgmnldmmhdtqbptbdmjm.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbW5sZG1taGR0cWJwdGJkbWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyODg5MDcsImV4cCI6MjEwNzg2NDkwN30.uEofng_-EPocDFkxHId5b-nMoLaD2RjKqBo_uh6TUYs';

// Версия приложения и номер сборки (инкрементируется с каждой новой выдачей кода)
export const APP_BASE_VERSION = '1.0';
export const CODE_ITERATION_NUMBER = 45;
export const BUILD_STORAGE_KEY = 'bp_app_build_number_v1';

export const SESSION_STORAGE_KEY = 'bp_multiuser_session_v1';
export const LEGACY_AVATAR_KEY = 'roma_bp_custom_avatar_v1';
export const USER_THEME_PREFIX = 'bp_user_theme_';
export const DEMO_THEME_SESSION_KEY = 'bp_demo_session_theme_v1';

export const DEFAULT_TAGS_ROMA = [
  'После кофе',
  'После силовой',
  'После кардио',
  'Вечером после прогулки'
];
export const DEFAULT_TAGS_NEW_USER = ['После пробуждения', 'До сна'];

export const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
];

export const HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
export const MINUTES_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const formatHumanDate = (isoDate) => {
  if (!isoDate) return '';
  const [, mm, dd] = isoDate.split('-');
  const mIdx = parseInt(mm, 10) - 1;
  return `${parseInt(dd, 10)} ${MONTHS_RU[mIdx] || mm}`;
};

export const pluralizeMeasurements = (n) => {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return 'измерений';
  if (n1 > 1 && n1 < 5) return 'измерения';
  if (n1 === 1) return 'измерение';
  return 'измерений';
};

export const getGreetingByHour = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро!';
  if (hour >= 12 && hour < 18) return 'Добрый день!';
  if (hour >= 18 && hour < 23) return 'Добрый вечер!';
  return 'Доброй ночи!';
};

export const getStatusLabel = (sys, dia) => {
  if (!sys || !dia) {
    return {
      text: 'Нет данных',
      bg: 'var(--status-empty-bg)',
      textCol: 'var(--status-empty-text)'
    };
  }
  if (sys < 110 || dia < 65) {
    return {
      text: 'Низкое',
      bg: 'var(--status-low-bg)',
      textCol: 'var(--status-low-text)'
    };
  }
  if (sys < 130 && dia < 85) {
    return {
      text: 'В норме',
      bg: 'var(--status-normal-bg)',
      textCol: 'var(--status-normal-text)'
    };
  }
  if (sys < 140 && dia < 90) {
    return {
      text: 'Повышенное',
      bg: 'var(--status-elevated-bg)',
      textCol: 'var(--status-elevated-text)'
    };
  }
  return {
    text: 'Высокое',
    bg: 'var(--status-high-bg)',
    textCol: 'var(--status-high-text)'
  };
};

export const deduplicateRecords = (arr) => {
  const seen = new Map();
  arr.forEach((item) => {
    const key = item.id || `${item.date}_${item.time}_${item.sys}_${item.dia}`;
    seen.set(key, item);
  });
  return Array.from(seen.values());
};

export const parseImportData = (rawText, username = 'user') => {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsed = [];

  lines.forEach((line, idx) => {
    const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})/);
    if (!dateMatch) return;
    let isoDate = dateMatch[1];
    if (isoDate.includes('.')) {
      const [dd, mm, yyyy] = isoDate.split('.');
      isoDate = `${yyyy}-${mm}-${dd}`;
    }
    const timeMatch = line.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    const time = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '09:00';
    let rest = line.replace(dateMatch[1], '').replace(timeMatch ? timeMatch[0] : '', '');

    const nums = rest.match(/\b\d{2,3}\b/g);
    if (nums && nums.length >= 2) {
      const sys = parseInt(nums[0], 10);
      const dia = parseInt(nums[1], 10);
      const pulse = nums[2] ? parseInt(nums[2], 10) : null;
      const cleanNote = rest
        .replace(nums[0], '')
        .replace(nums[1], '')
        .replace(nums[2] || '', '')
        .replace(/^[;,\s/|-]+|[;,\s/|-]+$/g, '')
        .trim();

      if (sys >= 75 && sys <= 220 && dia >= 45 && dia <= 140) {
        parsed.push({
          id: `r-${username}-${isoDate}-${time.replace(':', '')}-${idx}-${Date.now().toString().slice(-4)}`,
          username,
          date: isoDate,
          time,
          sys,
          dia,
          pulse: pulse && pulse >= 35 && pulse <= 200 ? pulse : null,
          note: cleanNote || 'Замер'
        });
      }
    }
  });

  return parsed;
};

export const DEFAULT_ROMA_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e2530"/>
      <stop offset="100%" stop-color="#0f141c"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg)"/>
  <circle cx="60" cy="54" r="24" fill="#d8a98c"/>
  <path d="M24 114 C28 88 92 88 96 114" fill="#181c24"/>
  <path d="M34 44 C34 24 86 24 86 44 Z" fill="#23272e"/>
  <path d="M22 43 Q55 37 88 44 L86 48 Q54 43 22 46 Z" fill="#14171c"/>
  <rect x="40" y="47" width="17" height="12" rx="3" fill="none" stroke="#181b20" stroke-width="3.2"/>
  <rect x="63" y="47" width="17" height="12" rx="3" fill="none" stroke="#181b20" stroke-width="3.2"/>
  <line x1="57" y1="51" x2="63" y2="51" stroke="#181b20" stroke-width="3"/>
  <path d="M51 67 Q60 72 69 67" fill="none" stroke="#8c584c" stroke-width="2.5" stroke-linecap="round"/>
</svg>
`)}`;

export const generateDemoRecords = () => {
  const total = 100;
  const now = new Date();
  const earlyNotes = [
    'Головная боль утром',
    'После нервного дня',
    'После кофе',
    'До приёма терапии',
    'Плохой сон',
    'После пробуждения',
    'До сна'
  ];
  const lateNotes = [
    'После пробуждения',
    'До сна',
    'Вечерняя прогулка',
    'После кардио',
    'После кофе',
    'Отличное самочувствие'
  ];
  const morningTimes = ['07:45', '08:10', '08:25', '08:40', '09:05'];
  const eveningTimes = ['19:30', '19:55', '20:15', '20:40', '21:05'];

  const list = [];

  for (let i = 0; i < total; i++) {
    const progress = i / (total - 1);

    let daysAgo;
    if (i < 65) {
      daysAgo = Math.round(345 - (i / 65) * 313);
    } else {
      daysAgo = Math.max(0, Math.round(31 - ((i - 65) / 34) * 31));
    }

    const curve = Math.pow(1 - progress, 1.35);
    const baseSys = 120 + curve * 28;
    const baseDia = 78 + curve * 16;
    const basePulse = 63 + curve * 15;

    const wave1 = Math.sin(i * 1.7) * (3 + 7 * (1 - progress));
    const wave2 = Math.cos(i * 0.85) * (2 + 4 * (1 - progress));

    const isEvening = i % 2 === 1;
    const eveningBoost = isEvening ? 2 : -1;

    const sys = Math.round(Math.min(147, Math.max(114, baseSys + wave1 + eveningBoost)));
    const dia = Math.round(Math.min(96, Math.max(72, baseDia + wave2 * 0.65 + (isEvening ? 1 : -1))));
    const pulse = Math.round(Math.min(92, Math.max(58, basePulse + wave1 * 0.5 + (isEvening ? 2 : 0))));

    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    const iso = d.toISOString().slice(0, 10);

    const time = isEvening
      ? eveningTimes[i % eveningTimes.length]
      : morningTimes[i % morningTimes.length];

    const notePool = progress < 0.45 ? earlyNotes : lateNotes;
    const note = notePool[(i * 3) % notePool.length];

    list.push({
      id: `demo-${i}`,
      date: iso,
      time,
      sys,
      dia,
      pulse,
      note
    });
  }

  return deduplicateRecords(list);
};

export const DEMO_RECORDS = generateDemoRecords();

export const compressAvatarImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

export const handleInputEnterBlur = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.currentTarget.blur();
  }
};

export const scrollTargetIntoSheetView = (targetRef) => {
  setTimeout(() => {
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 180);
};

// Сетевые функции работы с облаком Supabase
export const apiFetchUserRecords = async (user) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/bp_records?select=*&username=eq.${encodeURIComponent(
      user.username
    )}&order=date.asc,time.asc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'x-user-login': user.username,
        'x-user-pin': user.pin
      }
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const apiUpsertRecords = async (user, itemsArray) => {
  const withUser = itemsArray.map((item) => ({
    ...item,
    username: user.username
  }));
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bp_records`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
      'x-user-login': user.username,
      'x-user-pin': user.pin
    },
    body: JSON.stringify(withUser)
  });
  if (!res.ok) throw new Error('Ошибка записи');
};

export const apiDeleteRecord = async (user, id) => {
  await fetch(
    `${SUPABASE_URL}/rest/v1/bp_records?id=eq.${encodeURIComponent(id)}&username=eq.${encodeURIComponent(
      user.username
    )}`,
    {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'x-user-login': user.username,
        'x-user-pin': user.pin
      }
    }
  );
};

export const apiPatchUserProfile = async (user, patchFields) => {
  await fetch(
    `${SUPABASE_URL}/rest/v1/bp_users?username=eq.${encodeURIComponent(user.username)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'x-user-login': user.username,
        'x-user-pin': user.pin
      },
      body: JSON.stringify(patchFields)
    }
  );
};