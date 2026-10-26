import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Plus,
  Heart,
  Activity,
  Settings,
  X,
  Trash2,
  Download,
  Upload,
  Search,
  RefreshCw,
  Sun,
  Moon,
  Camera,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  Zap
} from 'lucide-react';

const SUPABASE_URL = 'https://qgmnldmmhdtqbptbdmjm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbW5sZG1taGR0cWJwdGJkbWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyODg5MDcsImV4cCI6MjEwNzg2NDkwN30.uEofng_-EPocDFkxHId5b-nMoLaD2RjKqBo_uh6TUYs';

const SESSION_STORAGE_KEY = 'bp_multiuser_session_v1';
const LEGACY_AVATAR_KEY = 'roma_bp_custom_avatar_v1';
const USER_THEME_PREFIX = 'bp_user_theme_';
const DEMO_THEME_SESSION_KEY = 'bp_demo_session_theme_v1';

const DEFAULT_TAGS_ROMA = [
  'После кофе',
  'После силовой',
  'После кардио',
  'Вечером после прогулки'
];
const DEFAULT_TAGS_NEW_USER = ['После пробуждения', 'До сна'];

const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
];

const formatHumanDate = (isoDate) => {
  if (!isoDate) return '';
  const [, mm, dd] = isoDate.split('-');
  const mIdx = parseInt(mm, 10) - 1;
  return `${parseInt(dd, 10)} ${MONTHS_RU[mIdx] || mm}`;
};

const pluralizeMeasurements = (n) => {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return 'измерений';
  if (n1 > 1 && n1 < 5) return 'измерения';
  if (n1 === 1) return 'измерение';
  return 'измерений';
};

const getGreetingByHour = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро!';
  if (hour >= 12 && hour < 18) return 'Добрый день!';
  if (hour >= 18 && hour < 23) return 'Добрый вечер!';
  return 'Доброй ночи!';
};

const getStatusLabel = (sys, dia) => {
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

const deduplicateRecords = (arr) => {
  const seen = new Map();
  arr.forEach((item) => {
    const key = item.id || `${item.date}_${item.time}_${item.sys}_${item.dia}`;
    seen.set(key, item);
  });
  return Array.from(seen.values());
};

const parseImportData = (rawText, username = 'user') => {
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

const DEFAULT_ROMA_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
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

const generateDemoRecords = () => {
  const base = [
    [122, 80, 64, '08:30', 'После пробуждения', 80],
    [125, 82, 66, '20:20', 'До сна', 75],
    [121, 79, 63, '08:40', 'После пробуждения', 60],
    [126, 84, 69, '19:50', 'До сна', 40],
    [116, 75, 59, '08:10', 'После пробуждения', 35],
    [123, 81, 66, '20:40', 'До сна', 25],
    [120, 80, 63, '08:40', 'После пробуждения', 22],
    [125, 83, 67, '19:30', 'После тренировки', 15],
    [118, 77, 61, '08:20', 'После пробуждения', 12],
    [121, 79, 64, '21:00', 'До сна', 6],
    [128, 84, 71, '09:00', 'После кофе', 5],
    [122, 80, 65, '20:10', 'Вечерняя прогулка', 2],
    [117, 76, 60, '08:15', 'После пробуждения', 1],
    [124, 82, 68, '19:45', 'До сна', 1],
    [119, 78, 62, '08:30', 'После пробуждения', 0]
  ];
  const now = new Date();
  return base.map((item, idx) => {
    const d = new Date(now);
    d.setDate(d.getDate() - item[5]);
    const iso = d.toISOString().slice(0, 10);
    return {
      id: `demo-${idx}`,
      date: iso,
      time: item[3],
      sys: item[0],
      dia: item[1],
      pulse: item[2],
      note: item[4]
    };
  });
};

const DEMO_RECORDS = generateDemoRecords();

const compressAvatarImage = (file) =>
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

const CloudCheckIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17.5 19H7a5 5 0 0 1-.7-9.95A6.5 6.5 0 0 1 19 10.5c0 .18-.01.35-.03.52A4.25 4.25 0 0 1 17.5 19Z" />
    <path d="m9.5 13 2 2 3.5-4" />
  </svg>
);

const ScanFrameIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 8V6a2 2 0 0 1 2-2h2" />
    <path d="M4 16v2a2 2 0 0 0 2 2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </svg>
);

const HomeNavIcon = ({ solid }) => solid ? (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25.3926 27.6992H18.6084C18.1254 27.6992 17.7334 27.3072 17.7334 26.8242C17.7334 26.3412 18.1254 25.9492 18.6084 25.9492H25.3926C25.8756 25.9492 26.2676 26.3412 26.2676 26.8242C26.2676 27.3072 25.8756 27.6992 25.3926 27.6992ZM30.4571 15.1843C30.0336 14.811 29.5517 14.3887 28.9777 13.8578C28.7176 13.6478 28.4329 13.4075 28.1307 13.1532C26.4274 11.717 24.0941 9.75 21.9672 9.75C19.8649 9.75 17.6821 11.6073 15.9286 13.0995C15.6042 13.3748 15.3009 13.6338 14.9917 13.8847C14.4481 14.3887 13.9662 14.8122 13.5416 15.1867C10.7567 17.6378 10.2329 18.2807 10.2329 23.9985C10.2329 34.25 13.1974 34.25 21.9999 34.25C30.8012 34.25 33.7669 34.25 33.7669 23.9985C33.7669 18.2795 33.2431 17.6367 30.4571 15.1843Z" fillRule="evenodd" clipRule="evenodd" fill="var(--text-primary)"/>
  </svg>
) : (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25.3759 25.8243C25.9281 25.8243 26.3757 26.2722 26.3759 26.8243C26.3759 27.3766 25.9282 27.8243 25.3759 27.8243H18.5917C18.0394 27.8243 17.5917 27.3766 17.5917 26.8243C17.5919 26.2722 18.0395 25.8243 18.5917 25.8243H25.3759Z" fill="var(--text-muted)"/>
    <path d="M32.167 23.9984C32.167 20.6758 31.9686 19.4177 31.46 18.5297C31.2064 18.087 30.8453 17.6864 30.2588 17.1449C29.965 16.8737 29.6322 16.583 29.2383 16.2357C28.8519 15.8952 28.4162 15.5088 27.9307 15.059C27.0208 14.3232 26.0275 13.4161 24.9082 12.6254C23.7616 11.8154 22.7486 11.3335 21.9512 11.3334C21.1569 11.3334 20.1579 11.8151 19.0264 12.6263C17.913 13.4246 16.9519 14.3171 16.0371 15.057C15.5513 15.5072 15.1161 15.895 14.7295 16.2357C14.3355 16.5829 14.0028 16.8737 13.709 17.1449C13.1224 17.6863 12.7615 18.087 12.5078 18.5297C11.9989 19.4177 11.7998 20.6757 11.7998 23.9984C11.7998 26.3944 11.9434 28.1036 12.2637 29.3363C12.5772 30.5427 13.0392 31.2162 13.6377 31.6459C14.2681 32.0984 15.1805 32.3761 16.585 32.5209C17.9878 32.6654 19.7401 32.6664 21.9834 32.6664C24.2267 32.6664 25.979 32.6654 27.3818 32.5209C28.7863 32.3761 29.6986 32.0984 30.3291 31.6459C30.9276 31.2162 31.3896 30.5428 31.7031 29.3363C32.0234 28.1036 32.167 26.3945 32.167 23.9984ZM34.167 23.9984C34.167 26.4363 34.0249 28.3528 33.6387 29.8392C33.2456 31.3519 32.5802 32.492 31.4951 33.2709C30.442 34.0267 29.1134 34.3528 27.5869 34.5101C26.0588 34.6676 24.1888 34.6664 21.9834 34.6664C19.778 34.6664 17.908 34.6676 16.3799 34.5101C14.8533 34.3528 13.5249 34.0268 12.4717 33.2709C11.3866 32.492 10.7212 31.3519 10.3281 29.8392C9.94189 28.3528 9.7998 26.4363 9.7998 23.9984C9.79981 20.7519 9.9593 18.9546 10.7725 17.5355C11.1798 16.8248 11.7205 16.2586 12.3525 15.6752C12.668 15.3839 13.0241 15.0724 13.4072 14.7347C13.7941 14.3937 14.2199 14.0166 14.6924 13.5785L14.7451 13.5326C15.5053 12.9206 16.69 11.8401 17.8613 11.0004C19.0307 10.162 20.4786 9.33337 21.9512 9.33337C23.4191 9.33351 24.8777 10.1553 26.0615 10.9916C26.9579 11.6248 27.8485 12.3834 28.5674 12.9886L29.2236 13.5326L29.2764 13.5785C29.7487 14.0165 30.1738 14.3938 30.5605 14.7347C30.9436 15.0724 31.2998 15.3839 31.6152 15.6752C32.2472 16.2587 32.7882 16.8247 33.1953 17.5355C34.0081 18.9545 34.167 20.7519 34.167 23.9984Z" fill="var(--text-muted)"/>
  </svg>
);

const HistoryNavIcon = ({ solid }) => solid ? (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26.194 22.8021H17.7706C17.2876 22.8021 16.8956 22.4101 16.8956 21.9271C16.8956 21.4441 17.2876 21.0521 17.7706 21.0521H26.194C26.677 21.0521 27.069 21.4441 27.069 21.9271C27.069 22.4101 26.677 22.8021 26.194 22.8021ZM26.194 27.1876H17.7706C17.2876 27.1876 16.8956 26.7956 16.8956 26.3126C16.8956 25.8296 17.2876 25.4376 17.7706 25.4376H26.194C26.677 25.4376 27.069 25.8296 27.069 26.3126C27.069 26.7956 26.677 27.1876 26.194 27.1876ZM17.7706 16.6642H20.9848C21.4678 16.6642 21.8598 17.0562 21.8598 17.5392C21.8598 18.0222 21.4678 18.4142 20.9848 18.4142H17.7706C17.2876 18.4142 16.8956 18.0222 16.8956 17.5392C16.8956 17.0562 17.2876 16.6642 17.7706 16.6642ZM21.9998 10.6244C14.3406 10.6244 11.627 13.6017 11.627 22.0006C11.627 30.3982 14.3406 33.3756 21.9998 33.3756C29.6578 33.3756 32.3726 30.3982 32.3726 22.0006C32.3726 13.6017 29.6578 10.6244 21.9998 10.6244Z" fillRule="evenodd" clipRule="evenodd" fill="var(--text-primary)"/>
  </svg>
) : (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26.1943 25.3122C26.7464 25.3122 27.1941 25.7601 27.1943 26.3122C27.1943 26.8645 26.7465 27.3122 26.1943 27.3122H17.7714C17.2191 27.3122 16.7714 26.8645 16.7714 26.3122C16.7716 25.7601 17.2192 25.3122 17.7714 25.3122H26.1943Z" fill="var(--text-muted)"/>
    <path d="M26.1943 20.9258C26.7464 20.9258 27.1941 21.3737 27.1943 21.9258C27.1943 22.4781 26.7465 22.9258 26.1943 22.9258H17.7714C17.2191 22.9258 16.7714 22.4781 16.7714 21.9258C16.7716 21.3737 17.2192 20.9258 17.7714 20.9258H26.1943Z" fill="var(--text-muted)"/>
    <path d="M20.9858 16.54C21.538 16.54 21.9857 16.9878 21.9858 17.54C21.9858 18.0923 21.5381 18.54 20.9858 18.54H17.772C17.2197 18.54 16.772 18.0923 16.772 17.54C16.7721 16.9878 17.2198 16.54 17.772 16.54H20.9858Z" fill="var(--text-muted)"/>
    <path d="M30.7905 22.0005C30.7905 17.9939 30.1703 15.6329 28.9087 14.2417C27.6736 12.88 25.5973 12.2085 22.0005 12.2085C18.4046 12.2086 16.3284 12.88 15.0933 14.2417C13.8316 15.6329 13.2114 17.9941 13.2114 22.0005C13.2115 26.007 13.8314 28.3682 15.0933 29.7593C16.3284 31.1209 18.4046 31.7915 22.0005 31.7915C25.5973 31.7915 27.6736 31.1209 28.9087 29.7593C30.1704 28.3682 30.7905 26.0072 30.7905 22.0005ZM32.7905 22.0005C32.7905 26.0866 32.1873 29.1217 30.3901 31.103C28.5662 33.1139 25.7466 33.7915 22.0005 33.7915C18.2553 33.7915 15.4368 33.1135 13.6128 31.103C11.8155 29.1217 11.2115 26.0867 11.2114 22.0005C11.2114 17.9141 11.8154 14.8794 13.6128 12.8979C15.4368 10.8872 18.2551 10.2085 22.0005 10.2085C25.7467 10.2085 28.5662 10.8871 30.3901 12.8979C32.1872 14.8794 32.7905 17.9144 32.7905 22.0005Z" fill="var(--text-muted)"/>
  </svg>
);

const HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Барабан выбора времени с индивидуальной мягкой капсулой, идеальной центровкой
// и плавным растворением соседних цифр в полную прозрачность по мере удаления от центра
const DrumPicker = ({ options, value, onChange }) => {
  const ITEM_HEIGHT = 68;
  const scrollRef = useRef(null);
  const initialIdx = Math.max(0, options.indexOf(value));
  const [scrollPos, setScrollPos] = useState(initialIdx);
  const lastReportedIdxRef = useRef(initialIdx);

  useEffect(() => {
    const idx = Math.max(0, options.indexOf(value));
    lastReportedIdxRef.current = idx;
    setScrollPos(idx);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = idx * ITEM_HEIGHT;
    }
  }, []);

  const handleScroll = (e) => {
    const top = e.target.scrollTop;
    const exactPos = top / ITEM_HEIGHT;
    setScrollPos(exactPos);

    const roundedIdx = Math.min(options.length - 1, Math.max(0, Math.round(exactPos)));
    if (roundedIdx !== lastReportedIdxRef.current) {
      lastReportedIdxRef.current = roundedIdx;
      onChange(options[roundedIdx]);
    }
  };

  return (
    <div className="relative w-[148px] h-[340px] flex items-center justify-center select-none">
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[68px] rounded-full pointer-events-none"
        style={{ backgroundColor: 'var(--drum-highlight)' }}
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory relative z-10 hide-scrollbar"
      >
        <div style={{ height: ITEM_HEIGHT * 2 }} />
        {options.map((opt, i) => {
          const distance = Math.abs(i - scrollPos);
          const isSelected = distance < 0.45;

          let opacity = 0;
          if (distance <= 0.35) {
            opacity = 1;
          } else if (distance <= 1) {
            const t = (distance - 0.35) / 0.65;
            opacity = 1 - t * 0.48;
          } else if (distance <= 2) {
            const t = distance - 1;
            opacity = 0.52 - t * 0.30;
          } else if (distance < 2.65) {
            const t = (distance - 2) / 0.65;
            opacity = 0.22 * (1 - t);
          } else {
            opacity = 0;
          }

          let fontSize = 28;
          if (distance < 1) {
            fontSize = 44 - distance * 13;
          } else if (distance < 2) {
            fontSize = 31 - (distance - 1) * 3;
          }

          return (
            <div
              key={opt}
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' });
                }
              }}
              className="snap-center w-full flex items-center justify-center tabular-nums leading-none cursor-pointer"
              style={{
                height: ITEM_HEIGHT,
                fontSize: `${fontSize.toFixed(1)}px`,
                fontWeight: isSelected ? 800 : distance < 1.5 ? 500 : 400,
                color: isSelected ? 'var(--drum-active-text)' : 'var(--drum-inactive-text)',
                opacity
              }}
            >
              <span className="block text-center w-full">{opt}</span>
            </div>
          );
        })}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
      </div>
    </div>
  );
};

// Полноэкранный модальный слой сканирования тонометра поверх шторки «Новый замер»
const TonometerScannerModal = ({ onClose, onDetected, currentUser }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isScanningRef = useRef(false);
  const activeRef = useRef(true);
  const attemptsRef = useRef(0);
  const prevSmallFrameRef = useRef(null);
  const partialReadingRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [hintMessage, setHintMessage] = useState('Наведите на экран и удерживайте телефон ровно');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error(e);
        }
      });
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    window.history.pushState({ tonometerScanner: true }, '');
    const handlePopState = () => {
      stopCamera();
      onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose, stopCamera]);

  useEffect(() => {
    activeRef.current = true;
    setCameraError('');
    setCameraReady(false);

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Ваш браузер не поддерживает доступ к камере.');
        return;
      }

      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
          });
        }

        if (!activeRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setCameraReady(true);
        }

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
          const caps = videoTrack.getCapabilities();
          if (caps && caps.torch) {
            setTorchSupported(true);
          }
        }
      } catch (err) {
        if (!activeRef.current) return;
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setCameraError('Доступ к камере запрещён. Разрешите использование камеры в настройках браузера.');
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          setCameraError('Камера не найдена на этом устройстве.');
        } else {
          setCameraError('Не удалось запустить камеру. Проверьте, не занята ли она другим приложением.');
        }
      }
    };

    startCamera();

    return () => {
      activeRef.current = false;
      stopCamera();
    };
  }, [retryTrigger, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (e) {
      console.error(e);
    }
  };

  const captureAndRecognize = useCallback(async () => {
    if (!activeRef.current || !cameraReady || isScanningRef.current || !videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

    isScanningRef.current = true;
    setIsProcessingFrame(true);

    try {
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const cropSize = Math.floor(minDim * 0.84);
      const sx = Math.floor((video.videoWidth - cropSize) / 2);
      const sy = Math.floor((video.videoHeight - cropSize) / 2);

      let base64Image = '';

      if (attemptsRef.current === 0) {
        const canvas = document.createElement('canvas');
        const targetSize = 600;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize);
        base64Image = canvas.toDataURL('image/jpeg', 0.78).split(',')[1];
      } else {
        const canvas = document.createElement('canvas');
        const halfSize = 520;
        canvas.width = halfSize * 2;
        canvas.height = halfSize;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, halfSize, halfSize);

        await new Promise((r) => setTimeout(r, 850));
        if (!activeRef.current || !videoRef.current) return;

        ctx.drawImage(videoRef.current, sx, sy, cropSize, cropSize, halfSize, 0, halfSize, halfSize);
        base64Image = canvas.toDataURL('image/jpeg', 0.76).split(',')[1];
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-tonometer`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'x-user-login': currentUser?.username || '',
          'x-user-pin': currentUser?.pin || ''
        },
        body: JSON.stringify({ imageBase64: base64Image }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const result = await res.json();
      if (!activeRef.current) return;

      const sys = parseInt(result?.sys, 10);
      const dia = parseInt(result?.dia, 10);
      const pulse = result?.pulse ? parseInt(result.pulse, 10) : null;

      const isValidSysDia =
        result?.found &&
        !isNaN(sys) &&
        !isNaN(dia) &&
        sys >= 75 &&
        sys <= 240 &&
        dia >= 40 &&
        dia <= 150 &&
        sys > dia + 10;

      const isValidPulse = pulse !== null && !isNaN(pulse) && pulse >= 35 && pulse <= 210;

      if (isValidSysDia) {
        if (!isValidPulse && attemptsRef.current === 0) {
          partialReadingRef.current = { sys: String(sys), dia: String(dia) };
          attemptsRef.current += 1;
          setHintMessage('Считываем пульс со второго экрана...');
          return;
        }

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(60);
        }
        stopCamera();
        onDetected({
          sys: String(sys),
          dia: String(dia),
          pulse: isValidPulse ? String(pulse) : ''
        });
        return;
      }

      if (partialReadingRef.current && attemptsRef.current >= 1) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(60);
        }
        stopCamera();
        onDetected({
          sys: partialReadingRef.current.sys,
          dia: partialReadingRef.current.dia,
          pulse: isValidPulse ? String(pulse) : ''
        });
        return;
      }

      attemptsRef.current += 1;
      if (attemptsRef.current >= 2) {
        setHintMessage('Не удаётся прочитать цифры. Попробуйте изменить угол или освещение');
      }
    } catch (err) {
      if (!activeRef.current) return;
      attemptsRef.current += 1;
      if (attemptsRef.current >= 2) {
        setHintMessage('Не удаётся прочитать цифры. Попробуйте изменить угол');
      }
    } finally {
      if (activeRef.current) {
        setIsProcessingFrame(false);
        isScanningRef.current = false;
      }
    }
  }, [cameraReady, currentUser, onDetected, stopCamera]);

  useEffect(() => {
    if (!cameraReady || cameraError) return;
    let timerId;
    let isLooping = true;
    let stableFramesCount = 0;
    let totalChecksWithoutScan = 0;

    const motionCanvas = document.createElement('canvas');
    motionCanvas.width = 32;
    motionCanvas.height = 32;
    const motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true });

    const checkStabilityAndScan = async () => {
      if (!isLooping || !activeRef.current) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && !isScanningRef.current) {
        const minDim = Math.min(video.videoWidth, video.videoHeight);
        const cropSize = Math.floor(minDim * 0.7);
        const sx = Math.floor((video.videoWidth - cropSize) / 2);
        const sy = Math.floor((video.videoHeight - cropSize) / 2);

        motionCtx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, 32, 32);
        const currentData = motionCtx.getImageData(0, 0, 32, 32).data;

        if (prevSmallFrameRef.current) {
          let diffSum = 0;
          const prevData = prevSmallFrameRef.current;
          const totalPixels = 32 * 32;

          for (let i = 0; i < currentData.length; i += 4) {
            const grayCurr = currentData[i] * 0.3 + currentData[i + 1] * 0.59 + currentData[i + 2] * 0.11;
            const grayPrev = prevData[i] * 0.3 + prevData[i + 1] * 0.59 + prevData[i + 2] * 0.11;
            diffSum += Math.abs(grayCurr - grayPrev);
          }

          const avgDiff = diffSum / totalPixels;

          if (avgDiff < 13) {
            stableFramesCount += 1;
          } else {
            stableFramesCount = 0;
          }
        }

        prevSmallFrameRef.current = new Uint8ClampedArray(currentData);
        totalChecksWithoutScan += 1;

        if (stableFramesCount >= 3 || totalChecksWithoutScan >= 12) {
          stableFramesCount = 0;
          totalChecksWithoutScan = 0;
          await captureAndRecognize();
          if (isLooping && activeRef.current) {
            timerId = setTimeout(checkStabilityAndScan, 900);
          }
          return;
        }
      }

      if (isLooping && activeRef.current) {
        timerId = setTimeout(checkStabilityAndScan, 150);
      }
    };

    timerId = setTimeout(checkStabilityAndScan, 400);

    return () => {
      isLooping = false;
      clearTimeout(timerId);
    };
  }, [cameraReady, cameraError, captureAndRecognize]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 flex justify-center select-none touch-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-[440px] h-full bg-[#141A16] relative flex flex-col justify-between overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(17,24,19,0.88) 0%, rgba(17,24,19,0.22) 24%, rgba(17,24,19,0.22) 72%, rgba(17,24,19,0.92) 100%)'
          }}
        />

        <div className="relative z-20 px-6 pt-7 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[36px] font-extrabold text-[#F1F3EF] leading-none tracking-tight">
                Сканирование
              </h3>
              <p className="text-[16px] font-normal text-[#D5DDD8] mt-2.5 leading-snug">
                Наведите камеру на экран тонометра
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="w-11 h-11 rounded-full bg-[#29322C]/90 flex items-center justify-center text-[#F1F3EF] active:scale-95 transition cursor-pointer shrink-0"
              aria-label="Закрыть сканер"
            >
              <X className="w-5 h-5" strokeWidth={2.2} />
            </button>
          </div>

          {torchSupported && (
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={toggleTorch}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer ${
                  torchOn
                    ? 'bg-[#D6EBB4] text-[#141A16]'
                    : 'bg-[#202722]/85 text-[#F1F3EF]'
                }`}
                aria-label="Переключить фонарик"
              >
                <Zap className="w-5 h-5 fill-current" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>

        <div className="relative z-20 flex-1 flex items-center justify-center px-8">
          {cameraError ? (
            <div className="w-full bg-[#202722]/95 rounded-[28px] p-6 text-center space-y-4">
              <div className="text-[18px] font-bold text-[#F1F3EF] leading-snug">
                {cameraError}
              </div>
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setRetryTrigger((prev) => prev + 1)}
                  className="w-full py-3.5 rounded-full bg-[#EAF3EF] text-[#141A16] font-bold text-[16px] active:scale-95 transition cursor-pointer"
                >
                  Попробовать снова
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="w-full py-3.5 rounded-full bg-[#29322C] text-[#F1F3EF] font-bold text-[16px] active:scale-95 transition cursor-pointer"
                >
                  Вернуться к ручному вводу
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[290px] aspect-[4/4.3] relative pointer-events-none">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-[5px] border-l-[5px] border-[#F1F3EF] rounded-tl-[20px]" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-[5px] border-r-[5px] border-[#F1F3EF] rounded-tr-[20px]" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[5px] border-l-[5px] border-[#F1F3EF] rounded-bl-[20px]" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[5px] border-r-[5px] border-[#F1F3EF] rounded-br-[20px]" />
            </div>
          )}
        </div>

        <div className="relative z-20 px-6 pb-8 pt-2 space-y-4">
          {!cameraError && (
            <div className="flex items-center justify-center gap-3">
              <div
                className={`w-7 h-7 rounded-full border-[3.5px] border-[#F1F3EF]/25 border-t-[#F1F3EF] ${
                  isProcessingFrame || !cameraReady ? 'animate-spin' : 'animate-pulse'
                }`}
              />
              <span className="text-[18px] font-bold text-[#F1F3EF] tracking-tight">
                {!cameraReady
                  ? 'Запускаем камеру...'
                  : isProcessingFrame
                  ? 'Распознаём цифры...'
                  : 'Ищем показания...'}
              </span>
            </div>
          )}

          <div className="w-full bg-[#18201B]/95 rounded-[24px] px-5 py-5 text-center">
            <span className="text-[15px] font-medium text-[#D5DDD8] leading-snug block">
              {hintMessage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ИСПРАВЛЕННЫЙ КОМПОНЕНТ: корректно переходит из пустого состояния (0/0 -> "–/–") к первому замеру нового пользователя
const AnimatedAvgPressure = ({ sys, dia, onInitialComplete, isInitialDone }) => {
  const [display, setDisplay] = useState(() => {
    if (!sys || !dia) return { sys: 0, dia: 0 };
    if (isInitialDone) return { sys, dia };
    return { sys: Math.max(70, sys - 4), dia: Math.max(40, dia - 3) };
  });

  const [entered, setEntered] = useState(isInitialDone);
  const currentRef = useRef(display);
  const rafRef = useRef(null);
  const hasCompletedInitialRef = useRef(isInitialDone);

  useEffect(() => {
    currentRef.current = display;
  }, [display]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (!sys || !dia) {
      setDisplay({ sys: 0, dia: 0 });
      setEntered(true);
      onInitialComplete?.();
      return;
    }

    if (prefersReducedMotion) {
      setDisplay({ sys, dia });
      setEntered(true);
      hasCompletedInitialRef.current = true;
      onInitialComplete?.();
      return;
    }

    // Если это первый ненулевой замер (включая переход от 0/0 у нового пользователя)
    if (!hasCompletedInitialRef.current || !currentRef.current.sys || !currentRef.current.dia) {
      const startSys = Math.max(70, sys - 4);
      const startDia = Math.max(40, dia - 3);
      const duration = 360;
      const startTime = performance.now();

      requestAnimationFrame(() => setEntered(true));

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        setDisplay({
          sys: Math.round(startSys + (sys - startSys) * ease),
          dia: Math.round(startDia + (dia - startDia) * ease)
        });

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setDisplay({ sys, dia });
          hasCompletedInitialRef.current = true;
          onInitialComplete?.();
        }
      };

      rafRef.current = requestAnimationFrame(step);
    } else {
      const fromSys = currentRef.current.sys;
      const fromDia = currentRef.current.dia;

      if (fromSys === sys && fromDia === dia) {
        setDisplay({ sys, dia });
        return;
      }

      const duration = 280;
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        setDisplay({
          sys: Math.round(fromSys + (sys - fromSys) * ease),
          dia: Math.round(fromDia + (dia - fromDia) * ease)
        });

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setDisplay({ sys, dia });
        }
      };

      rafRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sys, dia, onInitialComplete]);

  const shownSys = display.sys || sys;
  const shownDia = display.dia || dia;

  return (
    <span
      className="text-[56px] font-black tracking-tighter leading-none text-[var(--text-primary)] tabular-nums inline-block bp-avg-transition"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0px)' : 'translateY(6px)'
      }}
    >
      {sys && dia ? `${shownSys}/${shownDia}` : '–/–'}
    </span>
  );
};

const AnimatedStatusBadge = ({ badge, visible }) => {
  const [renderedBadge, setRenderedBadge] = useState(badge);
  const [textFade, setTextFade] = useState(false);
  const prevTextRef = useRef(badge.text);

  useEffect(() => {
    if (prevTextRef.current !== badge.text) {
      prevTextRef.current = badge.text;
      setTextFade(true);
      const t = setTimeout(() => {
        setRenderedBadge(badge);
        setTextFade(false);
      }, 85);
      return () => clearTimeout(t);
    } else {
      setRenderedBadge(badge);
    }
  }, [badge]);

  return (
    <span
      className="px-3.5 py-1.5 rounded-full text-[14px] font-semibold shrink-0 inline-flex items-center justify-center bp-badge-transition"
      style={{
        backgroundColor: renderedBadge.bg,
        color: renderedBadge.textCol,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px) scale(1)' : 'translateY(5px) scale(0.97)'
      }}
    >
      <span
        className="bp-badge-text-transition"
        style={{ opacity: textFade ? 0 : 1 }}
      >
        {renderedBadge.text}
      </span>
    </span>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [theme, setTheme] = useState(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        const u = JSON.parse(savedSession);
        const savedUserTheme = localStorage.getItem(`${USER_THEME_PREFIX}${u.username}`) || u.theme;
        if (savedUserTheme === 'dark' || savedUserTheme === 'light') {
          return savedUserTheme;
        }
      } else {
        const demoTheme = sessionStorage.getItem(DEMO_THEME_SESSION_KEY);
        if (demoTheme === 'dark' || demoTheme === 'light') {
          return demoTheme;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 'light';
  });

  // 1. Защита от автопереводчика Chrome ("Толстый / Худой") и установка базовых PWA-тегов
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.lang = 'ru';
    html.setAttribute('translate', 'no');
    html.classList.add('notranslate');

    const ensureMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    ensureMeta('google', 'notranslate');
    ensureMeta('mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-capable', 'yes');
  }, []);

  // 2. Синхронизация системных полос Android/iOS (верхний статус-бар и нижний бар навигации) с темой приложения
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const bgHex = theme === 'dark' ? '#111813' : '#F2F3F0';
    const html = document.documentElement;
    const body = document.body;

    html.style.backgroundColor = bgHex;
    html.style.colorScheme = theme;
    if (body) {
      body.style.backgroundColor = bgHex;
      body.style.colorScheme = theme;
    }

    // Обновляем все мета-теги theme-color для мгновенной перекраски системных баров Android Chrome
    const themeMetas = document.querySelectorAll('meta[name="theme-color"]');
    if (themeMetas.length > 0) {
      themeMetas.forEach((m) => m.setAttribute('content', bgHex));
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      meta.setAttribute('content', bgHex);
      document.head.appendChild(meta);
    }

    let statusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!statusMeta) {
      statusMeta = document.createElement('meta');
      statusMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(statusMeta);
    }
    statusMeta.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default');

    // Если в index.html не прописан manifest.json, динамически инжектим PWA-манифест с display: standalone
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      const pwaIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="128" fill="${bgHex}"/><path d="M256 396s-124-78-124-166c0-46 36-82 80-82 26 0 44 14 44 14s18-14 44-14c44 0 80 36 80 82 0 88-124 166-124 166z" fill="#A9E66D"/></svg>`;
      const dynamicManifest = {
        name: 'Давление — дневник замеров',
        short_name: 'Давление',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: bgHex,
        theme_color: bgHex,
        icons: [
          {
            src: `data:image/svg+xml;utf8,${encodeURIComponent(pwaIconSvg)}`,
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      };
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      manifestLink.setAttribute(
        'href',
        `data:application/manifest+json;charset=utf-8,${encodeURIComponent(JSON.stringify(dynamicManifest))}`
      );
      document.head.appendChild(manifestLink);
    }
  }, [theme]);

  const handleSelectTheme = useCallback(
    (nextTheme) => {
      setTheme(nextTheme);
      try {
        if (currentUser) {
          localStorage.setItem(`${USER_THEME_PREFIX}${currentUser.username}`, nextTheme);
          const updatedUser = { ...currentUser, theme: nextTheme };
          setCurrentUser(updatedUser);
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem(DEMO_THEME_SESSION_KEY, nextTheme);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [currentUser]
  );

  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const u = JSON.parse(saved);
        const cached = localStorage.getItem(`bp_records_cache_${u.username}`);
        if (cached) return deduplicateRecords(JSON.parse(cached));
      }
    } catch (e) {
      console.error(e);
    }
    return DEMO_RECORDS;
  });

  const [demoTags, setDemoTags] = useState(DEFAULT_TAGS_NEW_USER);

  const [authMode, setAuthMode] = useState('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPin, setRegPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [cloudStatus, setCloudStatus] = useState('online');
  const [rawCloudCount, setRawCloudCount] = useState(() => DEMO_RECORDS.length);
  const [activeTab, setActiveTab] = useState('home');
  const [period, setPeriod] = useState('30d');
  const [dayTimeFilter, setDayTimeFilter] = useState('all');

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSheet, setActiveSheet] = useState(null);

  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [tempTime, setTempTime] = useState('09:00');

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanDemoNotice, setScanDemoNotice] = useState(false);
  const demoNoticeTimerRef = useRef(null);
  
  const [flashHighlight, setFlashHighlight] = useState(false);

  const [inputsUnlocked, setInputsUnlocked] = useState(false);

  const [dragOffset, setDragOffset] = useState(0);
  const touchStartYRef = useRef(null);

  const [sysInput, setSysInput] = useState('');
  const [diaInput, setDiaInput] = useState('');
  const [pulseInput, setPulseInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeInput, setTimeInput] = useState('09:30');

  const sysRef = useRef(null);
  const diaRef = useRef(null);
  const pulseRef = useRef(null);
  const noteRef = useRef(null);
  const avatarInputRef = useRef(null);
  const pulseBlurTimerRef = useRef(null);

  const authSheetRef = useRef(null);
  const authCtaRef = useRef(null);
  const dataSheetRef = useRef(null);
  const importCtaRef = useRef(null);
  const addSheetRef = useRef(null);
  const saveCtaRef = useRef(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [importText, setImportText] = useState('');

  const initialAvgDoneRef = useRef(false);
  const legendShownRef = useRef(false);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);

  const handleInitialAvgComplete = useCallback(() => {
    initialAvgDoneRef.current = true;
    setBadgeVisible(true);
  }, []);

  const handleChartInitialAnimationEnd = useCallback(() => {
    if (!legendShownRef.current) {
      legendShownRef.current = true;
      setLegendVisible(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;

    const handleViewportResize = () => {
      const occupiedBottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(occupiedBottom > 90 ? Math.round(occupiedBottom) : 0);
    };

    vv.addEventListener('resize', handleViewportResize);
    vv.addEventListener('scroll', handleViewportResize);
    handleViewportResize();

    return () => {
      vv.removeEventListener('resize', handleViewportResize);
      vv.removeEventListener('scroll', handleViewportResize);
    };
  }, []);

  const scrollTargetIntoSheetView = useCallback((targetRef) => {
    setTimeout(() => {
      if (targetRef?.current) {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 180);
  }, []);

  const userTags = useMemo(() => {
    if (!currentUser) return demoTags.slice(0, 4);
    if (Array.isArray(currentUser.tags)) return currentUser.tags.slice(0, 4);
    return currentUser.username === 'swanex' ? DEFAULT_TAGS_ROMA : DEFAULT_TAGS_NEW_USER;
  }, [currentUser, demoTags]);

  const saveSessionLocally = (userObj) => {
    setCurrentUser(userObj);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userObj));
  };

  const updateProfileInCloud = async (userObj, patchFields) => {
    if (!userObj) return;
    const updatedUser = { ...userObj, ...patchFields };
    saveSessionLocally(updatedUser);
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/bp_users?username=eq.${encodeURIComponent(userObj.username)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'x-user-login': userObj.username,
            'x-user-pin': userObj.pin
          },
          body: JSON.stringify(patchFields)
        }
      );
    } catch (e) {
      console.error(e);
    }
  };

  const emulateCloudSync = useCallback(() => {
    setCloudStatus('syncing');
    setTimeout(() => {
      setCloudStatus('online');
    }, 650);
  }, []);

  const fetchFromCloud = useCallback(async (userOverride) => {
    const activeUser = userOverride !== undefined ? userOverride : currentUser;
    if (!activeUser) {
      emulateCloudSync();
      return;
    }

    setCloudStatus('syncing');
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/bp_records?select=*&username=eq.${encodeURIComponent(
          activeUser.username
        )}&order=date.asc,time.asc`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'x-user-login': activeUser.username,
            'x-user-pin': activeUser.pin
          }
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setRawCloudCount(data.length);
        const unique = deduplicateRecords(data);
        setRecords(unique);
        localStorage.setItem(`bp_records_cache_${activeUser.username}`, JSON.stringify(unique));
        setCloudStatus('online');
      }
    } catch (err) {
      console.error(err);
      setCloudStatus('error');
    }
  }, [currentUser, emulateCloudSync]);

  useEffect(() => {
    if (currentUser) {
      fetchFromCloud(currentUser);
    } else {
      setRawCloudCount(records.length);
    }
  }, [currentUser, fetchFromCloud]);

  const handleLoginSubmit = async (pinOverride) => {
    const cleanLogin = loginUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const cleanPin = (pinOverride !== undefined ? pinOverride : loginPin).replace(/\D/g, '');

    if (!cleanLogin || cleanPin.length !== 4) {
      setAuthError('Введите логин и 4 цифры ПИН-кода');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/bp_users?username=eq.${encodeURIComponent(cleanLogin)}&select=*`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'x-user-login': cleanLogin,
            'x-user-pin': cleanPin
          }
        }
      );

      if (!res.ok) throw new Error('Ошибка сети');
      const rows = await res.json();

      if (!Array.isArray(rows) || rows.length === 0) {
        setAuthError('Неверный логин или ПИН-код');
        setAuthLoading(false);
        return;
      }

      const dbUser = rows[0];
      const legacyAvatar =
        cleanLogin === 'swanex' ? localStorage.getItem(LEGACY_AVATAR_KEY) : null;

      const savedUserTheme = localStorage.getItem(`${USER_THEME_PREFIX}${dbUser.username}`);
      const resolvedUserTheme =
        savedUserTheme === 'dark' || savedUserTheme === 'light' ? savedUserTheme : theme;

      localStorage.setItem(`${USER_THEME_PREFIX}${dbUser.username}`, resolvedUserTheme);
      setTheme(resolvedUserTheme);

      const loggedUser = {
        username: dbUser.username,
        pin: cleanPin,
        display_name: dbUser.display_name || cleanLogin,
        avatar: dbUser.avatar || legacyAvatar || null,
        theme: resolvedUserTheme,
        tags: Array.isArray(dbUser.tags)
          ? dbUser.tags.slice(0, 4)
          : cleanLogin === 'swanex'
          ? DEFAULT_TAGS_ROMA
          : DEFAULT_TAGS_NEW_USER
      };

      saveSessionLocally(loggedUser);
      if (!dbUser.avatar && legacyAvatar) {
        updateProfileInCloud(loggedUser, { avatar: legacyAvatar });
      }

      await fetchFromCloud(loggedUser);
      setAuthLoading(false);
      setActiveSheet(null);
    } catch (e) {
      console.error(e);
      setAuthError('Не удалось войти. Проверьте подключение');
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    const cleanLogin = regUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const cleanName = regDisplayName.trim();
    const cleanPin = regPin.replace(/\D/g, '');

    if (!cleanLogin || !cleanName || cleanPin.length !== 4) {
      setAuthError('Заполните логин (лат.), имя и 4 цифры ПИН-кода');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const payload = {
        username: cleanLogin,
        pin: cleanPin,
        display_name: cleanName,
        tags: DEFAULT_TAGS_NEW_USER
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/bp_users`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'x-user-login': cleanLogin,
          'x-user-pin': cleanPin
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 409) {
          setAuthError('Этот логин уже занят, выберите другой');
        } else {
          setAuthError('Ошибка при создании профиля');
        }
        setAuthLoading(false);
        return;
      }

      localStorage.setItem(`${USER_THEME_PREFIX}${cleanLogin}`, theme);

      const newUser = {
        ...payload,
        avatar: null,
        theme
      };

      saveSessionLocally(newUser);
      setRecords([]);
      setRawCloudCount(0);
      setAuthLoading(false);
      setActiveSheet(null);
    } catch (e) {
      console.error(e);
      setAuthError('Ошибка сети при регистрации');
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(DEMO_THEME_SESSION_KEY);
    setCurrentUser(null);
    setTheme('light');
    setRecords(DEMO_RECORDS);
    setRawCloudCount(DEMO_RECORDS.length);
    setDemoTags(DEFAULT_TAGS_NEW_USER);
    setActiveSheet(null);
  };

  useEffect(() => {
    if (activeSheet) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
    setDragOffset(0);
    setInputsUnlocked(false);
    setScannerOpen(false);
    setScanDemoNotice(false);
    if (pulseBlurTimerRef.current) clearTimeout(pulseBlurTimerRef.current);
  }, [activeSheet]);

  const handleSheetTouchStart = (e) => {
    if (scannerOpen || keyboardHeight > 0) return;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleSheetTouchMove = (e) => {
    if (scannerOpen || keyboardHeight > 0 || touchStartYRef.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleSheetTouchEnd = () => {
    if (scannerOpen || keyboardHeight > 0) return;
    if (dragOffset > 85) {
      setActiveSheet(null);
    }
    setDragOffset(0);
    touchStartYRef.current = null;
  };

  const upsertToCloud = async (itemsArray) => {
    if (!currentUser) return;
    setCloudStatus('syncing');
    try {
      const withUser = itemsArray.map((item) => ({
        ...item,
        username: currentUser.username
      }));

      const res = await fetch(`${SUPABASE_URL}/rest/v1/bp_records`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
          'x-user-login': currentUser.username,
          'x-user-pin': currentUser.pin
        },
        body: JSON.stringify(withUser)
      });
      if (!res.ok) throw new Error('Ошибка записи');
      setCloudStatus('online');
    } catch (e) {
      console.error(e);
      setCloudStatus('error');
    }
  };

  const deleteFromCloud = async (id) => {
    if (!currentUser) return;
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/bp_records?id=eq.${encodeURIComponent(id)}&username=eq.${encodeURIComponent(currentUser.username)}`,
        {
          method: 'DELETE',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'x-user-login': currentUser.username,
            'x-user-pin': currentUser.pin
          }
        }
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const compressedDataUrl = await compressAvatarImage(file);
    if (currentUser.username === 'swanex') {
      localStorage.setItem(LEGACY_AVATAR_KEY, compressedDataUrl);
    }
    await updateProfileInCloud(currentUser, { avatar: compressedDataUrl });
  };

  const handleRemoveTag = async (tagToRemove, e) => {
    e.stopPropagation();
    const nextTags = userTags.filter((t) => t !== tagToRemove);
    if (noteInput === tagToRemove) {
      setNoteInput('');
    }
    if (!currentUser) {
      setDemoTags(nextTags);
      return;
    }
    await updateProfileInCloud(currentUser, { tags: nextTags });
  };

  useEffect(() => {
    if (activeSheet === 'add') {
      const now = new Date();
      setDateInput(now.toISOString().slice(0, 10));
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setTimeInput(`${hh}:${mm}`);
      setTimeout(() => {
        setInputsUnlocked(true);
        if (sysRef.current) sysRef.current.focus();
      }, 140);
    }
  }, [activeSheet]);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) =>
      `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`)
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (sortedRecords.length === 0) return [];
    const lastDateStr = sortedRecords[sortedRecords.length - 1].date;
    const anchor = new Date(`${lastDateStr}T23:59:59`);

    let cutoff = null;
    if (period === '7d') {
      cutoff = new Date(anchor);
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (period === '30d') {
      cutoff = new Date(anchor);
      cutoff.setDate(cutoff.getDate() - 30);
    }

    return sortedRecords.filter((r) => {
      if (cutoff) {
        const d = new Date(`${r.date}T12:00:00`);
        if (d < cutoff) return false;
      }
      if (dayTimeFilter !== 'all') {
        const hour = parseInt((r.time || '09:00').split(':')[0], 10);
        if (dayTimeFilter === 'morning' && hour >= 13) return false;
        if (dayTimeFilter === 'evening' && hour < 13) return false;
      }
      return true;
    });
  }, [sortedRecords, period, dayTimeFilter]);

  const chartData = useMemo(() => {
    return filteredRecords.map((r) => ({
      ...r,
      shortLabel: formatHumanDate(r.date)
    }));
  }, [filteredRecords]);

  useEffect(() => {
    if (chartData.length > 0 && !legendShownRef.current) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        legendShownRef.current = true;
        setLegendVisible(true);
        return;
      }

      const fallbackTimer = setTimeout(() => {
        if (!legendShownRef.current) {
          legendShownRef.current = true;
          setLegendVisible(true);
        }
      }, 430);

      return () => clearTimeout(fallbackTimer);
    }
  }, [chartData.length]);

  const stats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        avgSys: 0,
        avgDia: 0,
        avgPulse: '–',
        firstDate: null,
        lastDate: null,
        latest: sortedRecords[sortedRecords.length - 1] || null
      };
    }
    let sysSum = 0;
    let diaSum = 0;
    let pulseSum = 0;
    let pulseCnt = 0;

    filteredRecords.forEach((r) => {
      sysSum += r.sys;
      diaSum += r.dia;
      if (r.pulse) {
        pulseSum += r.pulse;
        pulseCnt += 1;
      }
    });

    const cnt = filteredRecords.length;
    return {
      avgSys: Math.round(sysSum / cnt),
      avgDia: Math.round(diaSum / cnt),
      avgPulse: pulseCnt > 0 ? Math.round(pulseSum / pulseCnt) : '–',
      firstDate: filteredRecords[0].date,
      lastDate: filteredRecords[cnt - 1].date,
      latest: sortedRecords[sortedRecords.length - 1]
    };
  }, [filteredRecords, sortedRecords]);

  const handleSysChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setSysInput(val);
    if (val.length === 3 || (val.length === 2 && parseInt(val, 10) >= 85 && parseInt(val, 10) <= 99)) {
      if (diaRef.current) diaRef.current.focus();
    }
  };

  const handleDiaChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setDiaInput(val);
    if (val.length === 3 || (val.length === 2 && parseInt(val, 10) >= 45)) {
      if (pulseRef.current) pulseRef.current.focus();
    }
  };

  const handlePulseChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setPulseInput(val);

    if (pulseBlurTimerRef.current) {
      clearTimeout(pulseBlurTimerRef.current);
      pulseBlurTimerRef.current = null;
    }

    const num = parseInt(val, 10);
    if (val.length === 3) {
      pulseRef.current?.blur();
    } else if (val.length === 2 && num >= 35 && num <= 99) {
      pulseBlurTimerRef.current = setTimeout(() => {
        pulseRef.current?.blur();
      }, 120);
    } else if (val.length === 2 && (val.startsWith('1') || val.startsWith('2'))) {
      pulseBlurTimerRef.current = setTimeout(() => {
        pulseRef.current?.blur();
      }, 900);
    }
  };

  const handleInputEnterBlur = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleScanButtonClick = () => {
    if (!currentUser) {
      if (demoNoticeTimerRef.current) clearTimeout(demoNoticeTimerRef.current);
      setScanDemoNotice(true);
      demoNoticeTimerRef.current = setTimeout(() => {
        setScanDemoNotice(false);
      }, 2000);
      return;
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setScannerOpen(true);
  };

  const handleScannerDetected = useCallback(({ sys, dia, pulse }) => {
    if (pulseBlurTimerRef.current) clearTimeout(pulseBlurTimerRef.current);
    sysRef.current?.blur();
    diaRef.current?.blur();
    pulseRef.current?.blur();
    noteRef.current?.blur();

    setSysInput(sys);
    setDiaInput(dia);
    setPulseInput(pulse || '');
    setScannerOpen(false);
    
    setTimeout(() => setFlashHighlight(true), 50);
    setTimeout(() => setFlashHighlight(false), 1250);
  }, []);

  const handleSaveRecord = async () => {
    const s = parseInt(sysInput, 10);
    const d = parseInt(diaInput, 10);
    const p = pulseInput ? parseInt(pulseInput, 10) : null;

    if (!s || !d) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const cleanNote = noteInput.trim();
    const activeUsername = currentUser ? currentUser.username : 'demo';
    const recordIdPrefix = activeUsername === 'swanex' ? 'r' : `r-${activeUsername}`;

    const uniqueTimeId = Date.now().toString().slice(-5);
    const newItem = {
      id: `${recordIdPrefix}-${dateInput}-${timeInput.replace(':', '')}-${uniqueTimeId}`,
      username: activeUsername,
      date: dateInput,
      time: timeInput,
      sys: s,
      dia: d,
      pulse: p,
      note: cleanNote || 'Замер'
    };

    if (cleanNote && cleanNote !== 'Замер' && !userTags.includes(cleanNote) && userTags.length < 4) {
      const updatedTags = [...userTags, cleanNote];
      if (currentUser) {
        updateProfileInCloud(currentUser, { tags: updatedTags });
      } else {
        setDemoTags(updatedTags);
      }
    }

    const updated = deduplicateRecords([...records, newItem]);
    setRecords(updated);
    setRawCloudCount(updated.length);

    if (currentUser) {
      localStorage.setItem(`bp_records_cache_${currentUser.username}`, JSON.stringify(updated));
    }

    setSysInput('');
    setDiaInput('');
    setPulseInput('');
    setNoteInput('');
    setActiveSheet(null);

    if (currentUser) {
      await upsertToCloud([newItem]);
    } else {
      emulateCloudSync();
    }
  };

  const handleDelete = async (id) => {
    const updated = records.filter((item) => item.id !== id);
    setRecords(updated);
    setRawCloudCount(updated.length);

    if (currentUser) {
      localStorage.setItem(`bp_records_cache_${currentUser.username}`, JSON.stringify(updated));
      await deleteFromCloud(id);
    } else {
      emulateCloudSync();
    }
  };

  const handleExportCSV = () => {
    const header = 'Дата;Время;Верхнее;Нижнее;Пульс;Заметка\n';
    const body = [...sortedRecords]
      .reverse()
      .map((r) => `${r.date};${r.time};${r.sys};${r.dia};${r.pulse || ''};${r.note || ''}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pressure_${currentUser?.username || 'demo'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const activeUsername = currentUser ? currentUser.username : 'demo';
    const parsed = parseImportData(importText, activeUsername);
    if (parsed.length > 0) {
      const updated = deduplicateRecords([...records, ...parsed]);
      setRecords(updated);
      setRawCloudCount(updated.length);
      if (currentUser) {
        localStorage.setItem(`bp_records_cache_${currentUser.username}`, JSON.stringify(updated));
      }
      setImportText('');
      setActiveSheet(null);
      if (currentUser) {
        await upsertToCloud(parsed);
      } else {
        emulateCloudSync();
      }
    }
  };

  const historyList = useMemo(() => {
    const rev = [...sortedRecords].reverse();
    if (!searchQuery.trim()) return rev;
    const q = searchQuery.toLowerCase();
    return rev.filter(
      (r) =>
        (r.note && r.note.toLowerCase().includes(q)) ||
        r.date.includes(q) ||
        `${r.sys}/${r.dia}`.includes(q)
    );
  }, [sortedRecords, searchQuery]);

  const latestRec = stats.latest;
  const avgBadge = getStatusLabel(stats.avgSys, stats.avgDia);
  const greetingText = getGreetingByHour();

  const periodRangeLabel = useMemo(() => {
    if (!stats.firstDate || !stats.lastDate) return 'Нет записей за выбранный период';
    const startStr = formatHumanDate(stats.firstDate);
    const endStr = formatHumanDate(stats.lastDate);
    const count = filteredRecords.length;
    const rangePart = startStr === endStr ? startStr : `${startStr} – ${endStr}`;
    return `${rangePart} · ${count} ${pluralizeMeasurements(count)}`;
  }, [stats.firstDate, stats.lastDate, filteredRecords.length]);

  const resolvedAvatar = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.avatar) return currentUser.avatar;
    if (currentUser.username === 'swanex') {
      return localStorage.getItem(LEGACY_AVATAR_KEY) || DEFAULT_ROMA_AVATAR_SVG;
    }
    return null;
  }, [currentUser]);

  return (
    <div
      data-theme={theme}
      lang="ru"
      translate="no"
      className="notranslate min-h-screen bg-[var(--bg-outer)] text-[var(--text-primary)] flex justify-center font-sans select-none bp-theme-surface"
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      <style>{`
        :root, [data-theme="light"] {
          --bg-outer: #F2F3F0;
          --bg-app: #F2F3F0;
          --bg-sheet: #EFEFEF;
          --surface-card: #FFFFFF;
          --surface-secondary: #E4E4E4;
          --surface-tertiary: #F4F5F2;
          --surface-input: #FFFFFF;
          --surface-hover: #E4E7E4;
          --text-primary: #141A16;
          --text-label-strong: #181C24;
          --text-secondary: #6E7671;
          --text-Subtle: #5A625D;
          --text-muted: #7A827D;
          --text-faint: #8F9691;
          --placeholder-color: #B0B7B2;
          --placeholder-input: #C8CFCB;
          --cta-bg: #141A16;
          --cta-text: #FFFFFF;
          --cta-logout-bg: #141A16;
          --cta-logout-text: #F87171;
          --import-btn-bg: transparent;
          --import-btn-text: #141A16;
          --import-btn-border: #141A16;
          --scan-btn-disabled-border: #C8CFCB;
          --scan-btn-disabled-text: #8F9691;
          --tab-active-bg: #141A16;
          --tab-active-text: #FFFFFF;
          --period-active-bg: #141A16;
          --period-active-text: #FFFFFF;
          --filter-active-bg: #141A16;
          --filter-active-text: #FFFFFF;
          --filter-evening-bg: #EEF1FA;
          --filter-evening-text: #3B4990;
          --card-latest-bg: #DEE2EA;
          --card-latest-date: #3B4990;
          --card-pulse-bg: #E4E4E4;
          --stat-icon-circle-bg: #FFFFFF;
          --upper-pressure: #689F38;
          --lower-pressure: #5BA4B6;
          --chart-grid: #ECEEED;
          --chart-sys-grad-start: #D6EBB4;
          --chart-sys-grad-end: #D6EBB4;
          --chart-dia-grad-start: #CDE9F2;
          --chart-dia-grad-end: #CDE9F2;
          --dot-stroke: #FFFFFF;
          --status-empty-bg: #EFEFEF;
          --status-empty-text: #6E7671;
          --status-low-bg: #CDE9F2;
          --status-low-text: #141A16;
          --status-normal-bg: #D6EBB4;
          --status-normal-text: #141A16;
          --status-elevated-bg: #EFEFEF;
          --status-elevated-text: #141A16;
          --status-high-bg: #141A16;
          --status-high-text: #FFFFFF;
          --sys-box-bg: #D8EEB9;
          --sys-box-label: #4A5D2F;
          --sys-box-value: #4A5D2F;
          --sys-box-placeholder: #A5C282;
          --sys-box-highlight: #A9E66D;
          --dia-box-bg: #D4ECF4;
          --dia-box-label: #395C66;
          --dia-box-value: #395C66;
          --dia-box-placeholder: #A0C9D6;
          --dia-box-highlight: #67C4DA;
          --pulse-box-bg: #E4E4E4;
          --pulse-box-label: #5A625D;
          --pulse-box-value: #5A625D;
          --pulse-box-placeholder: #B0B7B2;
          --pulse-box-highlight: #B0B7B2;
          --tag-bg: #7A827D;
          --tag-text: #FFFFFF;
          --tag-x: #C8CFCB;
          --sheet-handle: #C8CFCB;
          --drum-highlight: #D8EEB9;
          --drum-active-text: #141A16;
          --drum-inactive-text: #5A625D;
          --drum-colon: #141A16;
          --tooltip-bg: #141A16;
          --tooltip-text: #FFFFFF;
          --tooltip-sub: #A3ABA6;
          --tooltip-note: #E2E6E3;
          --delete-icon: #B0B7B2;
          --avatar-bg: #141A16;
          --avatar-icon: #FFFFFF;
          --nav-shadow: 0 8px 32px rgba(20, 26, 22, 0.08);
          --nav-border: rgba(20, 26, 22, 0.05);
        }

        [data-theme="dark"] {
          --bg-outer: #111813;
          --bg-app: #111813;
          --bg-sheet: #202722;
          --surface-card: #232C26;
          --surface-secondary: #29322C;
          --surface-tertiary: #1B231E;
          --surface-input: #29322C;
          --surface-hover: #354139;
          --text-primary: #F1F3EF;
          --text-label-strong: #F1F3EF;
          --text-secondary: #ADB6B0;
          --text-Subtle: #ADB6B0;
          --text-muted: #858F88;
          --text-faint: #858F88;
          --placeholder-color: #858F88;
          --placeholder-input: #6E7872;
          --cta-bg: #EAF3EF;
          --cta-text: #141A16;
          --cta-logout-bg: #EAF3EF;
          --cta-logout-text: #DC2626;
          --import-btn-bg: transparent;
          --import-btn-text: #F1F3EF;
          --import-btn-border: #49544D;
          --scan-btn-disabled-border: #354139;
          --scan-btn-disabled-text: #6E7872;
          --tab-active-bg: #D6EBB4;
          --tab-active-text: #141A16;
          --period-active-bg: #111813;
          --period-active-text: #F1F3EF;
          --filter-active-bg: #111813;
          --filter-active-text: #F1F3EF;
          --filter-evening-bg: #252B3B;
          --filter-evening-text: #9BAEFF;
          --card-latest-bg: #232B38;
          --card-latest-date: #7D97F4;
          --card-pulse-bg: #262E29;
          --stat-icon-circle-bg: #323C36;
          --upper-pressure: #A9E66D;
          --lower-pressure: #67C4DA;
          --chart-grid: #2F3A33;
          --chart-sys-grad-start: #A9E66D;
          --chart-sys-grad-end: #232C26;
          --chart-dia-grad-start: #67C4DA;
          --chart-dia-grad-end: #232C26;
          --dot-stroke: #232C26;
          --status-empty-bg: #29322C;
          --status-empty-text: #ADB6B0;
          --status-low-bg: #213740;
          --status-low-text: #8AD8EB;
          --status-normal-bg: #354729;
          --status-normal-text: #D6EBB4;
          --status-elevated-bg: #C8CED8;
          --status-elevated-text: #141A16;
          --status-high-bg: #141A16;
          --status-high-text: #F1F3EF;
          --sys-box-bg: #2D3D24;
          --sys-box-label: #D6EBB4;
          --sys-box-value: #D6EBB4;
          --sys-box-placeholder: #8CB068;
          --sys-box-highlight: #4A6335;
          --dia-box-bg: #22353D;
          --dia-box-label: #9CE1F2;
          --dia-box-value: #9CE1F2;
          --dia-box-placeholder: #6298A8;
          --dia-box-highlight: #2A5A6B;
          --pulse-box-bg: #2D3530;
          --pulse-box-label: #D5DDD8;
          --pulse-box-value: #F1F3EF;
          --pulse-box-placeholder: #858F88;
          --pulse-box-highlight: #49544D;
          --tag-bg: #323C36;
          --tag-text: #F1F3EF;
          --tag-x: #858F88;
          --sheet-handle: #49544D;
          --drum-highlight: #2D3D24;
          --drum-active-text: #F1F3EF;
          --drum-inactive-text: #ADB6B0;
          --drum-colon: #ADB6B0;
          --tooltip-bg: #111813;
          --tooltip-text: #F1F3EF;
          --tooltip-sub: #ADB6B0;
          --tooltip-note: #D5DDD8;
          --delete-icon: #858F88;
          --avatar-bg: #232C26;
          --avatar-icon: #F1F3EF;
          --nav-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
          --nav-border: rgba(241, 243, 239, 0.05);
        }

        .bp-theme-surface,
        .bp-theme-surface section,
        .bp-theme-surface header button,
        .bp-theme-surface main > div {
          transition: background-color 180ms ease, color 180ms ease;
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        input[type="time"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
          opacity: 0;
        }
        .bp-avg-transition {
          transition: opacity 340ms cubic-bezier(0.22, 1, 0.36, 1), transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .bp-badge-transition {
          transition: opacity 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms ease, color 180ms ease;
          will-change: opacity, transform, background-color, color;
        }
        .bp-badge-text-transition {
          transition: opacity 85ms ease;
        }
        .bp-legend-opacity {
          transition: opacity 160ms ease-out;
        }
        
        @keyframes flash-sys {
          0% { background-color: var(--sys-box-bg); }
          30% { background-color: var(--sys-box-highlight); transform: scale(1.02); }
          70% { background-color: var(--sys-box-highlight); transform: scale(1.02); }
          100% { background-color: var(--sys-box-bg); transform: scale(1); }
        }
        @keyframes flash-dia {
          0% { background-color: var(--dia-box-bg); }
          30% { background-color: var(--dia-box-highlight); transform: scale(1.02); }
          70% { background-color: var(--dia-box-highlight); transform: scale(1.02); }
          100% { background-color: var(--dia-box-bg); transform: scale(1); }
        }
        @keyframes flash-pulse {
          0% { background-color: var(--pulse-box-bg); }
          30% { background-color: var(--pulse-box-highlight); transform: scale(1.02); }
          70% { background-color: var(--pulse-box-highlight); transform: scale(1.02); }
          100% { background-color: var(--pulse-box-bg); transform: scale(1); }
        }

        .animate-flash-sys { animation: flash-sys 1.2s ease-out; }
        .animate-flash-dia { animation: flash-dia 1.2s ease-out; }
        .animate-flash-pulse { animation: flash-pulse 1.2s ease-out; }

        @media (prefers-reduced-motion: reduce) {
          .bp-avg-transition,
          .bp-badge-transition,
          .bp-badge-text-transition,
          .bp-legend-opacity {
            transition: none !important;
            transform: none !important;
          }
          .animate-flash-sys,
          .animate-flash-dia,
          .animate-flash-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-[440px] min-h-screen bg-[var(--bg-app)] pb-28 px-5 relative flex flex-col bp-theme-surface">
        
        <div
          className={
            activeTab === 'history'
              ? 'sticky top-0 z-20 bg-[var(--bg-app)] pt-6 pb-2.5'
              : 'pt-6 mb-5'
          }
        >
          <header className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              {currentUser ? (
                <>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    title="Нажмите, чтобы сменить аватар"
                    className="w-[50px] h-[50px] rounded-full overflow-hidden bg-[var(--avatar-bg)] shrink-0 relative group cursor-pointer flex items-center justify-center text-[var(--avatar-icon)]"
                  >
                    {resolvedAvatar ? (
                      <img
                        src={resolvedAvatar}
                        alt={currentUser.display_name}
                        draggable={false}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <User className="w-5 h-5 text-[var(--avatar-icon)]" strokeWidth={2} />
                    )}
                    <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                      <Camera className="w-4 h-4" />
                    </span>
                  </button>

                  <div className="min-w-0">
                    <div className="text-[13px] text-[var(--text-secondary)] font-medium leading-tight whitespace-nowrap">
                      {greetingText}
                    </div>
                    <div className="text-[17px] font-extrabold tracking-tight text-[var(--text-primary)] leading-snug truncate">
                      {currentUser.display_name}
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => {
                    setAuthError('');
                    setLoginPin('');
                    setActiveSheet('auth');
                  }}
                  className="flex items-center gap-3 min-w-0 text-left active:opacity-80 transition cursor-pointer"
                >
                  <div className="w-[50px] h-[50px] rounded-full bg-[var(--avatar-bg)] shrink-0 flex items-center justify-center text-[var(--avatar-icon)]">
                    <User className="w-5 h-5 text-[var(--avatar-icon)]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] text-[var(--text-secondary)] font-medium leading-tight whitespace-nowrap">
                      Демо-режим
                    </div>
                    <div className="text-[17px] font-extrabold tracking-tight text-[var(--text-primary)] leading-snug whitespace-nowrap inline-flex items-center gap-1">
                      <span>Войти</span>
                      <ChevronRight className="w-4 h-4 text-[var(--text-primary)] shrink-0 stroke-[2.6]" />
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (currentUser) {
                    fetchFromCloud(currentUser);
                  } else {
                    emulateCloudSync();
                  }
                }}
                title={
                  !currentUser
                    ? 'Демо-режим (локальная сессия)'
                    : cloudStatus === 'online'
                    ? 'Синхронизировано'
                    : cloudStatus === 'syncing'
                    ? 'Синхронизация...'
                    : 'Ошибка подключения'
                }
                className="w-11 h-11 rounded-full bg-[var(--surface-card)] flex items-center justify-center active:scale-95 transition cursor-pointer text-[var(--text-primary)]"
                aria-label="Статус облачной синхронизации"
              >
                {cloudStatus === 'syncing' ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-[var(--text-primary)]" />
                ) : (
                  <CloudCheckIcon className="w-5 h-5 text-[var(--text-primary)]" />
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('history');
                  setSearchOpen((prev) => !prev);
                }}
                className="w-11 h-11 rounded-full bg-[var(--surface-card)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 transition cursor-pointer"
                aria-label="Поиск"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveSheet('data')}
                className="w-11 h-11 rounded-full bg-[var(--surface-card)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 transition cursor-pointer"
                aria-label="Настройки"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </header>

          {activeTab === 'history' && (
            <div className="mt-5">
              {searchOpen && (
                <div className="mb-3">
                  <input
                    type="text"
                    name="nofill_bp_search"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleInputEnterBlur}
                    placeholder="Найти: кофе, трени, сахар, утро..."
                    className="w-full bg-[var(--surface-card)] rounded-[22px] px-5 py-3.5 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none select-text"
                  />
                </div>
              )}

              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-[var(--text-muted)]">
                  Уникальных замеров: {historyList.length}
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-[var(--text-primary)] underline cursor-pointer"
                  >
                    Сбросить поиск
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {activeTab === 'home' && (
          <main className="space-y-4">
            <div className="bg-[var(--surface-card)] rounded-[30px] p-1.5 grid grid-cols-3">
              {[
                { id: '7d', label: 'Неделя' },
                { id: '30d', label: 'Месяц' },
                { id: 'all', label: 'Год' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id)}
                  className={`py-3 rounded-[26px] text-[15px] font-semibold transition cursor-pointer ${
                    period === tab.id
                      ? 'bg-[var(--period-active-bg)] text-[var(--period-active-text)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <section className="bg-[var(--surface-card)] rounded-[32px] p-5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <AnimatedAvgPressure
                  sys={stats.avgSys}
                  dia={stats.avgDia}
                  isInitialDone={initialAvgDoneRef.current}
                  onInitialComplete={handleInitialAvgComplete}
                />
                <AnimatedStatusBadge
                  badge={avgBadge}
                  visible={badgeVisible || initialAvgDoneRef.current}
                />
              </div>

              <div className="mb-4">
                <div className="text-[16px] font-bold text-[var(--text-primary)]">Среднее за период</div>
                <div className="text-[14px] font-medium text-[var(--text-muted)] mt-0.5">{periodRangeLabel}</div>
              </div>

              <div className="h-[150px] w-full -mx-2 relative">
                {chartData.length > 0 && (
                  <>
                    <div
                      className={`absolute right-[2px] top-[12px] text-[11px] font-bold pointer-events-none z-10 bp-legend-opacity ${
                        legendVisible || legendShownRef.current ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ color: 'var(--upper-pressure)' }}
                    >
                      Верхнее
                    </div>
                    <div
                      className={`absolute right-[2px] top-[100px] text-[11px] font-bold pointer-events-none z-10 bp-legend-opacity ${
                        legendVisible || legendShownRef.current ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ color: 'var(--lower-pressure)' }}
                    >
                      Нижнее
                    </div>
                  </>
                )}

                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" className="relative z-0">
                    <AreaChart data={chartData} margin={{ top: 12, right: 0, left: -26, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sysFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-sys-grad-start)" stopOpacity={theme === 'dark' ? 0.35 : 0.8} />
                          <stop offset="95%" stopColor="var(--chart-sys-grad-end)" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="diaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-dia-grad-start)" stopOpacity={theme === 'dark' ? 0.32 : 0.75} />
                          <stop offset="95%" stopColor="var(--chart-dia-grad-end)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis
                        dataKey="shortLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 13, fill: 'var(--text-muted)' }}
                        minTickGap={34}
                      />
                      <YAxis
                        domain={[60, 148]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 13, fill: 'var(--text-muted)' }}
                        ticks={[75, 100, 125]}
                      />
                      <Tooltip
                        wrapperStyle={{ zIndex: 100 }}
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const item = payload[0].payload;
                          return (
                            <div className="bg-[var(--tooltip-bg)] text-[var(--tooltip-text)] rounded-[20px] px-4 py-3">
                              <div className="text-xs text-[var(--tooltip-sub)] mb-0.5">
                                {formatHumanDate(item.date)} · {item.time}
                              </div>
                              <div className="text-lg font-bold">
                                {item.sys}/{item.dia}{' '}
                                {item.pulse && (
                                  <span className="text-sm font-normal text-[#D6EBB4] ml-1">
                                    ♥ {item.pulse}
                                  </span>
                                )}
                              </div>
                              {item.note && (
                                <div className="text-xs text-[var(--tooltip-note)] mt-1 max-w-[200px] leading-snug">
                                  {item.note}
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sys"
                        stroke="var(--upper-pressure)"
                        strokeWidth={2.4}
                        fill="url(#sysFill)"
                        animationDuration={380}
                        onAnimationEnd={handleChartInitialAnimationEnd}
                        activeDot={{ r: 5, fill: 'var(--upper-pressure)', stroke: 'var(--dot-stroke)', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="dia"
                        stroke="var(--lower-pressure)"
                        strokeWidth={2.4}
                        fill="url(#diaFill)"
                        animationDuration={380}
                        activeDot={{ r: 5, fill: 'var(--lower-pressure)', stroke: 'var(--dot-stroke)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-center px-6 text-sm text-[var(--text-faint)]">
                    Нажмите «+» внизу экрана, чтобы добавить первый замер
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2.5">
                <button
                  onClick={() => setDayTimeFilter('all')}
                  className={`flex-1 py-3 rounded-full text-[15px] font-bold transition cursor-pointer text-center ${
                    dayTimeFilter === 'all'
                      ? 'bg-[var(--filter-active-bg)] text-[var(--filter-active-text)]'
                      : 'bg-[var(--surface-tertiary)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  Все
                </button>

                <button
                  onClick={() => setDayTimeFilter('morning')}
                  className={`flex-1 py-3 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    dayTimeFilter === 'morning'
                      ? 'bg-[var(--filter-active-bg)] text-[var(--filter-active-text)]'
                      : 'bg-[var(--surface-tertiary)] text-[var(--text-Subtle)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <Sun className="w-[18px] h-[18px] text-[#FE9A00] fill-[#FE9A00]" />
                  <span>Утро</span>
                </button>

                <button
                  onClick={() => setDayTimeFilter('evening')}
                  className={`flex-1 py-3 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    dayTimeFilter === 'evening'
                      ? 'bg-[var(--filter-active-bg)] text-[var(--filter-active-text)]'
                      : 'bg-[var(--filter-evening-bg)] text-[var(--filter-evening-text)] hover:opacity-90'
                  }`}
                >
                  <Moon className="w-[18px] h-[18px] text-[#615FFF] fill-[#615FFF]" />
                  <span>Вечер</span>
                </button>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3.5 pt-1">
              <div className="rounded-[28px] bg-[var(--card-latest-bg)] p-5 flex flex-col justify-between h-[152px]">
                <div>
                  <div className="text-[36px] font-black tracking-tight leading-none text-[var(--text-primary)]">
                    {latestRec ? `${latestRec.sys}/${latestRec.dia}` : '–'}
                  </div>
                  <div className="text-[14px] font-bold text-[var(--card-latest-date)] mt-1.5">
                    {latestRec ? formatHumanDate(latestRec.date) : '–'}
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-[14px] font-bold leading-tight text-[var(--text-primary)]">
                    Последний
                    <br />
                    замер
                  </div>
                  <div className="w-[44px] h-[44px] rounded-full bg-[var(--stat-icon-circle-bg)] flex items-center justify-center text-[var(--text-primary)] shrink-0">
                    <Activity className="w-[22px] h-[22px]" strokeWidth={2.2} />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card-pulse-bg)] rounded-[28px] p-5 flex flex-col justify-between h-[152px]">
                <div>
                  <div className="text-[36px] font-black tracking-tight leading-none text-[var(--text-primary)]">
                    {stats.avgPulse}
                  </div>
                  <div className="text-[14px] text-[var(--text-Subtle)] font-bold mt-1.5">
                    уд/мин
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-[14px] font-bold leading-tight text-[var(--text-primary)]">
                    Средний
                    <br />
                    пульс
                  </div>
                  <div className="w-[44px] h-[44px] rounded-full bg-[var(--stat-icon-circle-bg)] flex items-center justify-center text-[var(--text-primary)] shrink-0">
                    <Heart className="w-[22px] h-[22px]" strokeWidth={2.2} />
                  </div>
                </div>
              </div>
            </section>
          </main>
        )}

        {activeTab === 'history' && (
          <main className="space-y-3">
            {historyList.map((item) => {
              const badge = getStatusLabel(item.sys, item.dia);
              return (
                <div
                  key={item.id}
                  className="bg-[var(--surface-card)] rounded-[26px] px-5 py-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[24px] font-black tracking-tight text-[var(--text-primary)]">
                        {item.sys}/{item.dia}
                      </span>
                      {item.pulse && (
                        <span className="text-[16px] font-bold text-[var(--lower-pressure)]">
                          ♥ {item.pulse}
                        </span>
                      )}
                      <span
                        className="text-[12px] font-bold px-2.5 py-1 rounded-full ml-auto sm:ml-1"
                        style={{ backgroundColor: badge.bg, color: badge.textCol }}
                      >
                        {badge.text}
                      </span>
                    </div>
                    <div className="text-[15px] font-medium text-[var(--text-Subtle)] mt-1.5 truncate">
                      {item.note || 'Замер'}
                    </div>
                    <div className="text-[13px] font-medium text-[var(--text-faint)] mt-0.5">
                      {formatHumanDate(item.date)} в {item.time}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--delete-icon)] hover:text-[var(--text-primary)] active:scale-95 transition cursor-pointer shrink-0"
                    title="Удалить запись"
                  >
                    <Trash2 className="w-[18px] h-[18px]" strokeWidth={2.2} />
                  </button>
                </div>
              );
            })}
          </main>
        )}

        <nav className="fixed bottom-5 left-0 right-0 z-30 flex justify-center px-5 pointer-events-none">
          <div 
            className="w-full max-w-[400px] h-[68px] bg-[var(--surface-card)] rounded-[34px] px-12 flex items-center justify-between pointer-events-auto"
            style={{ boxShadow: 'var(--nav-shadow)', border: '1px solid var(--nav-border)' }}
          >
            <button
              onClick={() => setActiveTab('home')}
              className="active:scale-95 transition cursor-pointer flex items-center justify-center"
              aria-label="Главная"
            >
              <HomeNavIcon solid={activeTab === 'home'} />
            </button>

            <button
              onClick={() => setActiveSheet('add')}
              className="w-[64px] h-[64px] -mt-6 rounded-full bg-[var(--cta-bg)] text-[var(--cta-text)] flex items-center justify-center active:scale-95 transition cursor-pointer"
              aria-label="Добавить замер"
            >
              <Plus className="w-[32px] h-[32px]" strokeWidth={2.2} />
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className="active:scale-95 transition cursor-pointer flex items-center justify-center"
              aria-label="История"
            >
              <HistoryNavIcon solid={activeTab === 'history'} />
            </button>
          </div>
        </nav>

        {/* ШТОРКА АВТОРИЗАЦИИ И РЕГИСТРАЦИИ */}
        {activeSheet === 'auth' && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none"
            style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px' }}
            onClick={() => setActiveSheet(null)}
          >
            <form
              ref={authSheetRef}
              autoComplete="off"
              onSubmit={(e) => e.preventDefault()}
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              style={{
                transform: `translateY(${dragOffset}px)`,
                transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none',
                maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight + 8}px)` : '92vh'
              }}
              className="w-full max-w-[440px] overflow-y-auto hide-scrollbar bg-[var(--bg-sheet)] rounded-t-[36px] px-6 pt-5 pb-6 flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-[var(--sheet-handle)] rounded-full shrink-0" />

              {keyboardHeight === 0 && (
                <div className="self-stretch pt-1 flex items-start justify-between gap-3 mb-1">
                  <div className="flex-1 flex flex-col items-start gap-2.5">
                    <h3 className="text-[38px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
                      Профиль
                    </h3>
                    <p className="text-[15px] font-medium text-[var(--text-secondary)] leading-tight">
                      {authMode === 'login'
                        ? 'Войдите, чтобы продолжить вести ваши измерения'
                        : 'Создайте аккаунт, чтобы начать сохранять ваши измерения'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-[var(--surface-input)] flex items-center justify-center text-[var(--text-primary)] shrink-0 cursor-pointer mt-1"
                    aria-label="Закрыть"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
              )}

              <div className="self-stretch p-1.5 bg-[var(--surface-secondary)] rounded-full grid grid-cols-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className={`py-3 rounded-full text-[16px] font-bold transition cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-text)]'
                      : 'text-[var(--text-primary)] hover:opacity-80'
                  }`}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                  }}
                  className={`py-3 rounded-full text-[16px] font-bold transition cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-text)]'
                      : 'text-[var(--text-primary)] hover:opacity-80'
                  }`}
                >
                  Создать
                </button>
              </div>

              {authMode === 'login' ? (
                <div className="self-stretch flex flex-col items-start gap-3.5">
                  <div className="self-stretch flex flex-col items-start gap-2.5">
                    <label className="self-stretch h-[60px] px-5 py-2.5 bg-[var(--surface-input)] rounded-[22px] flex items-center gap-0.5 cursor-text">
                      <span className="w-[85px] text-[16px] font-bold text-[var(--text-label-strong)] text-left select-none shrink-0">
                        Логин
                      </span>
                      <input
                        type="text"
                        name="nofill_bp_login_alias"
                        inputMode="text"
                        enterKeyHint="next"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        data-form-type="other"
                        aria-autocomplete="none"
                        placeholder="Латиницей"
                        value={loginUsername}
                        onFocus={() => scrollTargetIntoSheetView(authCtaRef)}
                        onChange={(e) => {
                          setLoginUsername(
                            e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
                          );
                          setAuthError('');
                        }}
                        className="flex-1 min-w-0 w-full text-left text-[18px] font-bold text-[var(--text-primary)] placeholder-[var(--placeholder-input)] focus:outline-none bg-transparent select-text"
                      />
                    </label>

                    <label className="self-stretch h-[60px] px-5 py-2.5 bg-[var(--surface-input)] rounded-[22px] flex items-center gap-0.5 cursor-text">
                      <span className="w-[85px] text-[16px] font-bold text-[var(--text-label-strong)] text-left select-none shrink-0">
                        ПИН-код
                      </span>
                      <input
                        type="text"
                        name="nofill_bp_login_code"
                        inputMode="numeric"
                        enterKeyHint="done"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        data-form-type="other"
                        aria-autocomplete="none"
                        placeholder="••••"
                        value={loginPin}
                        onFocus={() => scrollTargetIntoSheetView(authCtaRef)}
                        onKeyDown={handleInputEnterBlur}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setLoginPin(clean);
                          setAuthError('');
                          if (clean.length === 4 && loginUsername.trim()) {
                            handleLoginSubmit(clean);
                          }
                        }}
                        className="flex-1 min-w-0 w-full text-left text-[30px] leading-none tracking-[10px] font-extrabold text-[var(--text-primary)] placeholder-[var(--placeholder-input)] focus:outline-none bg-transparent select-text"
                      />
                    </label>
                  </div>

                  {authError && (
                    <p className="self-stretch text-center text-[14px] font-bold text-red-500 -mt-1">
                      {authError}
                    </p>
                  )}

                  <button
                    ref={authCtaRef}
                    type="button"
                    disabled={authLoading}
                    onClick={() => handleLoginSubmit()}
                    className="self-stretch py-[17px] rounded-full bg-[var(--cta-bg)] text-[var(--cta-text)] text-[20px] font-bold flex items-center justify-center active:scale-[0.99] transition cursor-pointer mt-0.5 shrink-0"
                  >
                    {authLoading ? 'Проверяем...' : 'Войти в дневник'}
                  </button>
                </div>
              ) : (
                <div className="self-stretch flex flex-col items-start gap-3.5">
                  <div className="self-stretch flex flex-col items-start gap-2.5">
                    <label className="self-stretch h-[58px] px-5 py-2 bg-[var(--surface-input)] rounded-[22px] flex items-center gap-0.5 cursor-text">
                      <span className="w-[85px] text-[16px] font-bold text-[var(--text-label-strong)] text-left select-none shrink-0">
                        Ваше имя
                      </span>
                      <input
                        type="text"
                        name="nofill_bp_reg_label"
                        inputMode="text"
                        enterKeyHint="next"
                        autoComplete="new-password"
                        autoCorrect="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        data-form-type="other"
                        aria-autocomplete="none"
                        placeholder="Например Нина"
                        value={regDisplayName}
                        onFocus={() => scrollTargetIntoSheetView(authCtaRef)}
                        onChange={(e) => {
                          setRegDisplayName(e.target.value);
                          setAuthError('');
                        }}
                        className="flex-1 min-w-0 w-full text-left text-[18px] font-bold text-[var(--text-primary)] placeholder-[var(--placeholder-input)] focus:outline-none bg-transparent select-text"
                      />
                    </label>

                    <label className="self-stretch h-[58px] px-5 py-2 bg-[var(--surface-input)] rounded-[22px] flex items-center gap-0.5 cursor-text">
                      <span className="w-[85px] text-[16px] font-bold text-[var(--text-label-strong)] text-left select-none shrink-0">
                        Логин
                      </span>
                      <input
                        type="text"
                        name="nofill_bp_reg_alias"
                        inputMode="text"
                        enterKeyHint="next"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        data-form-type="other"
                        aria-autocomplete="none"
                        placeholder="Латиницей"
                        value={regUsername}
                        onFocus={() => scrollTargetIntoSheetView(authCtaRef)}
                        onChange={(e) => {
                          setRegUsername(
                            e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
                          );
                          setAuthError('');
                        }}
                        className="flex-1 min-w-0 w-full text-left text-[18px] font-bold text-[var(--text-primary)] placeholder-[var(--placeholder-input)] focus:outline-none bg-transparent select-text"
                      />
                    </label>

                    <label className="self-stretch h-[58px] px-5 py-2 bg-[var(--surface-input)] rounded-[22px] flex items-center gap-0.5 cursor-text">
                      <span className="w-[85px] text-[16px] font-bold text-[var(--text-label-strong)] text-left select-none shrink-0">
                        ПИН-код
                      </span>
                      <input
                        type="text"
                        name="nofill_bp_reg_code"
                        inputMode="numeric"
                        enterKeyHint="done"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        data-form-type="other"
                        aria-autocomplete="none"
                        placeholder="••••"
                        value={regPin}
                        onFocus={() => scrollTargetIntoSheetView(authCtaRef)}
                        onKeyDown={handleInputEnterBlur}
                        onChange={(e) => {
                          setRegPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                          setAuthError('');
                        }}
                        className="flex-1 min-w-0 w-full text-left text-[30px] leading-none tracking-[10px] font-extrabold text-[var(--text-primary)] placeholder-[var(--placeholder-input)] focus:outline-none bg-transparent select-text"
                      />
                    </label>
                  </div>

                  {authError && (
                    <p className="self-stretch text-center text-[14px] font-bold text-red-500 -mt-1">
                      {authError}
                    </p>
                  )}

                  <button
                    ref={authCtaRef}
                    type="button"
                    disabled={authLoading}
                    onClick={handleRegisterSubmit}
                    className="self-stretch py-[17px] rounded-full bg-[var(--cta-bg)] text-[var(--cta-text)] text-[20px] font-bold flex items-center justify-center active:scale-[0.99] transition cursor-pointer mt-0.5 shrink-0"
                  >
                    {authLoading ? 'Создаем...' : 'Создать дневник'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ШТОРКА ВВОДА НОВОГО ЗАМЕРА */}
        {activeSheet === 'add' && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none"
            style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px' }}
            onClick={() => {
              if (!scannerOpen) setActiveSheet(null);
            }}
          >
            <form
              ref={addSheetRef}
              autoComplete="off"
              onSubmit={(e) => e.preventDefault()}
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              style={{
                transform: `translateY(${dragOffset}px)`,
                transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none',
                maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight + 8}px)` : '92vh'
              }}
              className="w-full max-w-[440px] overflow-y-auto hide-scrollbar bg-[var(--bg-sheet)] rounded-t-[36px] px-6 pt-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-[var(--sheet-handle)] rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[38px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
                  Новый замер
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="w-10 h-10 rounded-full bg-[var(--surface-input)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer shrink-0 mt-1"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              <div role="presentation" className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    className={`rounded-[26px] h-[110px] flex flex-col justify-center items-center p-2 relative overflow-hidden ${
                      flashHighlight ? 'animate-flash-sys' : 'bg-[var(--sys-box-bg)]'
                    }`}
                  >
                    <span className="block text-[15px] font-bold text-[var(--sys-box-label)] mb-1">
                      Верхнее
                    </span>
                    <input
                      ref={sysRef}
                      type="text"
                      name="nofill_bp_val_1"
                      inputMode="numeric"
                      enterKeyHint="next"
                      readOnly={!inputsUnlocked}
                      onFocus={() => setInputsUnlocked(true)}
                      onKeyDown={handleInputEnterBlur}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      data-form-type="other"
                      aria-autocomplete="none"
                      placeholder="120"
                      value={sysInput}
                      onChange={handleSysChange}
                      className="w-full text-center text-[40px] tracking-tight leading-none font-extrabold text-[var(--sys-box-value)] placeholder-[var(--sys-box-placeholder)] opacity-80 focus:opacity-100 focus:outline-none bg-transparent select-text"
                    />
                  </div>

                  <div 
                    className={`rounded-[26px] h-[110px] flex flex-col justify-center items-center p-2 relative overflow-hidden ${
                      flashHighlight ? 'animate-flash-dia' : 'bg-[var(--dia-box-bg)]'
                    }`}
                  >
                    <span className="block text-[15px] font-bold text-[var(--dia-box-label)] mb-1">
                      Нижнее
                    </span>
                    <input
                      ref={diaRef}
                      type="text"
                      name="nofill_bp_val_2"
                      inputMode="numeric"
                      enterKeyHint="next"
                      readOnly={!inputsUnlocked}
                      onFocus={() => setInputsUnlocked(true)}
                      onKeyDown={handleInputEnterBlur}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      data-form-type="other"
                      aria-autocomplete="none"
                      placeholder="82"
                      value={diaInput}
                      onChange={handleDiaChange}
                      className="w-full text-center text-[40px] tracking-tight leading-none font-extrabold text-[var(--dia-box-value)] placeholder-[var(--dia-box-placeholder)] opacity-80 focus:opacity-100 focus:outline-none bg-transparent select-text"
                    />
                  </div>

                  <div 
                    className={`rounded-[26px] h-[110px] flex flex-col justify-center items-center p-2 relative overflow-hidden ${
                      flashHighlight ? 'animate-flash-pulse' : 'bg-[var(--pulse-box-bg)]'
                    }`}
                  >
                    <span className="block text-[15px] font-bold text-[var(--pulse-box-label)] mb-1">
                      Пульс
                    </span>
                    <input
                      ref={pulseRef}
                      type="text"
                      name="nofill_bp_val_3"
                      inputMode="numeric"
                      enterKeyHint="done"
                      readOnly={!inputsUnlocked}
                      onFocus={() => setInputsUnlocked(true)}
                      onKeyDown={handleInputEnterBlur}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      data-form-type="other"
                      aria-autocomplete="none"
                      placeholder="64"
                      value={pulseInput}
                      onChange={handlePulseChange}
                      className="w-full text-center text-[40px] tracking-tight leading-none font-extrabold text-[var(--pulse-box-value)] placeholder-[var(--pulse-box-placeholder)] opacity-80 focus:opacity-100 focus:outline-none bg-transparent select-text"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleScanButtonClick}
                  className={`w-full h-[52px] rounded-full border bg-transparent font-bold text-[16px] flex items-center justify-center gap-2.5 transition cursor-pointer ${
                    currentUser
                      ? 'text-[var(--import-btn-text)] active:scale-[0.99]'
                      : 'text-[var(--scan-btn-disabled-text)]'
                  }`}
                  style={{
                    borderColor: currentUser
                      ? 'var(--import-btn-border)'
                      : 'var(--scan-btn-disabled-border)'
                  }}
                >
                  {scanDemoNotice ? (
                    <span>Только в режиме пользователя</span>
                  ) : (
                    <>
                      <ScanFrameIcon className="w-5 h-5 shrink-0" />
                      <span>Сканировать прибор</span>
                    </>
                  )}
                </button>

                <div className="bg-[var(--surface-input)] rounded-[26px] h-[72px] px-5 flex items-center justify-between">
                  <span className="text-[18px] font-bold text-[var(--text-primary)]">
                    Время замера
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                      }
                      setTempTime(timeInput);
                      setTimePickerOpen(true);
                    }}
                    className="flex items-center gap-2 bg-[var(--surface-tertiary)] rounded-[20px] pl-4 pr-3 py-2.5 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-[22px] font-extrabold text-[var(--text-primary)] leading-none tabular-nums">
                      {timeInput}
                    </span>
                    <ChevronDown className="w-5 h-5 text-[var(--text-Subtle)] shrink-0 stroke-[2.5]" />
                  </button>
                </div>

                {userTags.length > 0 && (
                  <div className="flex flex-nowrap overflow-x-auto gap-2 hide-scrollbar pb-1 -mx-6 px-6">
                    {userTags.map((tag) => {
                      const active = noteInput === tag;
                      return (
                        <div
                          key={tag}
                          onClick={() => setNoteInput(active ? '' : tag)}
                          className={`shrink-0 pl-5 pr-2.5 py-3 rounded-full text-[16px] font-bold flex items-center gap-2 transition cursor-pointer ${
                            active
                              ? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-text)]'
                              : 'bg-[var(--tag-bg)] text-[var(--tag-text)]'
                          }`}
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveTag(tag, e)}
                            title="Удалить подсказку"
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                              active
                                ? 'text-[var(--tab-active-text)] hover:opacity-70'
                                : 'text-[var(--tag-x)] hover:text-white'
                            }`}
                          >
                            <X className="w-4 h-4" strokeWidth={3} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-[var(--surface-input)] rounded-[24px] px-5 py-[18px]">
                  <input
                    ref={noteRef}
                    type="text"
                    name="nofill_bp_custom_memo"
                    enterKeyHint="done"
                    readOnly={!inputsUnlocked}
                    onFocus={() => {
                      setInputsUnlocked(true);
                      scrollTargetIntoSheetView(saveCtaRef);
                    }}
                    onKeyDown={handleInputEnterBlur}
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    aria-autocomplete="none"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={
                      userTags.length < 4
                        ? 'Комментарий (сохранится в подсказки)'
                        : 'Комментарий (напр. сахар 5.4)'
                    }
                    className="w-full text-[16px] font-bold text-[var(--text-primary)] placeholder-[var(--placeholder-color)] focus:outline-none bg-transparent select-text"
                  />
                </div>

                <button
                  ref={saveCtaRef}
                  type="button"
                  onClick={handleSaveRecord}
                  className="w-full py-[20px] rounded-[28px] bg-[var(--cta-bg)] text-[var(--cta-text)] text-[20px] font-bold active:scale-[0.99] transition cursor-pointer mt-1"
                >
                  Сохранить замер
                </button>
              </div>
            </form>
          </div>
        )}

        {/* МОДАЛЬНЫЙ ЭКРАН СКАНИРОВАНИЯ ТОНОМЕТРА */}
        {activeSheet === 'add' && scannerOpen && (
          <TonometerScannerModal
            currentUser={currentUser}
            onClose={() => setScannerOpen(false)}
            onDetected={handleScannerDetected}
          />
        )}

        {/* ШТОРКА КАСТОМНОГО ВЫБОРА ВРЕМЕНИ */}
        {timePickerOpen && (
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none touch-none"
            onClick={() => setTimePickerOpen(false)}
          >
            <div
              className="w-full max-w-[440px] bg-[var(--bg-sheet)] rounded-t-[36px] px-6 pt-6 pb-8 flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-[var(--sheet-handle)] rounded-full mx-auto shrink-0" />

              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="text-[32px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
                    Время замера
                  </h3>
                  <div className="text-[15px] font-medium text-[var(--text-secondary)]">
                    Выберите время измерения
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTimePickerOpen(false)}
                  className="w-10 h-10 rounded-full bg-[var(--surface-input)] flex items-center justify-center text-[var(--text-primary)] shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              <div className="relative flex items-center justify-center w-full h-[340px] gap-4 mt-1">
                <DrumPicker
                  options={HOURS_OPTIONS}
                  value={tempTime.split(':')[0]}
                  onChange={(h) => setTempTime(`${h}:${tempTime.split(':')[1]}`)}
                />

                <div
                  className="z-10 text-[38px] font-extrabold leading-none pb-1.5 shrink-0 w-[20px] text-center select-none"
                  style={{ color: 'var(--drum-colon)' }}
                >
                  :
                </div>

                <DrumPicker
                  options={MINUTES_OPTIONS}
                  value={tempTime.split(':')[1]}
                  onChange={(m) => setTempTime(`${tempTime.split(':')[0]}:${m}`)}
                />
              </div>

              <div className="w-full flex flex-col gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTimeInput(tempTime);
                    setTimePickerOpen(false);
                  }}
                  className="w-full py-[18px] rounded-[28px] bg-[var(--cta-bg)] text-[var(--cta-text)] text-[20px] font-bold active:scale-[0.99] transition cursor-pointer"
                >
                  Подтвердить время
                </button>
                <button
                  type="button"
                  onClick={() => setTimePickerOpen(false)}
                  className="w-full py-[18px] rounded-[28px] bg-[var(--surface-secondary)] text-[var(--text-primary)] text-[20px] font-bold active:scale-[0.99] transition cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ШТОРКА НАСТРОЕК */}
        {activeSheet === 'data' && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none"
            style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px' }}
            onClick={() => setActiveSheet(null)}
          >
            <div
              ref={dataSheetRef}
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              style={{
                transform: `translateY(${dragOffset}px)`,
                transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none',
                maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight + 8}px)` : '90vh'
              }}
              className="w-full max-w-[440px] overflow-y-auto hide-scrollbar bg-[var(--bg-sheet)] rounded-t-[36px] p-6 pb-8 flex flex-col gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-[var(--sheet-handle)] rounded-full mx-auto shrink-0" />

              {keyboardHeight === 0 && (
                <div className="flex items-start justify-between pb-2">
                  <div className="flex flex-col gap-[6px]">
                    <h3 className="text-[36px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
                      Настройки
                    </h3>
                    <div className="text-[18px] font-normal text-[var(--text-Subtle)] leading-tight pr-4">
                      {currentUser
                        ? `Профиль · @${currentUser.username}`
                        : 'Демо-режим · без облака'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-[var(--surface-input)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
              )}

              {keyboardHeight === 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[var(--surface-card)] rounded-[26px] p-4 flex flex-col justify-center">
                    <div className="text-[12px] font-semibold text-[var(--text-muted)] mb-1">
                      Записей
                    </div>
                    <div className="text-[20px] font-bold text-[var(--text-primary)] leading-none">
                      {currentUser ? rawCloudCount : records.length}
                    </div>
                  </div>
                  <div className="bg-[var(--surface-card)] rounded-[26px] p-4 flex flex-col justify-center">
                    <div className="text-[12px] font-semibold text-[var(--text-muted)] mb-1">
                      Замеров
                    </div>
                    <div className="text-[20px] font-bold text-[var(--text-primary)] leading-none">
                      {records.length}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-[var(--surface-card)] rounded-[26px] p-4 flex flex-col gap-3">
                <div className="text-[20px] font-bold text-[var(--text-primary)] leading-tight">
                  Импорт измерений
                </div>
                <textarea
                  rows={3}
                  name="nofill_bp_raw_import"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  value={importText}
                  onFocus={() => scrollTargetIntoSheetView(importCtaRef)}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="[20.10.2026 08:40] 120/80 64"
                  className="w-full bg-[var(--surface-tertiary)] rounded-[18px] p-3 text-[12px] font-medium text-[var(--text-primary)] focus:outline-none select-text resize-none placeholder-[var(--text-faint)]"
                />
                <button
                  ref={importCtaRef}
                  type="button"
                  onClick={handleImportSubmit}
                  className="w-full h-[50px] rounded-full border border-[var(--import-btn-border)] bg-[var(--import-btn-bg)] text-[var(--import-btn-text)] font-bold text-[15px] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition"
                  style={{ borderColor: 'var(--import-btn-border)' }}
                >
                  <Upload className="w-4 h-4" strokeWidth={2} />
                  {currentUser ? 'Добавить в облако' : 'Добавить в демо-сессию'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="bg-[var(--surface-card)] rounded-[24px] py-3 px-4 font-bold text-[15px] text-[var(--text-primary)] flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition"
                >
                  <Download className="w-5 h-5" strokeWidth={2} />
                  <span>Скачать CSV</span>
                </button>

                <div
                  role="group"
                  aria-label="Выбор темы оформления"
                  className="bg-[var(--surface-secondary)] rounded-[24px] p-1.5 grid grid-cols-2 gap-1"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('dark')}
                    className={`rounded-[19px] py-1.5 px-1 font-bold text-[12px] leading-tight flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                      theme === 'dark'
                        ? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-text)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Moon className="w-4 h-4" strokeWidth={2.2} />
                    <span>Тёмная</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme('light')}
                    className={`rounded-[19px] py-1.5 px-1 font-bold text-[12px] leading-tight flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                      theme === 'light'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Sun className="w-4 h-4" strokeWidth={2.2} />
                    <span>Светлая</span>
                  </button>
                </div>
              </div>

              <div>
                {currentUser ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-3.5 rounded-[22px] bg-[var(--cta-logout-bg)] text-[var(--cta-logout-text)] text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2} />
                    Выйти из профиля
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setLoginPin('');
                      setActiveSheet('auth');
                    }}
                    className="w-full py-3.5 rounded-[22px] bg-[var(--cta-bg)] text-[var(--cta-text)] text-[15px] font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] transition"
                  >
                    <User className="w-4 h-4" strokeWidth={2} />
                    Войти или создать профиль
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}