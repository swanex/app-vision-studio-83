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
  Cloud,
  CloudOff,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Camera
} from 'lucide-react';

// Подключение к твоей облачной базе Supabase
const SUPABASE_URL = 'https://qgmnldmmhdtqbptbdmjm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbW5sZG1taGR0cWJwdGJkbWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyODg5MDcsImV4cCI6MjEwNzg2NDkwN30.uEofng_-EPocDFkxHId5b-nMoLaD2RjKqBo_uh6TUYs';

const STORAGE_CACHE_KEY = 'roma_bp_cloud_cache_v5';
const AVATAR_STORAGE_KEY = 'roma_bp_custom_avatar_v1';

// Цвета основных линий графика (сбалансированные по плотности контраста)
const SYS_COLOR = '#689F38'; // Зеленый для верхнего давления
const DIA_COLOR = '#5BA4B6'; // Бирюзово-голубой для нижнего давления

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

// Склонение слова «измерение»
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
  if (sys < 110 || dia < 65) return { text: 'Низкое', bg: '#CDE9F2', textCol: '#141A16' };
  if (sys < 130 && dia < 85) return { text: 'В норме', bg: '#D6EBB4', textCol: '#141A16' };
  if (sys < 140 && dia < 90) return { text: 'Повышенное', bg: '#EFEFEF', textCol: '#141A16' };
  return { text: 'Высокое', bg: '#141A16', textCol: '#FFFFFF' };
};

// Иконка Домика (Solid / Outline)
const HomeNavIcon = ({ solid }) =>
  solid ? (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#141A16" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.33 2.59a1.05 1.05 0 0 1 1.34 0l8 6.86A1.05 1.05 0 0 1 21.05 10.25v9.7A2.05 2.05 0 0 1 19 22h-4.5a.75.75 0 0 1-.75-.75v-5.5a.75.75 0 0 0-.75-.75h-2a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 1-.75.75H5a2.05 2.05 0 0 1-2.05-2.05v-9.7a1.05 1.05 0 0 1 .38-.8l8-6.86Z" />
    </svg>
  ) : (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#858D88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V9.5z" />
      <path d="M9 21.5V14h6v7.5" />
    </svg>
  );

// Иконка Истории (Solid / Outline)
const HistoryNavIcon = ({ solid }) =>
  solid ? (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#141A16" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#141A16" />
      <path d="M7.5 8.5H16.5M7.5 12H16.5M7.5 15.5H12.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#858D88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <line x1="7.5" y1="8.5" x2="16.5" y2="8.5" />
      <line x1="7.5" y1="12" x2="16.5" y2="12" />
      <line x1="7.5" y1="15.5" x2="12.5" y2="15.5" />
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

const parseImportData = (rawText) => {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsed = [];

  lines.forEach((line, idx) => {
    const chatMatch = line.match(/^\[(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2}):(\d{2})\][^:]*:\s*(.+)\$/);
    if (chatMatch) {
      const [, dd, mm, yyyy, hh, min, content] = chatMatch;
      const isoDate = `${yyyy}-${mm}-${dd}`;
      const timeStr = `${hh.padStart(2, '0')}:${min}`;
      const bpMatches = [...content.matchAll(/(\d{2,3})\/(\d{2,3})(?:\s+(\d{2,3}))?/g)];
      if (bpMatches.length > 0) {
        const last = bpMatches[bpMatches.length - 1];
        let s = parseInt(last[1], 10);
        if (s < 40) s += 100;
        const d = parseInt(last[2], 10);
        const p = last[3] ? parseInt(last[3], 10) : null;
        parsed.push({
          id: `r-${isoDate}-${timeStr.replace(':', '')}`,
          date: isoDate,
          time: timeStr,
          sys: s,
          dia: d,
          pulse: p && p >= 35 && p <= 200 ? p : null,
          note: content.trim()
        });
        return;
      }
    }

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
        .replace(/^[;,\s/|-]+|[;,\s/|-]+\$/g, '')
        .trim();

      if (sys >= 75 && sys <= 220 && dia >= 45 && dia <= 140) {
        parsed.push({
          id: `r-${isoDate}-${time.replace(':', '')}-${idx}`,
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

const DEFAULT_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
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

export default function App() {
  const [records, setRecords] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return deduplicateRecords(parsed);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [avatarSrc, setAvatarSrc] = useState(() => {
    return localStorage.getItem(AVATAR_STORAGE_KEY) || DEFAULT_AVATAR_SVG;
  });

  const [cloudStatus, setCloudStatus] = useState('syncing');
  const [rawCloudCount, setRawCloudCount] = useState(0);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'history'
  const [period, setPeriod] = useState('30d'); // '7d' | '30d' | 'all'
  const [dayTimeFilter, setDayTimeFilter] = useState('all'); // 'all' | 'morning' | 'evening'

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSheet, setActiveSheet] = useState(null); // 'add' | 'data' | null

  // Состояние для свайпа шторки вниз за любое место ее тела
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartYRef = useRef(null);

  const [sysInput, setSysInput] = useState('');
  const [diaInput, setDiaInput] = useState('');
  const [pulseInput, setPulseInput] = useState('');
  const [noteInput, setNoteInput] = useState('Утро');
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeInput, setTimeInput] = useState('09:30');

  const sysRef = useRef(null);
  const diaRef = useRef(null);
  const pulseRef = useRef(null);
  const avatarInputRef = useRef(null);

  const [importText, setImportText] = useState('');

  // Блокируем скролл экрана под шторкой, когда шторка открыта
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
  }, [activeSheet]);

  // Обработчики смахивания шторки за тело
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

  const fetchFromCloud = useCallback(async () => {
    setCloudStatus('syncing');
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/bp_records?select=*&order=date.asc,time.asc`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setRawCloudCount(data.length);
        const unique = deduplicateRecords(data);
        setRecords(unique);
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(unique));
        setCloudStatus('online');
      }
    } catch (err) {
      console.error(err);
      setCloudStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchFromCloud();
  }, [fetchFromCloud]);

  const upsertToCloud = async (itemsArray) => {
    setCloudStatus('syncing');
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/bp_records`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(itemsArray)
      });
      if (!res.ok) throw new Error('Ошибка записи');
      setCloudStatus('online');
    } catch (e) {
      console.error(e);
      setCloudStatus('error');
    }
  };

  const deleteFromCloud = async (id) => {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/bp_records?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleCleanCloudDuplicates = async () => {
    setCloudStatus('syncing');
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/bp_records?select=*`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });
      const allRows = await res.json();
      if (!Array.isArray(allRows)) return;

      const seen = new Set();
      const duplicateIds = [];

      allRows.forEach((row) => {
        const sig = `${row.date}_${row.time}_${row.sys}_${row.dia}`;
        if (seen.has(sig)) {
          duplicateIds.push(row.id);
        } else {
          seen.add(sig);
        }
      });

      for (const id of duplicateIds) {
        await deleteFromCloud(id);
      }

      await fetchFromCloud();
      setActiveSheet(null);
    } catch (e) {
      console.error(e);
      setCloudStatus('error');
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarSrc(reader.result);
        localStorage.setItem(AVATAR_STORAGE_KEY, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (activeSheet === 'add') {
      const now = new Date();
      setDateInput(now.toISOString().slice(0, 10));
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setTimeInput(`${hh}:${mm}`);
      setTimeout(() => {
        if (sysRef.current) sysRef.current.focus();
      }, 120);
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
        avgPulse: 0,
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
      avgPulse: pulseCnt > 0 ? Math.round(pulseSum / pulseCnt) : '—',
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

    const newItem = {
      id: `r-${dateInput}-${timeInput.replace(':', '')}`,
      date: dateInput,
      time: timeInput,
      sys: s,
      dia: d,
      pulse: p,
      note: noteInput.trim() || 'Утро'
    };

    const updated = deduplicateRecords([...records, newItem]);
    setRecords(updated);
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated));

    setSysInput('');
    setDiaInput('');
    setPulseInput('');
    setActiveSheet(null);

    await upsertToCloud([newItem]);
  };

  const handleDelete = async (id) => {
    const updated = records.filter((item) => item.id !== id);
    setRecords(updated);
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated));
    await deleteFromCloud(id);
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
    a.download = `pressure_roma_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = async () => {
    const parsed = parseImportData(importText);
    if (parsed.length > 0) {
      const updated = deduplicateRecords([...records, ...parsed]);
      setRecords(updated);
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated));
      setImportText('');
      setActiveSheet(null);
      await upsertToCloud(parsed);
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
  const avgBadge = getStatusLabel(stats.avgSys || 120, stats.avgDia || 80);
  const greetingText = getGreetingByHour();

  const periodRangeLabel = useMemo(() => {
    if (!stats.firstDate || !stats.lastDate) return '';
    const startStr = formatHumanDate(stats.firstDate);
    const endStr = formatHumanDate(stats.lastDate);
    const count = filteredRecords.length;
    const rangePart = startStr === endStr ? startStr : `${startStr} – ${endStr}`;
    return `${rangePart} · ${count} ${pluralizeMeasurements(count)}`;
  }, [stats.firstDate, stats.lastDate, filteredRecords.length]);

  return (
    <div className="min-h-screen bg-[#E4E7E4] text-[#141A16] flex justify-center selection:bg-[#D6EBB4] font-sans">
      <div className="w-full max-w-[440px] min-h-screen bg-[#F2F3F0] pb-28 px-5 pt-6 relative flex flex-col">
        
        {/* ВЕРХНЯЯ ШАПКА: Аватар + Приветствие и полное имя + 3 круглые нейтральные кнопки */}
        <header className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              title="Нажми, чтобы выбрать свое фото для аватара"
              className="w-[50px] h-[50px] rounded-full overflow-hidden bg-[#141A16] shrink-0 relative group cursor-pointer shadow-xs"
            >
              <img
                src={avatarSrc}
                alt="Рома Лебедев"
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                <Camera className="w-4 h-4" />
              </span>
            </button>

            <div className="min-w-0">
              <div className="text-[13px] text-[#6E7671] font-medium leading-tight whitespace-nowrap">
                {greetingText}
              </div>
              <div className="text-[17px] font-extrabold tracking-tight text-[#141A16] leading-snug whitespace-nowrap">
                Рома Лебедев
              </div>
            </div>
          </div>

          {/* Три нейтральных кружочка: Облако, Поиск, Настройки */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchFromCloud}
              title={
                cloudStatus === 'online'
                  ? 'Синхронизировано с облаком (нажми для обновления)'
                  : cloudStatus === 'syncing'
                  ? 'Обновление...'
                  : 'Офлайн режим'
              }
              className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#5A625D] active:scale-95 transition cursor-pointer shadow-2xs"
              aria-label="Синхронизация с облаком"
            >
              {cloudStatus === 'syncing' ? (
                <RefreshCw className="w-5 h-5 animate-spin text-[#7A827D]" />
              ) : cloudStatus === 'online' ? (
                <Cloud className="w-5 h-5 text-[#5A625D]" />
              ) : (
                <CloudOff className="w-5 h-5 text-[#A0A7A2]" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                setSearchOpen((prev) => !prev);
              }}
              className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#141A16] active:scale-95 transition cursor-pointer shadow-2xs"
              aria-label="Поиск"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveSheet('data')}
              className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#141A16] active:scale-95 transition cursor-pointer shadow-2xs"
              aria-label="Настройки"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ЭКРАН 1: ГЛАВНАЯ */}
        {activeTab === 'home' && (
          <main className="space-y-4">
            {/* Сегментированный переключатель периода */}
            <div className="bg-white rounded-full p-1.5 grid grid-cols-3 shadow-2xs">
              {[
                { id: '7d', label: 'Неделя' },
                { id: '30d', label: 'Месяц' },
                { id: 'all', label: 'Год' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id)}
                  className={`py-3 rounded-full text-[15px] font-semibold transition cursor-pointer ${
                    period === tab.id
                      ? 'bg-[#141A16] text-white'
                      : 'text-[#6E7671] hover:text-[#141A16]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Единая белая карточка: Среднее АД + График с легендой + Фильтры суток */}
            <section className="bg-white rounded-[32px] p-6 shadow-2xs">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-[42px] font-extrabold tracking-tight leading-none text-[#141A16]">
                    {stats.avgSys ? `${stats.avgSys}/${stats.avgDia}` : '—/—'}
                  </span>
                  <span className="text-[15px] font-normal text-[#7A827D] whitespace-nowrap">
                    · среднее
                  </span>
                </div>
                <span
                  className="px-3.5 py-1.5 rounded-full text-sm font-semibold shrink-0"
                  style={{ backgroundColor: avgBadge.bg, color: avgBadge.textCol }}
                >
                  {avgBadge.text}
                </span>
              </div>

              <p className="text-[15px] text-[#7A827D] mb-4">
                {stats.avgSys ? periodRangeLabel : 'Загрузка измерений из облака...'}
              </p>

              {/* Тело графика + компактная легенда справа */}
              <div className="h-[200px] w-full -mx-2 relative">
                {/* Небольшая легенда в правой части тела графика */}
                <div className="absolute top-1.5 right-3 z-10 flex items-center gap-3 bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded-full pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: SYS_COLOR }}
                    />
                    <span className="text-xs font-medium text-[#5A625D]">Верхнее</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: DIA_COLOR }}
                    />
                    <span className="text-xs font-medium text-[#5A625D]">Нижнее</span>
                  </div>
                </div>

                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 14, right: 12, left: -22, bottom: 0 }}>
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
                        domain={[65, 140]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 13, fill: '#7A827D' }}
                        ticks={[75, 100, 125]}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const item = payload[0].payload;
                          return (
                            <div className="bg-[#141A16] text-white rounded-[20px] px-4 py-3 shadow-lg">
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
                  <div className="h-full flex items-center justify-center text-sm text-[#8F9691]">
                    Нет данных за выбранный фильтр
                  </div>
                )}
              </div>

              {/* Фильтры «Все / Утро / Вечер» по центру карточки */}
              <div className="mt-5 pt-1 flex items-center justify-center gap-2.5">
                <button
                  onClick={() => setDayTimeFilter('all')}
                  className={`px-6 py-2.5 rounded-full text-[15px] font-semibold transition cursor-pointer ${
                    dayTimeFilter === 'all'
                      ? 'bg-[#141A16] text-white'
                      : 'bg-[#F4F5F2] text-[#6E7671] hover:text-[#141A16]'
                  }`}
                >
                  Все
                </button>

                <button
                  onClick={() => setDayTimeFilter('morning')}
                  className={`px-5 py-2.5 rounded-full text-[15px] font-semibold flex items-center gap-2 transition cursor-pointer ${
                    dayTimeFilter === 'morning'
                      ? 'bg-[#141A16] text-white'
                      : 'bg-[#F4F5F2] text-[#6E7671] hover:text-[#141A16]'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Утро</span>
                </button>

                <button
                  onClick={() => setDayTimeFilter('evening')}
                  className={`px-5 py-2.5 rounded-full text-[15px] font-semibold flex items-center gap-2 transition cursor-pointer ${
                    dayTimeFilter === 'evening'
                      ? 'bg-[#141A16] text-white'
                      : 'bg-[#EEF1FA] text-[#3B4990] hover:opacity-90'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                  <span>Вечер</span>
                </button>
              </div>
            </section>

            {/* Два дополнительных показателя рядом */}
            <section className="grid grid-cols-2 gap-3.5 pt-0.5">
              <div className="bg-[#D4ECF4] rounded-[28px] p-5 flex flex-col justify-between min-h-[144px]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[30px] font-extrabold tracking-tight leading-none text-[#141A16]">
                      {latestRec ? `${latestRec.sys}/${latestRec.dia}` : '—'}
                    </div>
                    <div className="text-[15px] text-[#5B7077] font-medium mt-1.5">
                      {latestRec ? formatHumanDate(latestRec.date) : '—'}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#141A16] shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[16px] font-semibold text-[#141A16] mt-4">
                  Последний замер
                </div>
              </div>

              <div className="bg-[#D8EEB9] rounded-[28px] p-5 flex flex-col justify-between min-h-[144px]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[30px] font-extrabold tracking-tight leading-none text-[#141A16]">
                      {stats.avgPulse}
                    </div>
                    <div className="text-[15px] text-[#5D7044] font-medium mt-1.5">
                      уд/мин
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#141A16] shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[16px] font-semibold text-[#141A16] mt-4">
                  Средний пульс
                </div>
              </div>
            </section>
          </main>
        )}

        {/* ЭКРАН 2: ИСТОРИЯ ИЗМЕРЕНИЙ */}
        {activeTab === 'history' && (
          <main className="space-y-3">
            {searchOpen && (
              <div className="mb-3">
                <input
                  type="search"
                  name="bp_history_filter_query"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Найти: кофе, трени, сахар, утро..."
                  className="w-full bg-white rounded-[22px] px-5 py-3.5 text-base text-[#141A16] placeholder-[#858D88] focus:outline-none shadow-2xs"
                />
              </div>
            )}

            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-sm font-medium text-[#7A827D]">
                Уникальных замеров: {historyList.length}
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold text-[#141A16] underline"
                >
                  Сбросить поиск
                </button>
              )}
            </div>

            {historyList.map((item) => {
              const badge = getStatusLabel(item.sys, item.dia);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-[26px] px-5 py-4 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[24px] font-bold tracking-tight text-[#141A16]">
                        {item.sys}/{item.dia}
                      </span>
                      {item.pulse && (
                        <span className="text-base font-semibold text-[#5BA4B6]">
                          ♥ {item.pulse}
                        </span>
                      )}
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full ml-auto sm:ml-1"
                        style={{ backgroundColor: badge.bg, color: badge.textCol }}
                      >
                        {badge.text}
                      </span>
                    </div>
                    <div className="text-[15px] text-[#5A625D] mt-1 truncate">
                      {item.note || 'Замер'}
                    </div>
                    <div className="text-sm text-[#8F9691] mt-0.5">
                      {formatHumanDate(item.date)} в {item.time}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#B0B7B2] hover:text-[#141A16] active:scale-95 transition cursor-pointer shrink-0"
                    title="Удалить запись"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </main>
        )}

        {/* НИЖНИЙ НАВБАР БЕЗ ПОДПИСЕЙ: Solid/Outline иконки + крупный черный круг с плюсом */}
        <nav className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-5 pointer-events-none">
          <div className="w-full max-w-[400px] h-[68px] bg-white rounded-[34px] px-12 shadow-lg flex items-center justify-between pointer-events-auto">
            <button
              onClick={() => setActiveTab('home')}
              className="p-2 active:scale-95 transition cursor-pointer"
              aria-label="Главная"
            >
              <HomeNavIcon solid={activeTab === 'home'} />
            </button>

            <button
              onClick={() => setActiveSheet('add')}
              className="w-16 h-16 -mt-6 rounded-full bg-[#141A16] text-white flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
              aria-label="Добавить замер"
            >
              <Plus className="w-8 h-8" strokeWidth={2.2} />
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className="p-2 active:scale-95 transition cursor-pointer"
              aria-label="История"
            >
              <HistoryNavIcon solid={activeTab === 'history'} />
            </button>
          </div>
        </nav>

        {/* ШТОРКА 1: Ввод нового замера (смахивается за тело, блокирует фон, без панели паролей Gboard) */}
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
              className="w-full max-w-[440px] bg-[#EFEFEF] rounded-t-[36px] p-6 pb-8 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Индикатор смахивания */}
              <div className="w-12 h-1.5 bg-[#C8CFCB] rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[28px] font-bold text-[#141A16] leading-none">
                  Новый замер
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141A16] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Используем div вместо form и спец-атрибуты, чтобы Gboard на Android не выводил белую полосу паролей и карт */}
              <div role="group" data-form-type="other" className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-[26px] p-4 text-center">
                    <span className="block text-sm font-medium text-[#7A827D] mb-1">
                      Верхнее
                    </span>
                    <input
                      ref={sysRef}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bp_val_s_custom"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      placeholder="120"
                      value={sysInput}
                      onChange={handleSysChange}
                      className="w-full text-center text-[34px] font-bold text-[#141A16] placeholder-[#D0D5D2] focus:outline-none bg-transparent"
                    />
                  </div>

                  <div className="bg-white rounded-[26px] p-4 text-center">
                    <span className="block text-sm font-medium text-[#7A827D] mb-1">
                      Нижнее
                    </span>
                    <input
                      ref={diaRef}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bp_val_d_custom"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      placeholder="82"
                      value={diaInput}
                      onChange={handleDiaChange}
                      className="w-full text-center text-[34px] font-bold text-[#141A16] placeholder-[#D0D5D2] focus:outline-none bg-transparent"
                    />
                  </div>

                  <div className="bg-[#D8EEB9] rounded-[26px] p-4 text-center">
                    <span className="block text-sm font-medium text-[#4A5D2F] mb-1">
                      Пульс
                    </span>
                    <input
                      ref={pulseRef}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="bp_val_p_custom"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      placeholder="64"
                      value={pulseInput}
                      onChange={handlePulseChange}
                      className="w-full text-center text-[34px] font-bold text-[#141A16] placeholder-[#99B277] focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Утро',
                    'После кофе',
                    'После силовой',
                    'После кардио',
                    'Вечером после прогулки'
                  ].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setNoteInput(tag)}
                      className={`px-4 py-2.5 rounded-full text-[15px] font-semibold transition cursor-pointer ${
                        noteInput === tag
                          ? 'bg-[#141A16] text-white'
                          : 'bg-white text-[#141A16]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-[24px] px-4 py-3.5 flex items-center gap-3">
                  <input
                    type="search"
                    name="bp_custom_memo_field"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Комментарий (напр. сахар 5.4)"
                    className="flex-1 text-base text-[#141A16] placeholder-[#8F9691] focus:outline-none bg-transparent"
                  />
                  <input
                    type="time"
                    name="bp_custom_time_field"
                    autoComplete="off"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="text-base font-semibold text-[#141A16] bg-[#EFEFEF] rounded-full px-3 py-1 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveRecord}
                  className="w-full py-4 rounded-full bg-[#141A16] text-white text-lg font-semibold active:scale-[0.99] transition cursor-pointer"
                >
                  Сохранить замер
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ШТОРКА 2: Управление базой (также поддерживает смахивание за тело) */}
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

              <div className="flex items-center justify-between">
                <h3 className="text-[26px] font-bold text-[#141A16]">
                  База данных
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141A16]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white rounded-[26px] p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[#141A16]">
                    Записей в облаке: {rawCloudCount}
                  </div>
                  <div className="text-xs text-[#7A827D]">
                    Уникальных замеров: {records.length}
                  </div>
                </div>
                {rawCloudCount > records.length && (
                  <button
                    type="button"
                    onClick={handleCleanCloudDuplicates}
                    className="px-4 py-2 rounded-full bg-[#D8EEB9] text-[#141A16] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Удалить дубли ({rawCloudCount - records.length})
                  </button>
                )}
              </div>

              <div className="bg-white rounded-[26px] p-4 space-y-3">
                <div className="text-base font-bold text-[#141A16]">
                  Импорт строк из текста
                </div>
                <textarea
                  rows={3}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="[20.10.2026 08:40] Roma Lebedev: 120/80 64 утро"
                  className="w-full bg-[#EFEFEF] rounded-[18px] p-3 text-sm text-[#141A16] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  className="w-full py-3.5 rounded-full bg-[#141A16] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Добавить в облако
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="bg-white rounded-[24px] py-3.5 px-4 font-semibold text-sm text-[#141A16] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Скачать CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fetchFromCloud();
                    setActiveSheet(null);
                  }}
                  className="bg-[#D4ECF4] rounded-[24px] py-3.5 px-4 font-semibold text-sm text-[#141A16] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Синхронизировать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}