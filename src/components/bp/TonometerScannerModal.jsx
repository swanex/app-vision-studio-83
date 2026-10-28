import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Zap } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_KEY } from './bpUtils';

export const TonometerScannerModal = ({ onClose, onDetected, currentUser }) => {
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
      className="fixed inset-0 z-[70] bg-black/80 flex justify-center select-none touch-none bp-backdrop-enter"
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