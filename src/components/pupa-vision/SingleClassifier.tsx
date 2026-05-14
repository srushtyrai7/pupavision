'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ClassificationResult,
  LastSource,
} from '@/lib/pupa-vision/types';
import {
  simulateClassification,
  PROCESSING_STEPS,
  drawHeatmap,
} from '@/lib/pupa-vision/classify';

type ClassifyTab = 'camera' | 'upload' | 'result' | 'features';

interface SingleClassifierProps {
  pipelineStep: number;
  onPipelineStep: (step: number) => void;
  onResult: (src: string, result: ClassificationResult) => void;
}

export function SingleClassifier({
  pipelineStep,
  onPipelineStep,
  onResult,
}: SingleClassifierProps) {
  const [activeTab, setActiveTab] = useState<ClassifyTab>('camera');
  const [lastSource, setLastSource] = useState<LastSource>('upload');

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraCaptured, setCameraCaptured] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    'environment'
  );
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const capturedImgRef = useRef<HTMLImageElement>(null);
  const heatmapCamRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedDataURL, setCapturedDataURL] = useState<string | null>(null);

  // Upload state
  const [uploadImg, setUploadImg] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const uploadImgRef = useRef<HTMLImageElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Result state
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [procStepTexts, setProcStepTexts] = useState<string[]>([]);

  // Heatmap toggle
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const [heatmapCamVisible, setHeatmapCamVisible] = useState(false);

  // ── Camera functions ─────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(false);
    try {
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCameraCaptured(false);
      setCapturedDataURL(null);
      onPipelineStep(1);
    } catch {
      setCameraError(true);
    }
  }, [facingMode, onPipelineStep]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraCaptured(false);
    onPipelineStep(0);
  }, [onPipelineStep]);

  const switchCam = useCallback(async () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setTimeout(() => startCamera(), 50);
  }, [startCamera]);

  const captureFrame = useCallback(() => {
    const v = videoRef.current;
    const c = captureCanvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    c.getContext('2d')?.drawImage(v, 0, 0);
    const dataURL = c.toDataURL('image/jpeg', 0.92);
    setCapturedDataURL(dataURL);
    setCameraCaptured(true);
    setCameraActive(false);
    setLastSource('camera');
    onPipelineStep(1);
  }, [onPipelineStep]);

  const retake = useCallback(() => {
    setCapturedDataURL(null);
    setCameraCaptured(false);
    setResult(null);
    setHeatmapCamVisible(false);
    startCamera();
  }, [startCamera]);

  // ── Upload functions ─────────────────────────────────────────
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadImg(ev.target?.result as string);
        onPipelineStep(1);
        setLastSource('upload');
      };
      reader.readAsDataURL(file);
    },
    [onPipelineStep]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        setUploadFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
          setUploadImg(ev.target?.result as string);
          onPipelineStep(1);
          setLastSource('upload');
        };
        reader.readAsDataURL(file);
      }
    },
    [onPipelineStep]
  );

  const clearUpload = useCallback(() => {
    setUploadImg(null);
    setUploadFile(null);
    setResult(null);
    setHeatmapVisible(false);
    onPipelineStep(0);
  }, [onPipelineStep]);

  // ── Classification ───────────────────────────────────────────
  const runClassification = useCallback(
    (imgSrc: string, source: 'cam' | 'upload') => {
      setProcessing(true);
      setProcStepTexts([]);

      const texts: string[] = [];
      PROCESSING_STEPS.forEach((step, i) => {
        setTimeout(() => {
          onPipelineStep(i + 1);
          texts.push(step);
          setProcStepTexts([...texts]);
        }, i * 380);
      });

      setTimeout(() => {
        setProcessing(false);
        const res = simulateClassification(imgSrc);
        setResult(res);
        onPipelineStep(6);

        // Draw heatmap
        setTimeout(() => {
          if (source === 'cam' && capturedImgRef.current && heatmapCamRef.current) {
            drawHeatmap(heatmapCamRef.current, res, capturedImgRef.current);
          } else if (source === 'upload' && uploadImgRef.current && heatmapCanvasRef.current) {
            drawHeatmap(heatmapCanvasRef.current, res, uploadImgRef.current);
          }
        }, 50);

        onResult(imgSrc, res);
        setActiveTab('result');
      }, PROCESSING_STEPS.length * 380 + 300);
    },
    [onPipelineStep, onResult]
  );

  const classifyCam = useCallback(() => {
    if (!capturedDataURL) return;
    runClassification(capturedDataURL, 'cam');
  }, [capturedDataURL, runClassification]);

  const classifyUpload = useCallback(() => {
    if (!uploadImg) return;
    runClassification(uploadImg, 'upload');
  }, [uploadImg, runClassification]);

  // ── Tab buttons ──────────────────────────────────────────────
  const tabs: { key: ClassifyTab; label: string }[] = [
    { key: 'camera', label: '📷 Live Camera' },
    { key: 'upload', label: '🖼 Upload Image' },
    { key: 'result', label: 'Result' },
    { key: 'features', label: 'Feature Analysis' },
  ];

  return (
    <div
      className="rounded-[10px] border overflow-hidden"
      style={{
        background: '#0E1A18',
        borderColor: 'rgba(0,200,150,0.18)',
      }}
    >
      {/* Panel Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-2.5"
        style={{ borderColor: 'rgba(0,200,150,0.08)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ background: '#003D2E' }}
        >
          🔍
        </div>
        <div>
          <div className="text-sm font-bold">Single Pupa Classifier</div>
          <div className="font-mono text-[11px] text-[#3D6B60]">
            Camera · Upload · Analyse · Get Prediction
          </div>
        </div>
      </div>

      {/* Tab Row */}
      <div
        className="flex gap-1 border-b px-5 overflow-x-auto"
        style={{ borderColor: 'rgba(0,200,150,0.08)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3.5 py-2.5 text-xs cursor-pointer border-b-2 mb-[-1px] transition-all font-medium whitespace-nowrap bg-transparent"
            style={{
              color:
                activeTab === tab.key ? '#00C896' : '#3D6B60',
              borderBottomColor:
                activeTab === tab.key ? '#00C896' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel Body */}
      <div className="p-5">
        {/* ── Camera Tab ────────────────────────────── */}
        {activeTab === 'camera' && (
          <div>
            {/* Camera error */}
            {cameraError && (
              <div
                className="mb-2.5 py-2.5 px-3.5 rounded-md text-xs text-center"
                style={{
                  background: '#3D1209',
                  border: '1px solid rgba(255,91,74,0.3)',
                  color: '#FF5B4A',
                }}
              >
                Camera access denied. Please allow camera permission in your
                browser and refresh.
              </div>
            )}

            {/* Viewfinder */}
            <div
              className="relative bg-black rounded-[10px] overflow-hidden border"
              style={{
                aspectRatio: '4/3',
                borderColor: 'rgba(0,200,150,0.18)',
              }}
            >
              {/* Idle state */}
              {!cameraActive && !cameraCaptured && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                  style={{ background: '#152420' }}
                >
                  <div className="text-[34px] opacity-40">📷</div>
                  <div className="font-mono text-[11px] text-[#3D6B60]">
                    Tap &quot;Start Camera&quot; to begin
                  </div>
                </div>
              )}

              {/* Video feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: cameraActive && !cameraCaptured ? 'block' : 'none' }}
              />

              {/* Captured image */}
              <img
                ref={capturedImgRef}
                src={capturedDataURL || ''}
                alt="Captured pupa"
                className="w-full h-full object-cover"
                style={{ display: cameraCaptured ? 'block' : 'none' }}
              />

              {/* Heatmap overlay */}
              <canvas
                ref={heatmapCamRef}
                className="absolute inset-0 w-full h-full transition-opacity duration-600 pointer-events-none"
                style={{
                  opacity: heatmapCamVisible ? 0.55 : 0,
                }}
              />

              {/* Corner brackets */}
              <div
                className="absolute w-[18px] h-[18px] border-t-2 border-l-2 pointer-events-none"
                style={{ top: 8, left: 8, borderColor: '#00C896' }}
              />
              <div
                className="absolute w-[18px] h-[18px] border-t-2 border-r-2 pointer-events-none"
                style={{ top: 8, right: 8, borderColor: '#00C896' }}
              />
              <div
                className="absolute w-[18px] h-[18px] border-b-2 border-l-2 pointer-events-none"
                style={{ bottom: 8, left: 8, borderColor: '#00C896' }}
              />
              <div
                className="absolute w-[18px] h-[18px] border-b-2 border-r-2 pointer-events-none"
                style={{ bottom: 8, right: 8, borderColor: '#00C896' }}
              />

              {/* Scan line */}
              {cameraActive && !cameraCaptured && (
                <div
                  className="absolute left-2 right-2 h-[1.5px] pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, #00C896, transparent)',
                    animation: 'pv-scan 2.5s ease-in-out infinite',
                  }}
                />
              )}

              {/* Status */}
              <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] text-[#00C896] px-2.5 py-[3px] rounded-full tracking-wide whitespace-nowrap"
                style={{ background: 'rgba(0,0,0,0.65)' }}
              >
                {cameraActive && !cameraCaptured
                  ? 'Live — point at pupa'
                  : cameraCaptured
                  ? 'Captured ✓'
                  : 'Camera off'}
              </div>
            </div>

            {/* Start button */}
            {!cameraActive && !cameraCaptured && (
              <button
                onClick={startCamera}
                className="w-full mt-3.5 py-3 px-5 rounded-md font-bold text-sm cursor-pointer border-none transition-all flex items-center justify-center gap-2"
                style={{
                  background: '#00C896',
                  color: '#09100F',
                }}
              >
                📷 Start Camera
              </button>
            )}

            {/* Live controls */}
            {cameraActive && !cameraCaptured && (
              <div className="flex items-center justify-center gap-3.5 mt-3">
                <button
                  onClick={switchCam}
                  className="px-3.5 py-2 rounded-md text-xs font-semibold cursor-pointer border transition-all"
                  style={{
                    background: '#152420',
                    borderColor: 'rgba(0,200,150,0.18)',
                    color: '#7ABFB0',
                  }}
                >
                  🔄 Flip
                </button>
                <div className="text-center">
                  <button
                    onClick={captureFrame}
                    className="w-[62px] h-[62px] rounded-full flex items-center justify-center text-2xl cursor-pointer border-[3px] transition-all"
                    style={{
                      background: '#00C896',
                      color: '#09100F',
                      borderColor: '#09100F',
                      boxShadow: '0 0 0 2px #00C896',
                    }}
                  >
                    📸
                  </button>
                  <div className="font-mono text-[10px] text-[#3D6B60] mt-[3px]">
                    Capture
                  </div>
                </div>
                <button
                  onClick={stopCamera}
                  className="px-3.5 py-2 rounded-md text-xs font-semibold cursor-pointer border transition-all"
                  style={{
                    background: '#152420',
                    borderColor: 'rgba(0,200,150,0.18)',
                    color: '#7ABFB0',
                  }}
                >
                  ⏹ Stop
                </button>
              </div>
            )}

            {/* After capture */}
            {cameraCaptured && (
              <div>
                <div className="flex gap-2 mb-2.5">
                  <button
                    onClick={retake}
                    className="px-4 py-2.5 rounded-md text-[13px] font-semibold cursor-pointer border transition-all"
                    style={{
                      background: '#3D1209',
                      borderColor: 'rgba(255,91,74,0.3)',
                      color: '#FF5B4A',
                    }}
                  >
                    ↩ Retake
                  </button>
                  <button
                    onClick={classifyCam}
                    disabled={processing}
                    className="flex-1 py-2.5 px-5 rounded-md font-bold text-sm cursor-pointer border-none transition-all"
                    style={{
                      background: '#00C896',
                      color: '#09100F',
                      opacity: processing ? 0.4 : 1,
                    }}
                  >
                    🔬 Classify Pupa
                  </button>
                </div>
                {result && (
                  <button
                    onClick={() => setHeatmapCamVisible(!heatmapCamVisible)}
                    className="w-full py-2 px-4 rounded-md text-[13px] cursor-pointer border transition-all"
                    style={{
                      background: '#152420',
                      borderColor: 'rgba(0,200,150,0.18)',
                      color: '#7ABFB0',
                    }}
                  >
                    🌡 Toggle Grad-CAM Heatmap
                  </button>
                )}
              </div>
            )}

            {/* Processing */}
            {processing && activeTab === 'camera' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div
                  className="w-10 h-10 border-[3px] rounded-full"
                  style={{
                    borderColor: '#003D2E',
                    borderTopColor: '#00C896',
                    animation: 'pv-spin 0.8s linear infinite',
                  }}
                />
                <div className="font-mono text-xs text-[#00C896] text-center">
                  {procStepTexts.map((t, i) => (
                    <span
                      key={i}
                      className="block"
                      style={{
                        opacity: 1,
                        animation: 'pv-fadein 0.3s forwards',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Upload Tab ────────────────────────────── */}
        {activeTab === 'upload' && (
          <div>
            {/* Drop zone */}
            {!uploadImg && (
              <div
                className="border-2 border-dashed rounded-[10px] py-9 px-6 text-center cursor-pointer transition-all relative overflow-hidden"
                style={{ borderColor: '#003D2E' }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#00C896';
                  e.currentTarget.style.background =
                    'rgba(0,200,150,0.15)';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = '#003D2E';
                  e.currentTarget.style.background = 'transparent';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#003D2E';
                  e.currentTarget.style.background = 'transparent';
                  handleDrop(e);
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
                <div className="text-[36px] mb-2.5">📷</div>
                <div className="text-sm text-[#7ABFB0]">
                  Drag & drop a pupa photo, or{' '}
                  <strong className="text-[#00C896]">click to browse</strong>
                </div>
                <div className="font-mono text-xs text-[#3D6B60] mt-1.5">
                  JPEG · PNG · up to 10MB
                </div>
              </div>
            )}

            {/* Preview */}
            {uploadImg && (
              <div className="mt-3.5">
                <div
                  className="relative rounded-[10px] overflow-hidden flex items-center justify-center min-h-[180px]"
                  style={{ background: '#152420' }}
                >
                  <img
                    ref={uploadImgRef}
                    src={uploadImg}
                    alt="Pupa preview"
                    className="w-full max-h-[240px] object-contain"
                  />
                  <canvas
                    ref={heatmapCanvasRef}
                    className="absolute inset-0 w-full h-full transition-opacity duration-600 pointer-events-none"
                    style={{
                      opacity: heatmapVisible ? 0.55 : 0,
                    }}
                  />
                </div>
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  <button
                    onClick={clearUpload}
                    className="px-4 py-2 rounded-md text-[13px] cursor-pointer border transition-all"
                    style={{
                      background: '#152420',
                      borderColor: 'rgba(0,200,150,0.18)',
                      color: '#7ABFB0',
                    }}
                  >
                    ✕ Clear
                  </button>
                  {result && (
                    <button
                      onClick={() => setHeatmapVisible(!heatmapVisible)}
                      className="px-4 py-2 rounded-md text-[13px] cursor-pointer border transition-all"
                      style={{
                        background: '#152420',
                        borderColor: 'rgba(0,200,150,0.18)',
                        color: '#7ABFB0',
                      }}
                    >
                      🌡 Toggle Heatmap
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Processing */}
            {processing && activeTab === 'upload' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div
                  className="w-10 h-10 border-[3px] rounded-full"
                  style={{
                    borderColor: '#003D2E',
                    borderTopColor: '#00C896',
                    animation: 'pv-spin 0.8s linear infinite',
                  }}
                />
                <div className="font-mono text-xs text-[#00C896] text-center">
                  {procStepTexts.map((t, i) => (
                    <span key={i} className="block">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={classifyUpload}
              disabled={!uploadImg || processing}
              className="w-full mt-3.5 py-3 px-5 rounded-md font-bold text-sm cursor-pointer border-none transition-all flex items-center justify-center gap-2"
              style={{
                background: '#00C896',
                color: '#09100F',
                opacity: !uploadImg || processing ? 0.4 : 1,
              }}
            >
              🔬 Analyse Pupa
            </button>
          </div>
        )}

        {/* ── Result Tab ────────────────────────────── */}
        {activeTab === 'result' && (
          <div>
            {!result ? (
              <div className="text-center py-8 text-[#3D6B60] font-mono text-[13px]">
                Capture or upload and analyse an image first
              </div>
            ) : (
              <div
                style={{ animation: 'pv-slideup 0.4s ease' }}
              >
                {/* Verdict */}
                <div
                  className="flex items-center gap-4 p-4 rounded-[10px] mb-3.5"
                  style={{
                    background: result.flagged
                      ? 'rgba(255,91,74,0.1)'
                      : result.label === 'Female'
                      ? 'rgba(0,200,150,0.1)'
                      : 'rgba(245,166,35,0.1)',
                    border: `1.5px solid ${
                      result.flagged
                        ? '#FF5B4A'
                        : result.label === 'Female'
                        ? '#00C896'
                        : '#F5A623'
                    }`,
                  }}
                >
                  <div className="text-[36px] flex-shrink-0">
                    {result.flagged
                      ? '⚠️'
                      : result.label === 'Female'
                      ? '♀'
                      : '♂'}
                  </div>
                  <div>
                    <div
                      className="font-mono text-[28px] font-bold leading-none"
                      style={{
                        color: result.flagged
                          ? '#FF5B4A'
                          : result.label === 'Female'
                          ? '#00C896'
                          : '#F5A623',
                      }}
                    >
                      {result.flagged
                        ? 'Low Confidence'
                        : result.label}
                    </div>
                    <div className="text-[13px] text-[#7ABFB0] mt-1">
                      Confidence: {(result.conf * 100).toFixed(1)}% ·
                      Prediction: {result.label}
                    </div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="my-3.5">
                  <div className="flex justify-between text-xs font-mono text-[#3D6B60] mb-1.5">
                    <span>Confidence</span>
                    <span>{(result.conf * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded overflow-hidden" style={{ background: '#152420' }}>
                    <div
                      className="h-full rounded transition-all duration-1000"
                      style={{
                        width: `${(result.conf * 100).toFixed(1)}%`,
                        background: result.flagged
                          ? 'linear-gradient(90deg, #CC3322, #FF5B4A)'
                          : result.label === 'Female'
                          ? 'linear-gradient(90deg, #00A878, #00C896)'
                          : 'linear-gradient(90deg, #C97B1C, #F5A623)',
                      }}
                    />
                  </div>
                </div>

                {/* Probability grid */}
                <div className="grid grid-cols-2 gap-2 mt-3.5">
                  <div className="p-2.5 rounded-md border" style={{ background: '#152420', borderColor: 'rgba(0,200,150,0.08)' }}>
                    <div className="text-[11px] text-[#3D6B60] font-mono uppercase tracking-wide">
                      ♀ Female
                    </div>
                    <div className="text-xl font-bold font-mono mt-0.5 text-[#00C896]">
                      {(result.female * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-md border" style={{ background: '#152420', borderColor: 'rgba(0,200,150,0.08)' }}>
                    <div className="text-[11px] text-[#3D6B60] font-mono uppercase tracking-wide">
                      ♂ Male
                    </div>
                    <div className="text-xl font-bold font-mono mt-0.5 text-[#F5A623]">
                      {(result.male * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Flag box */}
                <div
                  className="flex items-center gap-2.5 p-2.5 rounded-md mt-2.5 text-[13px]"
                  style={
                    result.flagged
                      ? {
                          background: 'rgba(255,91,74,0.1)',
                          border: '1px solid #FF5B4A',
                          color: '#FF9088',
                        }
                      : {
                          background: 'rgba(0,200,150,0.07)',
                          border: '1px solid #003D2E',
                          color: '#7ABFB0',
                        }
                  }
                >
                  {result.flagged ? (
                    <>
                      ⚠️ <strong>Flagged for manual review</strong> — confidence
                      below 70%. Do not commit this pupa to a bin without expert
                      verification.
                    </>
                  ) : (
                    <>
                      ✓ <strong>High confidence result</strong> — safe to route
                      to {result.label.toLowerCase()} sorting bin.
                    </>
                  )}
                </div>

                {/* Grad-CAM section */}
                <div className="mt-3.5">
                  <div className="font-mono text-[11px] text-[#3D6B60] uppercase tracking-wider mb-2 flex items-center gap-2">
                    Grad-CAM Attention Map
                    <button
                      onClick={() => {
                        if (lastSource === 'camera') {
                          setActiveTab('camera');
                          setTimeout(
                            () => setHeatmapCamVisible(true),
                            100
                          );
                        } else {
                          setActiveTab('upload');
                          setTimeout(
                            () => setHeatmapVisible(true),
                            100
                          );
                        }
                      }}
                      className="font-mono text-[10px] px-2 py-[3px] rounded cursor-pointer border transition-all"
                      style={{
                        background: '#003D2E',
                        borderColor: '#00C896',
                        color: '#00C896',
                      }}
                    >
                      View on Image →
                    </button>
                  </div>
                  <div className="text-xs text-[#3D6B60] leading-relaxed">
                    The heatmap highlights which region of the pupa the model
                    focused on. Red/warm = high attention. Blue/cool = low
                    attention.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Features Tab ───────────────────────────── */}
        {activeTab === 'features' && (
          <div>
            {!result ? (
              <div className="text-center py-8 text-[#3D6B60] font-mono text-[13px]">
                Analyse an image to see extracted features
              </div>
            ) : (
              <div>
                <div className="font-mono text-[11px] text-[#3D6B60] uppercase tracking-wider mb-3">
                  HOG Feature Strengths
                </div>
                <div className="flex flex-col gap-2">
                  {Object.entries(result.features).map(
                    ([name, val]) => (
                      <div key={name} className="flex items-center gap-2.5">
                        <span className="text-xs text-[#7ABFB0] w-[120px] flex-shrink-0 font-mono">
                          {name}
                        </span>
                        <div className="flex-1 h-1.5 rounded overflow-hidden" style={{ background: '#152420' }}>
                          <div
                            className="h-full rounded transition-all duration-1000"
                            style={{
                              width: `${(val * 100).toFixed(0)}%`,
                              background: '#00C896',
                            }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-[#3D6B60] w-8 text-right">
                          {(val * 100).toFixed(0)}%
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Morphometric estimates */}
                <div
                  className="mt-4 p-3 rounded-md border"
                  style={{
                    background: '#152420',
                    borderColor: 'rgba(0,200,150,0.08)',
                  }}
                >
                  <div className="text-[11px] text-[#3D6B60] font-mono mb-2">
                    MORPHOMETRIC ESTIMATES
                  </div>
                  <div className="text-[13px] text-[#7ABFB0] leading-[1.8]">
                    Estimated length:{' '}
                    <strong className="text-[#00C896]">
                      {result.morph.estLength}
                    </strong>
                    <br />
                    Estimated weight:{' '}
                    <strong className="text-[#00C896]">
                      {result.morph.estWeight}
                    </strong>
                    <br />
                    Probable breed:{' '}
                    <strong className="text-[#00C896]">
                      {result.morph.breed}
                    </strong>
                    <br />
                    Development stage:{' '}
                    <strong className="text-[#00C896]">
                      {result.morph.devStage}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden capture canvas */}
      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
}
