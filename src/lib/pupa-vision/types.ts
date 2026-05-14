export interface ClassificationResult {
  label: 'Female' | 'Male';
  female: number;
  male: number;
  conf: number;
  flagged: boolean;
  features: Record<string, number>;
  morph: {
    estLength: string;
    estWeight: string;
    breed: string;
    devStage: string;
  };
}

export interface HistoryEntry {
  src: string;
  result: ClassificationResult;
}

export interface BatchResult extends ClassificationResult {
  filename: string;
}

export type LastSource = 'upload' | 'camera';
