import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { HOURS_OPTIONS, MINUTES_OPTIONS, handleInputEnterBlur, scrollTargetIntoSheetView } from './bpUtils';
import { ScanFrameIcon, DrumPicker } from './BpIconsAndWidgets';
import { TonometerScannerModal } from './TonometerScannerModal';

export const AddRecordSheet = ({
  isOpen,
  onClose,
  currentUser,
  userTags,
  records,
  onRemoveTag,
  onSaveRecord,
  keyboardHeight,
  dragOffset,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onOverlayStateChange
}) => {
  const [sysInput, setSysInput] = useState('');
  const [diaInput, setDiaInput] = useState('');
  const [pulseInput, setPulseInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [dateInput, setDateInput] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [timeInput, setTimeInput] = useState('09:30');

  const [baseSeries, setBaseSeries] = useState(null);
  const [pendingScans, setPendingScans] = useState([]);
  
  const [seriesStartTime, setSeriesStartTime] = useState(null);
  const [timerProgress, setTimerProgress] = useState(0);

  const [inputsUnlocked, setInputsUnlocked] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanDemoNotice, setScanDemoNotice] = useState(false);
  const [flashHighlight, setFlashHighlight] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [tempTime, setTempTime] = useState('09:00');

  const sysRef = useRef(null);
  const diaRef = useRef(null);
  const pulseRef = useRef(null);
  const noteRef = useRef(null);
  const addSheetRef = useRef(null);
  const saveCtaRef = useRef(null);
  const demoNoticeTimerRef = useRef(null);
  const pulseBlurTimerRef = useRef(null);

  useEffect(() => {
    onOverlayStateChange?.({ scannerOpen, timePickerOpen });
  }, [scannerOpen, timePickerOpen, onOverlayStateChange]);

  useEffect(() => {
    if (!isOpen) {
      setInputsUnlocked(false);
      setScannerOpen(false);
      setScanDemoNotice(false);
      setTimePickerOpen(false);
      setBaseSeries(null);
      setPendingScans([]);
      setSeriesStartTime(null);
      setTimerProgress(0);
      if (pulseBlurTimerRef.current) clearTimeout(pulseBlurTimerRef.current);
      return;
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayIso = `${yyyy}-${mm}-${dd}`;
    setDateInput(todayIso);

    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const defaultTime = `${hh}:${min}`;
    setTimeInput(defaultTime);

    const t = setTimeout(() => {
      setInputsUnlocked(true);
      if (sysRef.current) sysRef.current.focus();
    }, 140);

    if (Array.isArray(records) && records.length > 0) {
      const todayRecords = records.filter((r) => r.date === todayIso);
      if (todayRecords.length > 0) {
        const sortedToday = [...todayRecords].sort((a, b) =>
          (b.time || '00:00').localeCompare(a.time || '00:00')
        );
        const latest = sortedToday[0];
        if (latest && latest.time) {
          const match = latest.id.match(/-s(\d+)$/);
          const latestSeriesCount = match ? parseInt(match[1], 10) : 1;
          const [lH, lM] = latest.time.split(':').map(Number);
          const [cH, cM] = defaultTime.split(':').map(Number);
          const diffMinutes = (cH * 60 + cM) - (lH * 60 + lM);

          if (diffMinutes >= 0 && diffMinutes <= 5) {
            setBaseSeries({
              targetId: latest.id,
              count: latestSeriesCount,
              sys: latest.sys,
              dia: latest.dia,
              pulse: latest.pulse,
              note: latest.note || ''
            });
            if (latest.note && !noteInput) {
              setNoteInput(latest.note);
            }
            setSeriesStartTime(Date.now() - (diffMinutes * 60 * 1000));
          }
        }
      }
    }

    return () => clearTimeout(t);
  }, [isOpen, records]);

  useEffect(() => {
    if (!isOpen || !currentUser || !seriesStartTime) {
      setTimerProgress(0);
      return;
    }
    
    const updateProgress = () => {
      const elapsed = Date.now() - seriesStartTime;
      const total = 5 * 60 * 1000;
      const p = Math.min(100, (elapsed / total) * 100);
      setTimerProgress(p);
    };
    
    updateProgress();
    const intervalId = setInterval(updateProgress, 1000);
    return () => clearInterval(intervalId);
  }, [isOpen, currentUser, seriesStartTime]);

  const handleScannerDetected = useCallback(({ sys, dia, pulse }) => {
    if (pulseBlurTimerRef.current) clearTimeout(pulseBlurTimerRef.current);
    sysRef.current?.blur();
    diaRef.current?.blur();
    pulseRef.current?.blur();
    noteRef.current?.blur();

    const sVal = parseInt(sys, 10);
    const dVal = parseInt(dia, 10);
    const pVal = pulse ? parseInt(pulse, 10) : null;

    if (sysInput && diaInput) {
      setPendingScans((prev) => [
        ...prev,
        {
          sys: parseInt(sysInput, 10),
          dia: parseInt(diaInput, 10),
          pulse: pulseInput ? parseInt(pulseInput, 10) : null
        }
      ]);
    }

    setSysInput(String(sVal));
    setDiaInput(String(dVal));
    setPulseInput(pVal ? String(pVal) : '');
    
    setSeriesStartTime(Date.now());

    setScannerOpen(false);
    setTimeout(() => setFlashHighlight(true), 50);
    setTimeout(() => setFlashHighlight(false), 1250);
  }, [sysInput, diaInput, pulseInput]);

  if (!isOpen) return null;

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

  const handleRemoveTagLocal = async (tagToRemove, e) => {
    e.stopPropagation();
    if (noteInput === tagToRemove) {
      setNoteInput('');
    }
    await onRemoveTag(tagToRemove);
  };

  const handleSaveClick = async () => {
    const s = parseInt(sysInput, 10);
    const d = parseInt(diaInput, 10);
    const p = pulseInput ? parseInt(pulseInput, 10) : null;

    if (!s || !d) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    let totalCount = baseSeries ? baseSeries.count : 0;
    let sumSys = baseSeries ? baseSeries.sys * baseSeries.count : 0;
    let sumDia = baseSeries ? baseSeries.dia * baseSeries.count : 0;
    let sumPulse = baseSeries && baseSeries.pulse ? baseSeries.pulse * baseSeries.count : 0;
    let pulseCount = baseSeries && baseSeries.pulse ? baseSeries.count : 0;

    pendingScans.forEach((scan) => {
      totalCount += 1;
      sumSys += scan.sys;
      sumDia += scan.dia;
      if (scan.pulse) {
        sumPulse += scan.pulse;
        pulseCount += 1;
      }
    });

    totalCount += 1;
    sumSys += s;
    sumDia += d;
    if (p) {
      sumPulse += p;
      pulseCount += 1;
    }

    const savedData = {
      targetId: baseSeries?.targetId || null,
      seriesCount: totalCount,
      sys: Math.round(sumSys / totalCount),
      dia: Math.round(sumDia / totalCount),
      pulse: pulseCount > 0 ? Math.round(sumPulse / pulseCount) : null,
      note: noteInput.trim(),
      date: dateInput,
      time: timeInput
    };

    setSysInput('');
    setDiaInput('');
    setPulseInput('');
    setNoteInput('');
    setBaseSeries(null);
    setPendingScans([]);
    setSeriesStartTime(null);
    setTimerProgress(0);
    onClose();

    await onSaveRecord(savedData);
  };

  const hasInputs = Boolean(sysInput && diaInput);
  const currentUnsavedCount = pendingScans.length + (hasInputs ? 1 : 0);
  const totalSeriesCount = (baseSeries?.count || 0) + currentUnsavedCount;

  const showScanBadge = totalSeriesCount > 0;
  const scanBadgeValue = totalSeriesCount + 1;

  const showSaveBadge = currentUnsavedCount > 0 && totalSeriesCount > 1;
  const saveBadgeValue = totalSeriesCount;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none bp-backdrop-enter"
        style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px' }}
        onClick={() => {
          if (!scannerOpen) onClose();
        }}
      >
        <form
          ref={addSheetRef}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          onSubmit={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            if (!scannerOpen) onTouchStart(e);
          }}
          onTouchMove={(e) => {
            if (!scannerOpen) onTouchMove(e);
          }}
          onTouchEnd={() => {
            if (!scannerOpen) onTouchEnd();
          }}
          style={{
            transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
            transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none',
            maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight + 8}px)` : '92vh'
          }}
          className={`w-full max-w-[440px] overflow-y-auto hide-scrollbar bg-[var(--bg-sheet)] rounded-t-[36px] px-6 pt-6 pb-8 ${
            dragOffset === 0 ? 'bp-sheet-enter' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-[var(--sheet-handle)] rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[38px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
              Новый замер
            </h3>
            <button
              type="button"
              onClick={onClose}
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
                  name={`nofill_sys_${Math.random().toString(36).substring(7)}`}
                  inputMode="numeric"
                  enterKeyHint="next"
                  readOnly={!inputsUnlocked}
                  onFocus={() => setInputsUnlocked(true)}
                  onKeyDown={handleInputEnterBlur}
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
                  name={`nofill_dia_${Math.random().toString(36).substring(7)}`}
                  inputMode="numeric"
                  enterKeyHint="next"
                  readOnly={!inputsUnlocked}
                  onFocus={() => setInputsUnlocked(true)}
                  onKeyDown={handleInputEnterBlur}
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
                  name={`nofill_pulse_${Math.random().toString(36).substring(7)}`}
                  inputMode="numeric"
                  enterKeyHint="done"
                  readOnly={!inputsUnlocked}
                  onFocus={() => setInputsUnlocked(true)}
                  onKeyDown={handleInputEnterBlur}
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
                  className="w-full text-center text-[40px] tracking-tight leading-none font-extrabold text-[var(--pulse-box-value)] placeholder-[var(--pulse-box-placeholder)] opacity-80 focus:opacity-100 focus:outline-none bg-transparent select-text"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleScanButtonClick}
              className={`relative w-full h-[60px] rounded-full border bg-transparent font-bold text-[18px] flex items-center justify-center transition cursor-pointer ${
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
                <span className="w-full text-center">Только в режиме пользователя</span>
              ) : (
                <div className="relative flex items-center justify-center w-full">
                  <div className="flex items-center gap-2.5">
                    <ScanFrameIcon className="w-6 h-6 shrink-0" />
                    <span>Сканировать прибор</span>
                  </div>
                  {showScanBadge && (
                    <span className="absolute right-4 w-[26px] h-[26px] rounded-full border-[1.5px] border-current text-[13px] font-black flex items-center justify-center leading-none opacity-80 shrink-0 mt-[1px]">
                      ×{scanBadgeValue}
                    </span>
                  )}
                </div>
              )}
            </button>

            <div className="bg-[var(--surface-input)] rounded-[24px] h-[60px] pl-4 pr-2 flex items-center justify-between relative overflow-hidden z-0">
              {currentUser && timerProgress > 0 && timerProgress < 100 && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-[var(--tag-bg)] z-[-1]"
                  style={{ width: `${timerProgress}%`, transition: 'width 1s linear' }} 
                />
              )}
              
              <span className="text-[18px] font-bold text-[var(--text-label-strong)] pointer-events-none relative z-10">
                Время замера
              </span>
              
              <button
                type="button"
                onClick={() => {
                  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                  setTempTime(timeInput);
                  setTimePickerOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 bg-[var(--surface-tertiary)] rounded-full w-[138px] h-[44px] cursor-pointer active:scale-95 transition relative z-10"
              >
                <span className="text-[22px] font-extrabold text-[var(--text-primary)] leading-none tabular-nums mt-[1px]">
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
                        onClick={(e) => handleRemoveTagLocal(tag, e)}
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

            <div className="bg-[var(--surface-input)] rounded-[16px] h-[60px] pl-4 pr-5 flex items-center">
              <input
                ref={noteRef}
                type="text"
                name={`nofill_memo_${Math.random().toString(36).substring(7)}`}
                enterKeyHint="done"
                readOnly={!inputsUnlocked}
                onFocus={() => {
                  setInputsUnlocked(true);
                  scrollTargetIntoSheetView(saveCtaRef);
                }}
                onKeyDown={handleInputEnterBlur}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
                aria-autocomplete="none"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Комментарий к замеру"
                className="w-full text-[16px] font-bold text-[var(--text-primary)] placeholder-[var(--placeholder-color)] focus:outline-none bg-transparent select-text"
              />
            </div>

            <button
              ref={saveCtaRef}
              type="button"
              onClick={handleSaveClick}
              className="w-full py-[20px] rounded-full bg-[var(--cta-bg)] text-[var(--cta-text)] text-[20px] font-bold flex items-center justify-center gap-2.5 active:scale-[0.99] transition cursor-pointer mt-1"
            >
              <span>Сохранить замер</span>
              {showSaveBadge && (
                <span className="w-[26px] h-[26px] rounded-full bg-white/20 text-white text-[13px] font-black flex items-center justify-center leading-none mt-[1px]">
                  ×{saveBadgeValue}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      {scannerOpen && (
        <TonometerScannerModal
          currentUser={currentUser}
          onClose={() => setScannerOpen(false)}
          onDetected={handleScannerDetected}
        />
      )}

      {timePickerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none touch-none bp-backdrop-enter"
          onClick={() => setTimePickerOpen(false)}
        >
          <div
            className="w-full max-w-[440px] bg-[var(--bg-sheet)] rounded-t-[36px] px-6 pt-6 pb-8 flex flex-col gap-5 bp-sheet-enter"
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
    </>
  );
};