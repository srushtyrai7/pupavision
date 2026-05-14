'use client';

import { useState, useCallback } from 'react';
import { SiteHeader } from '@/components/pupa-vision/SiteHeader';
import { HeroSection } from '@/components/pupa-vision/HeroSection';
import { InfoCards } from '@/components/pupa-vision/InfoCards';
import { SingleClassifier } from '@/components/pupa-vision/SingleClassifier';
import { BatchClassifier } from '@/components/pupa-vision/BatchClassifier';
import { SessionHistory } from '@/components/pupa-vision/SessionHistory';
import { SiteFooter } from '@/components/pupa-vision/SiteFooter';
import { ClassificationResult, HistoryEntry } from '@/lib/pupa-vision/types';

export default function Home() {
  const [pipelineStep, setPipelineStep] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleResult = useCallback(
    (src: string, result: ClassificationResult) => {
      setHistory((prev) => [...prev, { src, result }]);
    },
    []
  );

  return (
    <div className="min-h-screen flex flex-col relative">
      <SiteHeader />
      <HeroSection pipelineStep={pipelineStep} />
      <InfoCards />

      {/* Main Grid */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-2 gap-5">
        <SingleClassifier
          pipelineStep={pipelineStep}
          onPipelineStep={setPipelineStep}
          onResult={handleResult}
        />
        <BatchClassifier />
        <SessionHistory history={history} />
      </div>

      <SiteFooter />
    </div>
  );
}
