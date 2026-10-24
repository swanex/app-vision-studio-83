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
  LogOut
} from 'lucide-react';

const SUPABASE_URL = 'https://qgmnldmmhdtqbptbdmjm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbW5sZG1taGR0cWJwdGJkbWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyODg5MDcsImV4cCI6MjEwNzg2NDkwN30.uEofng_-EPocDFkxHId5b-nMoLaD2RjKqBo_uh6TUYs';

const SESSION_STORAGE_KEY = 'bp_multiuser_session_v1';
const LEGACY_AVATAR_KEY = 'roma_bp_custom_avatar_v1';

const DEFAULT_TAGS_ROMA = [
  'После кофе',
  'После силовой',
  'После кардио',
  'Вечером после прогулки'
];
const DEFAULT_TAGS_NEW_USER = ['После пробуждения', 'До сна'];

const SYS_COLOR = '#689F38';
const DIA_COLOR = '#5BA4B6';

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
  if (!sys || !dia) return { text: 'Нет данных', bg: '#EFEFEF', textCol: '#6E7671' };
  if (sys < 110 || dia < 65) return { text: 'Низкое', bg: '#CDE9F2', textCol: '#141A16' };
  if (sys < 130 && dia < 85) return { text: 'В норме', bg: '#D6EBB4', textCol: '#141A16' };
  if (sys < 140 && dia < 90) return { text: 'Повышенное', bg: '#EFEFEF', textCol: '#141A16' };
  return { text: 'Высокое', bg: '#141A16', textCol: '#FFFFFF' };
};

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
    [117, 76, 60, '08:15', 'После пробуждения', 2],
    [124, 82, 68, '19:45', 'До сна', 0],
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

const HomeNavIcon = ({ solid }) => solid ? (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25.3926 27.6992H18.6084C18.1254 27.6992 17.7334 27.3072 17.7334 26.8242C17.7334 26.3412 18.1254 25.9492 18.6084 25.9492H25.3926C25.8756 25.9492 26.2676 26.3412 26.2676 26.8242C26.2676 27.3072 25.8756 27.6992 25.3926 27.6992ZM30.4571 15.1843C30.0336 14.811 29.5517 14.3887 28.9777 13.8578C28.7176 13.6478 28.4329 13.4075 28.1307 13.1532C26.4274 11.717 24.0941 9.75 21.9672 9.75C19.8649 9.75 17.6821 11.6073 15.9286 13.0995C15.6042 13.3748 15.3009 13.6338 14.9917 13.8847C14.4481 14.3887 13.9662 14.8122 13.5416 15.1867C10.7567 17.6378 10.2329 18.2807 10.2329 23.9985C10.2329 34.25 13.1974 34.25 21.9999 34.25C30.8012 34.25 33.7669 34.25 33.7669 23.9985C33.7669 18.2795 33.2431 17.6367 30.4571 15.1843Z" fillRule="evenodd" clipRule="evenodd" fill="#141A16"/>
  </svg>
) : (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25.3759 25.8243C25.9281 25.8243 26.3757 26.2722 26.3759 26.8243C26.3759 27.3766 25.9282 27.8243 25.3759 27.8243H18.5917C18.0394 27.8243 17.5917 27.3766 17.5917 26.8243C17.5919 26.2722 18.0395 25.8243 18.5917 25.8243H25.3759Z" fill="#858D88"/>
    <path d="M32.167 23.9984C32.167 20.6758 31.9686 19.4177 31.46 18.5297C31.2064 18.087 30.8453 17.6864 30.2588 17.1449C29.965 16.8737 29.6322 16.583 29.2383 16.2357C28.8519 15.8952 28.4162 15.5088 27.9307 15.059C27.0208 14.3232 26.0275 13.4161 24.9082 12.6254C23.7616 11.8154 22.7486 11.3335 21.9512 11.3334C21.1569 11.3334 20.1579 11.8151 19.0264 12.6263C17.913 13.4246 16.9519 14.3171 16.0371 15.057C15.5513 15.5072 15.1161 15.895 14.7295 16.2357C14.3355 16.5829 14.0028 16.8737 13.709 17.1449C13.1224 17.6863 12.7615 18.087 12.5078 18.5297C11.9989 19.4177 11.7998 20.6757 11.7998 23.9984C11.7998 26.3944 11.9434 28.1036 12.2637 29.3363C12.5772 30.5427 13.0392 31.2162 13.6377 31.6459C14.2681 32.0984 15.1805 32.3761 16.585 32.5209C17.9878 32.6654 19.7401 32.6664 21.9834 32.6664C24.2267 32.6664 25.979 32.6654 27.3818 32.5209C28.7863 32.3761 29.6986 32.0984 30.3291 31.6459C30.9276 31.2162 31.3896 30.5428 31.7031 29.3363C32.0234 28.1036 32.167 26.3945 32.167 23.9984ZM34.167 23.9984C34.167 26.4363 34.0249 28.3528 33.6387 29.8392C33.2456 31.3519 32.5802 32.492 31.4951 33.2709C30.442 34.0267 29.1134 34.3528 27.5869 34.5101C26.0588 34.6676 24.1888 34.6664 21.9834 34.6664C19.778 34.6664 17.908 34.6676 16.3799 34.5101C14.8533 34.3528 13.5249 34.0268 12.4717 33.2709C11.3866 32.492 10.7212 31.3519 10.3281 29.8392C9.94189 28.3528 9.7998 26.4363 9.7998 23.9984C9.79981 20.7519 9.9593 18.9546 10.7725 17.5355C11.1798 16.8248 11.7205 16.2586 12.3525 15.6752C12.668 15.3839 13.0241 15.0724 13.4072 14.7347C13.7941 14.3937 14.2199 14.0166 14.6924 13.5785L14.7451 13.5326C15.5053 12.9206 16.69 11.8401 17.8613 11.0004C19.0307 10.162 20.4786 9.33337 21.9512 9.33337C23.4191 9.33351 24.8777 10.1553 26.0615 10.9916C26.9579 11.6248 27.8485 12.3834 28.5674 12.9886L29.2236 13.5326L29.2764 13.5785C29.7487 14.0165 30.1738 14.3938 30.5605 14.7347C30.9436 15.0724 31.2998 15.3839 31.6152 15.6752C32.2472 16.2587 32.7882 16.8247 33.1953 17.5355C34.0081 18.9545 34.167 20.7519 34.167 23.9984Z" fill="#858D88"/>
  </svg>
);

const HistoryNavIcon = ({ solid }) => solid ? (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26.194 22.8021H17.7706C17.2876 22.8021 16.8956 22.4101 16.8956 21.9271C16.8956 21.4441 17.2876 21.0521 17.7706 21.0521H26.194C26.677 21.0521 27.069 21.4441 27.069 21.9271C27.069 22.4101 26.677 22.8021 26.194 22.8021ZM26.194 27.1876H17.7706C17.2876 27.1876 16.8956 26.7956 16.8956 26.3126C16.8956 25.8296 17.2876 25.4376 17.7706 25.4376H26.194C26.677 25.4376 27.069 25.8296 27.069 26.3126C27.069 26.7956 26.677 27.1876 26.194 27.1876ZM17.7706 16.6642H20.9848C21.4678 16.6642 21.8598 17.0562 21.8598 17.5392C21.8598 18.0222 21.4678 18.4142 20.9848 18.4142H17.7706C17.2876 18.4142 16.8956 18.0222 16.8956 17.5392C16.8956 17.0562 17.2876 16.6642 17.7706 16.6642ZM21.9998 10.6244C14.3406 10.6244 11.627 13.6017 11.627 22.0006C11.627 30.3982 14.3406 33.3756 21.9998 33.3756C29.6578 33.3756 32.3726 30.3982 32.3726 22.0006C32.3726 13.6017 29.6578 10.6244 21.9998 10.6244Z" fillRule="evenodd" clipRule="evenodd" fill="#141A16"/>
  </svg>
) : (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26.1943 25.3122C26.7464 25.3122 27.1941 25.7601 27.1943 26.3122C27.1943 26.8645 26.7465 27.3122 26.1943 27.3122H17.7714C17.2191 27.3122 16.7714 26.8645 16.7714 26.3122C16.7716 25.7601 17.2192 25.3122 17.7714 25.3122H26.1943Z" fill="#858D88"/>
    <path d="M26.1943 20.9258C26.7464 20.9258 27.1941 21.3737 27.1943 21.9258C27.1943 22.4781 26.7465 22.9258 26.1943 22.9258H17.7714C17.2191 22.9258 16.7714 22.4781 16.7714 21.9258C16.7716 21.3737 17.2192 20.9258 17.7714 20.9258H26.1943Z" fill="#858D88"/>
    <path d="M20.9858 16.54C21.538 16.54 21.9857 16.9878 21.9858 17.54C21.9858 18.0923 21.5381 18.54 20.9858 18.54H17.772C17.2197 18.54 16.772 18.0923 16.772 17.54C16.7721 16.9878 17.2198 16.54 17.772 16.54H20.9858Z" fill="#858D88"/>
    <path d="M30.7905 22.0005C30.7905 17.9939 30.1703 15.6329 28.9087 14.2417C27.6736 12.88 25.5973 12.2085 22.0005 12.2085C18.4046 12.2086 16.3284 12.88 15.0933 14.2417C13.8316 15.6329 13.2114 17.9941 13.2114 22.0005C13.2115 26.007 13.8314 28.3682 15.0933 29.7593C16.3284 31.1209 18.4046 31.7915 22.0005 31.7915C25.5973 31.7915 27.6736 31.1209 28.9087 29.7593C30.1704 28.3682 30.7905 26.0072 30.7905 22.0005ZM32.7905 22.0005C32.7905 26.0866 32.1873 29.1217 30.3901 31.103C28.5662 33.1139 25.7466 33.7915 22.0005 33.7915C18.2553 33.7915 15.4368 33.1135 13.6128 31.103C11.8155 29.1217 11.2115 26.0867 11.2114 22.0005C11.2114 17.9141 11.8154 14.8794 13.6128 12.8979C15.4368 10.8872 18.2551 10.2085 22.0005 10.2085C25.7467 10.2085 28.5662 10.8871 30.3901 12.8979C32.1872 14.8794 32.7905 17.9144 32.7905 22.0005Z" fill="#858D88"/>
  </svg>
);

const deduplicateRecords = (arr) => {
  const seen = new Map();
  arr.forEach((item) => {
    const signature = `${item.date}_${item.time}_${item.sys}_${item.dia}`;
    if (!seen.has(signature)) {
      seen.set(signature, item);
    }
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
          id: `r-${username}-${isoDate}-${time.replace(':', '')}-${idx}`,
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

// Генерация опций для часов и минут
const HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Компонент барабана для выбора времени
const DrumPicker = ({ options, value, onChange }) => {
  const ITEM_HEIGHT = 72; // Высота одного элемента (для пальцев пожилых)
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(options.indexOf(value));

  // Устанавливаем изначальную позицию скролла
  useEffect(() => {
    if (scrollRef.current) {
      const idx = options.indexOf(value);
      if (idx !== -1) {
        scrollRef.current.scrollTop = idx * ITEM_HEIGHT;
      }
    }
  }, []);

  const handleScroll = (e) => {
    const top = e.target.scrollTop;
    const index = Math.min(options.length - 1, Math.max(0, Math.round(top / ITEM_HEIGHT)));
    if (index !== activeIndex) {
      setActiveIndex(index);
      onChange(options[index]);
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="w-[145px] h-[360px] overflow-y-auto snap-y snap-mandatory relative z-10 hide-scrollbar"
    >
      <div style={{ height: ITEM_HEIGHT * 2 }} />
      {options.map((opt, i) => (
        <div
          key={opt}
          className="snap-center flex items-center justify-center transition-all duration-200"
          style={{
            height: ITEM_HEIGHT,
            fontSize: i === activeIndex ? '44px' : '32px',
            fontWeight: i === activeIndex ? '800' : '600',
            color: i === activeIndex ? '#141A16' : '#A3ABA6',
          }}
        >
          {opt}
        </div>
      ))}
      <div style={{ height: ITEM_HEIGHT * 2 }} />
    </div>
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

  // Состояние для кастомного пикера времени
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [tempTime, setTempTime] = useState('09:00');

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
  const avatarInputRef = useRef(null);

  const [importText, setImportText] = useState('');

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

      const loggedUser = {
        username: dbUser.username,
        pin: cleanPin,
        display_name: dbUser.display_name || cleanLogin,
        avatar: dbUser.avatar || legacyAvatar || null,
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

      const newUser = {
        ...payload,
        avatar: null
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
    setCurrentUser(null);
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
  }, [activeSheet]);

  const handleSheetTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleSheetTouchMove = (e) => {
    if (touchStartYRef.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleSheetTouchEnd = () => {
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
    if (val.length === 2 && parseInt(val, 10) >= 45) {
      if (pulseRef.current) pulseRef.current.focus();
    }
  };

  const handlePulseChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setPulseInput(val);
  };

  const handleSaveRecord = async () => {
    const s = parseInt(sysInput, 10);
    const d = parseInt(diaInput, 10);
    const p = pulseInput ? parseInt(pulseInput, 10) : null;

    if (!s || !d || s < 70 || d < 40) return;

    const cleanNote = noteInput.trim();
    const activeUsername = currentUser ? currentUser.username : 'demo';
    const recordIdPrefix = activeUsername === 'swanex' ? 'r' : `r-${activeUsername}`;

    const newItem = {
      id: `${recordIdPrefix}-${dateInput}-${timeInput.replace(':', '')}-${Date.now()}`,
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
      className="min-h-screen bg-[#E4E7E4] text-[#141A16] flex justify-center font-sans select-none"
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      <style>{`
        /* Скрываем скроллбар для барабана */
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
      `}</style>

      <div className="w-full max-w-[440px] min-h-screen bg-[#F2F3F0] pb-28 px-5 relative flex flex-col">
        
        <div
          className={
            activeTab === 'history'
              ? 'sticky top-0 z-20 bg-[#F2F3F0] pt-6 pb-2.5'
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
                    className="w-[50px] h-[50px] rounded-full overflow-hidden bg-[#141A16] shrink-0 relative group cursor-pointer flex items-center justify-center text-white"
                  >
                    {resolvedAvatar ? (
                      <img
                        src={resolvedAvatar}
                        alt={currentUser.display_name}
                        draggable={false}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" strokeWidth={2} />
                    )}
                    <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                      <Camera className="w-4 h-4" />
                    </span>
                  </button>

                  <div className="min-w-0">
                    <div className="text-[13px] text-[#6E7671] font-medium leading-tight whitespace-nowrap">
                      {greetingText}
                    </div>
                    <div className="text-[17px] font-extrabold tracking-tight text-[#141A16] leading-snug truncate">
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
                  <div className="w-[50px] h-[50px] rounded-full bg-[#141A16] shrink-0 flex items-center justify-center text-white">
                    <User className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] text-[#6E7671] font-medium leading-tight whitespace-nowrap">
                      Демо-режим
                    </div>
                    <div className="text-[17px] font-extrabold tracking-tight text-[#141A16] leading-snug whitespace-nowrap inline-flex items-center gap-1">
                      <span>Войти</span>
                      <ChevronRight className="w-4 h-4 text-[#141A16] shrink-0 stroke-[2.6]" />
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
                className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-95 transition cursor-pointer text-[#141A16]"
                aria-label="Статус облачной синхронизации"
              >
                {cloudStatus === 'syncing' ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-[#141A16]" />
                ) : (
                  <CloudCheckIcon className="w-5 h-5 text-[#141A16]" />
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('history');
                  setSearchOpen((prev) => !prev);
                }}
                className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#141A16] active:scale-95 transition cursor-pointer"
                aria-label="Поиск"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveSheet('data')}
                className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#141A16] active:scale-95 transition cursor-pointer"
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
                    inputMode="search"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Найти: кофе, трени, сахар, утро..."
                    className="w-full bg-white rounded-[22px] px-5 py-3.5 text-base text-[#141A16] placeholder-[#858D88] focus:outline-none select-text"
                  />
                </div>
              )}

              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-[#7A827D]">
                  Уникальных замеров: {historyList.length}
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-[#141A16] underline cursor-pointer"
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
            <div className="bg-white rounded-[30px] p-1.5 grid grid-cols-3">
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
                      ? 'bg-[#141A16] text-white'
                      : 'text-[#6E7671] hover:text-[#141A16]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <section className="bg-white rounded-[32px] p-5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[56px] font-black tracking-tighter leading-none text-[#141A16]">
                  {stats.avgSys ? `${stats.avgSys}/${stats.avgDia}` : '–/–'}
                </span>
                <span
                  className="px-3.5 py-1.5 rounded-full text-[14px] font-semibold shrink-0"
                  style={{ backgroundColor: avgBadge.bg, color: avgBadge.textCol }}
                >
                  {avgBadge.text}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-[16px] font-bold text-[#141A16]">Среднее за период</div>
                <div className="text-[14px] font-medium text-[#7A827D] mt-0.5">{periodRangeLabel}</div>
              </div>

              <div className="h-[150px] w-full -mx-2 relative">
                {chartData.length > 0 && (
                  <>
                    <div
                      className="absolute right-[2px] top-[12px] text-[11px] font-bold pointer-events-none z-10"
                      style={{ color: SYS_COLOR }}
                    >
                      Верхнее
                    </div>
                    <div
                      className="absolute right-[2px] top-[100px] text-[11px] font-bold pointer-events-none z-10"
                      style={{ color: DIA_COLOR }}
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
                          <stop offset="5%" stopColor="#D6EBB4" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#D6EBB4" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="diaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#CDE9F2" stopOpacity={0.75} />
                          <stop offset="95%" stopColor="#CDE9F2" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ECEEED" />
                      <XAxis
                        dataKey="shortLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 13, fill: '#7A827D' }}
                        minTickGap={34}
                      />
                      <YAxis
                        domain={[60, 148]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 13, fill: '#7A827D' }}
                        ticks={[75, 100, 125]}
                      />
                      <Tooltip
                        wrapperStyle={{ zIndex: 100 }}
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const item = payload[0].payload;
                          return (
                            <div className="bg-[#141A16] text-white rounded-[20px] px-4 py-3">
                              <div className="text-xs text-[#A3ABA6] mb-0.5">
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
                                <div className="text-xs text-[#E2E6E3] mt-1 max-w-[200px] leading-snug">
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
                        stroke={SYS_COLOR}
                        strokeWidth={2.4}
                        fill="url(#sysFill)"
                        activeDot={{ r: 5, fill: SYS_COLOR, stroke: '#FFFFFF', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="dia"
                        stroke={DIA_COLOR}
                        strokeWidth={2.4}
                        fill="url(#diaFill)"
                        activeDot={{ r: 5, fill: DIA_COLOR, stroke: '#FFFFFF', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-center px-6 text-sm text-[#8F9691]">
                    Нажмите «+» внизу экрана, чтобы добавить первый замер
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2.5">
                <button
                  onClick={() => setDayTimeFilter('all')}
                  className={`flex-1 py-3 rounded-full text-[15px] font-bold transition cursor-pointer text-center ${
                    dayTimeFilter === 'all'
                      ? 'bg-[#141A16] text-white'
                      : 'bg-[#F4F5F2] text-[#141A16] hover:bg-[#E4E7E4]'
                  }`}
                >
                  Все
                </button>

                <button
                  onClick={() => setDayTimeFilter('morning')}
                  className={`flex-1 py-3 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    dayTimeFilter === 'morning'
                      ? 'bg-[#141A16] text-white'
                      : 'bg-[#F4F5F2] text-[#5A625D] hover:bg-[#E4E7E4]'
                  }`}
                >
                  <Sun className="w-[18px] h-[18px] text-[#FE9A00] fill-[#FE9A00]" />
                  <span>Утро</span>
                </button>

                <button
                  onClick={() => setDayTimeFilter('evening')}
                  className={`flex-1 py-3 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    dayTimeFilter === 'evening'
                      ? 'bg-[#141A16] text-white'
                      : 'bg-[#EEF1FA] text-[#3B4990] hover:opacity-90'
                  }`}
                >
                  <Moon className="w-[18px] h-[18px] text-[#615FFF] fill-[#615FFF]" />
                  <span>Вечер</span>
                </button>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3.5 pt-1">
              <div className="rounded-[28px] bg-[#DEE2EA] p-5 flex flex-col justify-between h-[152px]">
                <div>
                  <div className="text-[36px] font-black tracking-tight leading-none text-[#141A16]">
                    {latestRec ? `${latestRec.sys}/${latestRec.dia}` : '–'}
                  </div>
                  <div className="text-[14px] font-bold text-[#3B4990] mt-1.5">
                    {latestRec ? formatHumanDate(latestRec.date) : '–'}
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-[14px] font-bold leading-tight text-[#141A16]">
                    Последний
                    <br />
                    замер
                  </div>
                  <div className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center text-[#141A16] shrink-0">
                    <Activity className="w-[22px] h-[22px]" strokeWidth={2.2} />
                  </div>
                </div>
              </div>

              <div className="bg-[#E4E4E4] rounded-[28px] p-5 flex flex-col justify-between h-[152px]">
                <div>
                  <div className="text-[36px] font-black tracking-tight leading-none text-[#141A16]">
                    {stats.avgPulse}
                  </div>
                  <div className="text-[14px] text-[#5A625D] font-bold mt-1.5">
                    уд/мин
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-[14px] font-bold leading-tight text-[#141A16]">
                    Средний
                    <br />
                    пульс
                  </div>
                  <div className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center text-[#141A16] shrink-0">
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
                  className="bg-white rounded-[26px] px-5 py-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[24px] font-black tracking-tight text-[#141A16]">
                        {item.sys}/{item.dia}
                      </span>
                      {item.pulse && (
                        <span className="text-[16px] font-bold text-[#5BA4B6]">
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
                    <div className="text-[15px] font-medium text-[#5A625D] mt-1.5 truncate">
                      {item.note || 'Замер'}
                    </div>
                    <div className="text-[13px] font-medium text-[#8F9691] mt-0.5">
                      {formatHumanDate(item.date)} в {item.time}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#B0B7B2] hover:text-[#141A16] active:scale-95 transition cursor-pointer shrink-0"
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
          <div className="w-full max-w-[400px] h-[68px] bg-white rounded-[34px] px-12 flex items-center justify-between pointer-events-auto border border-black/5">
            <button
              onClick={() => setActiveTab('home')}
              className="active:scale-95 transition cursor-pointer flex items-center justify-center"
              aria-label="Главная"
            >
              <HomeNavIcon solid={activeTab === 'home'} />
            </button>

            <button
              onClick={() => setActiveSheet('add')}
              className="w-[64px] h-[64px] -mt-6 rounded-full bg-[#141A16] text-white flex items-center justify-center active:scale-95 transition cursor-pointer"
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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none touch-none"
            onClick={() => setActiveSheet(null)}
          >
            <div
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              style={{
                transform: `translateY(${dragOffset}px)`,
                transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none'
              }}
              className="w-full max-w-[440px] bg-[#EFEFEF] rounded-t-[36px] px-6 pt-6 pb-8 flex flex-col items-center gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-[#C8CFCB] rounded-full shrink-0" />

              <div className="self-stretch pt-1 flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 flex flex-col items-start gap-3">
                  <h3 className="text-[38px] font-extrabold text-[#141A16] leading-none tracking-tight">
                    Профиль
                  </h3>
                  <p className="text-[15px] font-medium text-[#6E7671] leading-tight">
                    {authMode === 'login'
                      ? 'Войдите, чтобы продолжить вести ваши измерения'
                      : 'Создайте аккаунт, чтобы начать сохранять ваши измерения'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141A16] shrink-0 cursor-pointer mt-1"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              <div className="self-stretch p-1.5 bg-[#E4E4E4] rounded-full grid grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className={`py-3 rounded-full text-[16px] font-bold transition cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-[#141A16] text-white'
                      : 'text-[#141A16] hover:bg-black/5'
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
                      ? 'bg-[#141A16] text-white'
                      : 'text-[#141A16] hover:bg-black/5'
                  }`}
                >
                  Создать
                </button>
              </div>

              {authMode === 'login' ? (
                <div className="self-stretch flex flex-col items-start gap-4">
                  <div className="self-stretch flex flex-col items-start gap-3">
                    <label className="self-stretch h-[64px] px-5 py-3 bg-white rounded-[22px] flex items-center gap-0.5 cursor-text">
                      <span className="w-[85px] text-[16px] font-bold text-[#181C24] text-left select-none shrink-0">
                        Логин
                      </span>
                      <input
                        type="text"
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        placeholder="Латиницей"
                        value={loginUsername}
                        onChange={(e) => {
                          setLoginUsername(
                            e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
                          );
                          setAuthError('');
                        }}
                        className="flex-1 min-w-0 w-full text-left text-[18px] font-bold text-[#141A16] placeholder-[#C8CFCB] focus:outline-none bg-transparent select-text"
                      />
                    </label>

                    <label className="self-stretch h-[64px] px-5 py-3 bg-white rounded-[22px] flex items-center gap-0.5 cursor-text">
                      <span className="w-[85px] text-[16px] font-bold text-[#181C24] text-left select-none shrink-0">
                        ПИН-код
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="••••"
                        value={loginPin}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setLoginPin(clean);
                          setAuthError('');
                          if (clean.length === 4 && loginUsername.trim()) {
                            handleLoginSubmit(clean);
                          }
                        }}
                        className="flex-1 min-w-0 w-full text-left text-[30px] leading-none tracking-[10px] font-extrabold text-[#141A16] placeholder-[#C8CFCB] focus:outline-none bg-transparent select-text"
                      />
                    </label>
                  </div>

                  {authError && (
                    <p className="self-stretch text-center text-[14px] font-bold text-red-600 -mt-1">
                      {authError}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() => handleLoginSubmit()}
                    className="self-stretch py-[18px] rounded-full bg-[#141A16] text-white text-[20px] font-bold flex items-center justify-center active:scale-[0.99] transition cursor-pointer mt-1"
                  >
                    {authLoading ? 'Проверяем...' : 'Войти в дневник'}
                  </button>
                </div>
              ) : (
                <div className="self-stretch flex flex-col items-start gap-4">
                  <div className="self-stretch flex flex-col items-start gap-3">
                    <label className="self-stretch h-[64px] px-5 py-3 bg-white rounded-[22px] flex items-center gap-0.5 cursor-text">
                      <span className="w-[85px] text-[16px] font-bold text-[#181C24] text-left select-none shrink-0">
                        Ваше имя
                      </span>
                      <input
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Например Нина"
                        value={regDisplayName}
                        onChange={(e) => {
                          setRegDisplayName(e.target.value);
                          setAuthError('');
                        }}
                        className="flex-1 min-w-0 w-full text-left text-[18px] font-bold text-[#141A16] placeholder-[#C8CFCB] focus:outline-none bg-transparent select-text"
                      />
                    </label>

                    <label className="self-stretch h-[64px] px-5 py-3 bg-white rounded-[22px] flex items-center gap-0.5 cursor-text">
                      <span className="w-[85px] text-[16px] font-bold text-[#181C24] text-left select-none shrink-0">
                        Логин
                      </span>
                      <input
                        type="text"
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        placeholder="Латиницей"
                        value={regUsername}
                        onChange={(e) => {
                          setRegUsername(
                            e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
                          );
                          setAuthError('');
                        }}
                        className="flex-1 min-w-0 w-full text-left text-[18px] font-bold text-[#141A16] placeholder-[#C8CFCB] focus:outline-none bg-transparent select-text"
                      />
                    </label>

                    <label className="self-stretch h-[64px] px-5 py-3 bg-white rounded-[22px] flex items-center gap-0.5 cursor-text">
                      <span className="w-[85px] text-[16px] font-bold text-[#181C24] text-left select-none shrink-0">
                        ПИН-код
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="••••"
                        value={regPin}
                        onChange={(e) => {
                          setRegPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                          setAuthError('');
                        }}
                        className="flex-1 min-w-0 w-full text-left text-[30px] leading-none tracking-[10px] font-extrabold text-[#141A16] placeholder-[#C8CFCB] focus:outline-none bg-transparent select-text"
                      />
                    </label>
                  </div>

                  {authError && (
                    <p className="self-stretch text-center text-[14px] font-bold text-red-600 -mt-1">
                      {authError}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={handleRegisterSubmit}
                    className="self-stretch py-[18px] rounded-full bg-[#141A16] text-white text-[20px] font-bold flex items-center justify-center active:scale-[0.99] transition cursor-pointer mt-1"
                  >
                    {authLoading ? 'Создаем...' : 'Создать дневник'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ШТОРКА ВВОДА НОВОГО ЗАМЕРА */}
        {activeSheet === 'add' && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none touch-none"
            onClick={() => setActiveSheet(null)}
          >
            <div
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              style={{
                transform: `translateY(${dragOffset}px)`,
                transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none'
              }}
              className="w-full max-w-[440px] bg-[#EFEFEF] rounded-t-[36px] px-6 pt-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-[#C8CFCB] rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[38px] font-extrabold text-[#141A16] leading-none tracking-tight">
                  Новый замер
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141A16] cursor-pointer shrink-0 mt-1"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              <div role="presentation" className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#D8EEB9] rounded-[26px] h-[110px] flex flex-col justify-center items-center p-2 relative overflow-hidden">
                    <span className="block text-[15px] font-bold text-[#4A5D2F] mb-1">
                      Верхнее
                    </span>
                    <input
                      ref={sysRef}
                      type="text"
                      inputMode="numeric"
                      readOnly={!inputsUnlocked}
                      onFocus={() => setInputsUnlocked(true)}
                      autoComplete="off"
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
                      className="w-full text-center text-[40px] tracking-tight leading-none font-extrabold text-[#4A5D2F] placeholder-[#A5C282] opacity-80 focus:opacity-100 focus:outline-none bg-transparent select-text"
                    />
                  </div>

                  <div className="bg-[#D4ECF4] rounded-[26px] h-[110px] flex flex-col justify-center items-center p-2 relative overflow-hidden">
                    <span className="block text-[15px] font-bold text-[#395C66] mb-1">
                      Нижнее
                    </span>
                    <input
                      ref={diaRef}
                      type="text"
                      inputMode="numeric"
                      readOnly={!inputsUnlocked}
                      onFocus={() => setInputsUnlocked(true)}
                      autoComplete="off"
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
                      className="w-full text-center text-[40px] tracking-tight leading-none font-extrabold text-[#395C66] placeholder-[#A0C9D6] opacity-80 focus:opacity-100 focus:outline-none bg-transparent select-text"
                    />
                  </div>

                  <div className="bg-[#E4E4E4] rounded-[26px] h-[110px] flex flex-col justify-center items-center p-2 relative overflow-hidden">
                    <span className="block text-[15px] font-bold text-[#5A625D] mb-1">
                      Пульс
                    </span>
                    <input
                      ref={pulseRef}
                      type="text"
                      inputMode="numeric"
                      readOnly={!inputsUnlocked}
                      onFocus={() => setInputsUnlocked(true)}
                      autoComplete="off"
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
                      className="w-full text-center text-[40px] tracking-tight leading-none font-extrabold text-[#5A625D] placeholder-[#B0B7B2] opacity-80 focus:opacity-100 focus:outline-none bg-transparent select-text"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-[26px] h-[72px] px-5 flex items-center justify-between">
                  <span className="text-[18px] font-bold text-[#141A16]">
                    Время замера
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempTime(timeInput);
                      setTimePickerOpen(true);
                    }}
                    className="flex items-center gap-2 bg-[#F4F5F2] rounded-[20px] pl-4 pr-3 py-2.5 cursor-pointer active:scale-95 transition"
                  >
                    <span className="text-[22px] font-extrabold text-[#141A16] leading-none tabular-nums">
                      {timeInput}
                    </span>
                    <ChevronDown className="w-5 h-5 text-[#5A625D] shrink-0 stroke-[2.5]" />
                  </button>
                </div>

                {userTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {userTags.map((tag) => {
                      const active = noteInput === tag;
                      return (
                        <div
                          key={tag}
                          onClick={() => setNoteInput(active ? '' : tag)}
                          className={`pl-5 pr-2.5 py-3 rounded-full text-[16px] font-bold flex items-center gap-2 transition cursor-pointer ${
                            active ? 'bg-[#141A16] text-white' : 'bg-[#7A827D] text-white'
                          }`}
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveTag(tag, e)}
                            title="Удалить подсказку"
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                              active
                                ? 'text-white hover:opacity-70'
                                : 'text-[#C8CFCB] hover:text-white'
                            }`}
                          >
                            <X className="w-4 h-4" strokeWidth={3} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-white rounded-[24px] px-5 py-[18px]">
                  <input
                    type="text"
                    readOnly={!inputsUnlocked}
                    onFocus={() => setInputsUnlocked(true)}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    aria-autocomplete="none"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={
                      userTags.length < 4
                        ? 'Комментарий (сохранится в подсказки)'
                        : 'Комментарий (напр. сахар 5.4)'
                    }
                    className="w-full text-[16px] font-bold text-[#141A16] placeholder-[#B0B7B2] focus:outline-none bg-transparent select-text"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveRecord}
                  className="w-full py-[20px] rounded-[28px] bg-[#141A16] text-white text-[20px] font-bold active:scale-[0.99] transition cursor-pointer mt-1"
                >
                  Сохранить замер
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ШТОРКА КАСТОМНОГО ВЫБОРА ВРЕМЕНИ */}
        {timePickerOpen && (
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none touch-none"
            onClick={() => setTimePickerOpen(false)}
          >
            <div
              className="w-full max-w-[440px] bg-[#EFEFEF] rounded-t-[36px] px-6 pt-6 pb-8 flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-[#C8CFCB] rounded-full mx-auto shrink-0" />

              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="text-[32px] font-extrabold text-[#141A16] leading-none tracking-tight">
                    Время замера
                  </h3>
                  <div className="text-[15px] font-medium text-[#6E7671]">
                    Выберите время измерения
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTimePickerOpen(false)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141A16] shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              <div className="relative flex items-center justify-center w-full h-[360px] gap-3 mt-2">
                {/* Подложки колонок */}
                <div className="absolute left-0 top-0 bottom-0 w-[145px] bg-[#F4F5F2] rounded-[24px]" />
                <div className="absolute right-0 top-0 bottom-0 w-[145px] bg-[#F4F5F2] rounded-[24px]" />

                {/* Зеленая плашка выбора (по центру) */}
                <div className="absolute top-1/2 left-0 right-0 h-[72px] -translate-y-1/2 flex items-center justify-between pointer-events-none">
                  <div className="w-[145px] h-full bg-[#D8EEB9] rounded-[24px]" />
                  <div className="w-[145px] h-full bg-[#D8EEB9] rounded-[24px]" />
                </div>

                <DrumPicker
                  options={HOURS_OPTIONS}
                  value={tempTime.split(':')[0]}
                  onChange={(h) => setTempTime(`${h}:${tempTime.split(':')[1]}`)}
                />
                
                <div className="z-10 text-[40px] font-black text-[#141A16] pb-2 shrink-0 w-[20px] text-center">
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
                  className="w-full py-[18px] rounded-[28px] bg-[#141A16] text-white text-[20px] font-bold active:scale-[0.99] transition cursor-pointer"
                >
                  Подтвердить время
                </button>
                <button
                  type="button"
                  onClick={() => setTimePickerOpen(false)}
                  className="w-full py-[18px] rounded-[28px] bg-[#E4E4E4] text-[#141A16] text-[20px] font-bold active:scale-[0.99] transition cursor-pointer"
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
            onClick={() => setActiveSheet(null)}
          >
            <div
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              style={{
                transform: `translateY(${dragOffset}px)`,
                transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none'
              }}
              className="w-full max-w-[440px] max-h-[90vh] overflow-y-auto bg-[#EFEFEF] rounded-t-[36px] p-6 pb-8 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-[#C8CFCB] rounded-full mx-auto mb-2" />

              <div className="flex items-start justify-between mb-2">
                <div className="flex flex-col gap-1">
                  <h3 className="text-[38px] font-extrabold text-[#141A16] leading-none tracking-tight">
                    Настройки
                  </h3>
                  <div className="text-[15px] font-medium text-[#6E7671] leading-tight pr-4">
                    {currentUser
                      ? `Профиль: @${currentUser.username}`
                      : 'Демо-режим · данные не записываются в облако'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141A16] cursor-pointer shrink-0 mt-1"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              <div className="bg-white rounded-[26px] p-5 flex items-center justify-between">
                <div>
                  <div className="text-[18px] font-bold text-[#141A16] leading-tight">
                    {currentUser ? `Записей в облаке: ${rawCloudCount}` : `Записей в сессии: ${records.length}`}
                  </div>
                  <div className="text-[15px] font-medium text-[#7A827D] mt-0.5">
                    Уникальных замеров: {records.length}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[26px] p-5 space-y-4">
                <div className="text-[22px] font-bold text-[#141A16] leading-tight">
                  Импорт измерений
                </div>
                <textarea
                  rows={3}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="[20.10.2026 08:40] 120/80 64"
                  className="w-full bg-[#F4F5F2] rounded-[20px] p-4 text-[16px] font-medium text-[#141A16] focus:outline-none select-text resize-none placeholder-[#8F9691]"
                />
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  className="w-full py-4 rounded-full border-2 border-[#141A16] bg-transparent text-[#141A16] font-bold text-[18px] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition"
                >
                  <Upload className="w-5 h-5" strokeWidth={2.5} />
                  {currentUser ? 'Добавить в облако' : 'Добавить в демо-сессию'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="bg-white rounded-[24px] py-6 px-4 font-bold text-[16px] text-[#141A16] flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
                >
                  <Download className="w-6 h-6" strokeWidth={2.5} />
                  <span>Скачать CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser) {
                      fetchFromCloud(currentUser);
                    } else {
                      emulateCloudSync();
                    }
                    setActiveSheet(null);
                  }}
                  className="bg-[#E4E4E4] rounded-[24px] py-6 px-4 font-bold text-[16px] text-[#141A16] flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
                >
                  <RefreshCw className="w-6 h-6" strokeWidth={2.5} />
                  <span>Синхронизация</span>
                </button>
              </div>

              {currentUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-5 rounded-[22px] bg-white text-red-600 text-[18px] font-bold flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <LogOut className="w-5 h-5" strokeWidth={2.5} />
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
                  className="w-full py-5 rounded-[24px] bg-[#141A16] text-white text-[18px] font-bold flex items-center justify-center gap-2.5 cursor-pointer mt-1 active:scale-[0.99] transition"
                >
                  <User className="w-5 h-5" strokeWidth={2.5} />
                  Войти или создать профиль
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}