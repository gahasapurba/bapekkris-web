import { useEffect, useRef, useState } from 'react';
import { CameraOff } from 'lucide-react';

interface QrScannerProps {
  /** Called once per distinct code; the same code is ignored for a few seconds after a read. */
  onDetected: (code: string) => void;
  /** Pauses decoding (e.g. while a check-in request is in flight) without releasing the camera. */
  paused?: boolean;
}

interface DetectedBarcode { rawValue: string }
interface BarcodeDetectorLike { detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]> }
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike;

const SAME_CODE_COOLDOWN_MS = 3000;
const SCAN_INTERVAL_MS = 250;

/**
 * Rear-camera QR reader. Uses the native BarcodeDetector where available (Chrome, Android) and
 * falls back to jsQR, loaded on demand, elsewhere (Safari / iOS).
 */
export default function QrScanner({ onDetected, paused = false }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [error, setError] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let lastCode = '';
    let lastAt = 0;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Browser ini tidak mendukung akses kamera. Gunakan input manual di bawah.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      } catch (err) {
        const name = (err as DOMException)?.name;
        setError(name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, atau gunakan input manual.'
          : 'Kamera tidak dapat dibuka. Gunakan input manual di bawah.');
        return;
      }
      if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const Native = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
      let decode: () => Promise<string | null>;
      if (Native) {
        const detector = new Native({ formats: ['qr_code'] });
        decode = async () => (await detector.detect(video))[0]?.rawValue ?? null;
      } else {
        const { default: jsQR } = await import('jsqr');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        decode = async () => {
          if (!ctx || !video.videoWidth) return null;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
          return jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })?.data ?? null;
        };
      }

      const tick = async () => {
        if (stopped) return;
        if (!pausedRef.current && video.readyState >= 2) {
          const code = (await decode().catch(() => null))?.trim();
          const now = Date.now();
          if (code && (code !== lastCode || now - lastAt > SAME_CODE_COOLDOWN_MS)) {
            lastCode = code;
            lastAt = now;
            onDetectedRef.current(code);
          }
        }
        timer = setTimeout(tick, SCAN_INTERVAL_MS);
      };
      tick();
    };

    start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-md border border-danger-line bg-danger-tint px-4 py-3 text-[0.9rem] text-ink">
        <CameraOff size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />{error}
      </p>
    );
  }
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-lg bg-black">
      <video ref={videoRef} muted playsInline aria-label="Pratinjau kamera pemindai QR" className="size-full object-cover" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-[18%] rounded-lg border-2 border-[rgba(255,255,255,0.8)] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
    </div>
  );
}
