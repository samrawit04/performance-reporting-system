import { BscPerspective } from '../../common/constants/enums';

export interface ParsedEntry {
  perspective: BscPerspective;
  objective: string;
  deliverable?: string;
  measurement: string;
  unit: string;
  weight?: number;
  plan_value: number;
  actual_value: number;
  notes?: string;
  raw_row?: number;
}

export interface ParsedPerformanceData {
  entries: ParsedEntry[];
  warnings: string[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export interface FileParser {
  canParse(filename: string, buffer: Buffer): Promise<boolean>;
  parse(buffer: Buffer): Promise<ParsedPerformanceData>;
}
