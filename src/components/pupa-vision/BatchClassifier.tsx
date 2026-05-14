'use client';

import { useState, useCallback } from 'react';
import { BatchResult } from '@/lib/pupa-vision/types';
import { simulateClassification } from '@/lib/pupa-vision/classify';

type BatchTab = 'upload' | 'results';

export function BatchClassifier() {
  const [activeTab, setActiveTab] = useState<BatchTab>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBatchUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = Array.from(e.target.files || []);
      if (!fileList.length) return;
      setFiles(fileList);
      setResults([]);

      const previews: string[] = [];
      let loaded = 0;
      fileList.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previews.push(ev.target?.result as string);
          loaded++;
          if (loaded === fileList.length) {
            setFilePreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    []
  );

  const clearBatch = useCallback(() => {
    setFiles([]);
    setFilePreviews([]);
    setResults([]);
    setProgress(0);
  }, []);

  const runBatch = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(0);
    const batchResults: BatchResult[] = [];

    for (let i = 0; i < files.length; i++) {
      await new Promise((res) =>
        setTimeout(res, 280 + Math.random() * 200)
      );
      const result = simulateClassification(files[i].name + i);
      batchResults.push({ filename: files[i].name, ...result });
      setProgress(((i + 1) / files.length) * 100);
      setResults([...batchResults]);
    }

    setProcessing(false);
    setActiveTab('results');
  }, [files]);

  const exportCSV = useCallback(() => {
    let csv =
      'filename,prediction,female_prob,male_prob,confidence,flagged_for_review\n';
    results.forEach((r) => {
      csv += `"${r.filename}","${r.label}",${(r.female * 100).toFixed(1)}%,${(r.male * 100).toFixed(1)}%,${(r.conf * 100).toFixed(1)}%,${r.flagged}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pupa_classification_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  // Compute summary
  const females = results.filter((r) => r.label === 'Female' && !r.flagged);
  const males = results.filter((r) => r.label === 'Male' && !r.flagged);
  const flagged = results.filter((r) => r.flagged);
  const avgConf =
    results.length > 0
      ? results.reduce((a, r) => a + r.conf, 0) / results.length
      : 0;

  const tabs: { key: BatchTab; label: string }[] = [
    { key: 'upload', label: 'Upload Batch' },
    { key: 'results', label: 'Results' },
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
          style={{ background: '#3D2900' }}
        >
          📦
        </div>
        <div>
          <div className="text-sm font-bold">Batch Classifier</div>
          <div className="font-mono text-[11px] text-[#3D6B60]">
            Multiple pupae · CSV export
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
              color: activeTab === tab.key ? '#00C896' : '#3D6B60',
              borderBottomColor:
                activeTab === tab.key ? '#00C896' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* ── Upload Tab ────────────────────────────── */}
        {activeTab === 'upload' && (
          <div>
            {/* Drop zone */}
            <div
              className="border-2 border-dashed rounded-[10px] py-7 px-5 text-center cursor-pointer transition-all relative"
              style={{ borderColor: '#3D2900' }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#F5A623';
                e.currentTarget.style.background =
                  'rgba(245,166,35,0.05)';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = '#3D2900';
                e.currentTarget.style.background = 'transparent';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#3D2900';
                e.currentTarget.style.background = 'transparent';
                const dtFiles = Array.from(e.dataTransfer.files);
                if (dtFiles.length) {
                  const fakeEvent = {
                    target: { files: e.dataTransfer.files },
                  } as React.ChangeEvent<HTMLInputElement>;
                  handleBatchUpload(fakeEvent);
                }
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBatchUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
              <div className="text-[28px] mb-2">📁</div>
              <div className="text-sm text-[#7ABFB0]">
                Select{' '}
                <strong className="text-[#F5A623]">
                  multiple pupa images
                </strong>
              </div>
              <div className="font-mono text-xs text-[#3D6B60] mt-1">
                Ctrl+Click to select many files
              </div>
            </div>

            {/* Queue */}
            {files.length > 0 && (
              <div className="mt-3.5 flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md border text-[13px]"
                    style={{
                      background: '#152420',
                      borderColor: 'rgba(0,200,150,0.08)',
                    }}
                  >
                    {filePreviews[i] && (
                      <img
                        src={filePreviews[i]}
                        alt=""
                        className="w-8 h-8 rounded object-cover flex-shrink-0 border"
                        style={{
                          borderColor: 'rgba(0,200,150,0.08)',
                        }}
                      />
                    )}
                    <span className="flex-1 text-[#7ABFB0] font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                      {file.name}
                    </span>
                    {results[i] ? (
                      <span
                        className="font-mono text-xs font-bold"
                        style={{
                          color: results[i].flagged
                            ? '#FF5B4A'
                            : results[i].label === 'Female'
                            ? '#00C896'
                            : '#F5A623',
                        }}
                      >
                        {results[i].flagged
                          ? `⚠ ${(results[i].conf * 100).toFixed(0)}%`
                          : `${
                              results[i].label === 'Female' ? '♀' : '♂'
                            } ${(results[i].conf * 100).toFixed(0)}%`}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-[#3D6B60]">
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Progress bar */}
            {processing && (
              <div className="mt-3 rounded overflow-hidden h-1" style={{ background: '#152420' }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background:
                      'linear-gradient(90deg, #00A878, #00C896)',
                  }}
                />
              </div>
            )}

            {/* Controls */}
            {files.length > 0 && (
              <div className="flex gap-2 mt-3.5 flex-wrap">
                <button
                  onClick={runBatch}
                  disabled={processing}
                  className="flex-1 py-3 px-5 rounded-md font-bold text-sm cursor-pointer border-none transition-all"
                  style={{
                    background: '#00C896',
                    color: '#09100F',
                    opacity: processing ? 0.4 : 1,
                  }}
                >
                  ⚡ Run Batch Classification
                </button>
                <button
                  onClick={clearBatch}
                  className="px-4 py-2 rounded-md text-[13px] cursor-pointer border transition-all"
                  style={{
                    background: '#152420',
                    borderColor: 'rgba(0,200,150,0.18)',
                    color: '#7ABFB0',
                  }}
                >
                  ✕ Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Results Tab ───────────────────────────── */}
        {activeTab === 'results' && (
          <div>
            {results.length === 0 ? (
              <div className="text-center py-8 text-[#3D6B60] font-mono text-[13px]">
                Run a batch to see results here
              </div>
            ) : (
              <>
                {/* Summary */}
                <div
                  className="p-3 rounded-md border mb-3"
                  style={{
                    background: '#152420',
                    borderColor: 'rgba(0,200,150,0.08)',
                  }}
                >
                  <div className="font-mono text-[11px] text-[#3D6B60] uppercase tracking-wider mb-2">
                    Batch Summary
                  </div>
                  <div className="flex justify-between text-[13px] py-[3px]">
                    <span>Total classified</span>
                    <span className="font-mono font-bold">
                      {results.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px] py-[3px]">
                    <span>Female 🟢</span>
                    <span className="font-mono font-bold text-[#00C896]">
                      {females.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px] py-[3px]">
                    <span>Male 🟡</span>
                    <span className="font-mono font-bold text-[#F5A623]">
                      {males.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px] py-[3px]">
                    <span>Flagged for review ⚠️</span>
                    <span className="font-mono font-bold text-[#FF5B4A]">
                      {flagged.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px] py-[3px]">
                    <span>Avg. confidence</span>
                    <span className="font-mono font-bold">
                      {(avgConf * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Result list */}
                <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto mt-3">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md border text-[13px]"
                      style={{
                        background: '#152420',
                        borderColor: 'rgba(0,200,150,0.08)',
                      }}
                    >
                      <span className="flex-1 text-[#7ABFB0] font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {r.filename}
                      </span>
                      <span
                        className="font-mono text-xs font-bold"
                        style={{
                          color: r.flagged
                            ? '#FF5B4A'
                            : r.label === 'Female'
                            ? '#00C896'
                            : '#F5A623',
                        }}
                      >
                        {r.flagged
                          ? `⚠ Low conf (${(r.conf * 100).toFixed(0)}%)`
                          : `${r.label === 'Female' ? '♀ Female' : '♂ Male'} — ${(r.conf * 100).toFixed(0)}%`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Export */}
                <button
                  onClick={exportCSV}
                  className="w-full mt-3 py-2 px-4 rounded-md text-[13px] cursor-pointer border transition-all"
                  style={{
                    background: '#152420',
                    borderColor: 'rgba(0,200,150,0.18)',
                    color: '#7ABFB0',
                  }}
                >
                  ⬇ Download CSV
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
