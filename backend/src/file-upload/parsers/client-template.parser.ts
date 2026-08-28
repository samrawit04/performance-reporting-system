import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  FileParser,
  ParsedEntry,
  ParsedPerformanceData,
} from './parser.interface';
import { BscPerspective } from '../../common/constants/enums';

@Injectable()
export class ClientTemplateParser implements FileParser {
  async canParse(filename: string): Promise<boolean> {
    const ext = filename.toLowerCase();
    return ext.endsWith('.xlsx') || ext.endsWith('.xls');
  }

  async parse(buffer: Buffer): Promise<ParsedPerformanceData> {
    const workbook = new ExcelJS.Workbook();
    // @ts-ignore
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return {
        entries: [],
        warnings: [],
        errors: ['The uploaded workbook contains no worksheets.'],
        totalRows: 0,
        validRows: 0,
      };
    }

    const warnings: string[] = [];
    const errors: string[] = [];
    const entries: ParsedEntry[] = [];

    // Map column headers to index
    let headerRowIndex = -1;
    const colMap: Record<string, number> = {};

    worksheet.eachRow((row, rowNumber) => {
      if (headerRowIndex !== -1) return; // already found

      const values = (row.values as any[]).map((v) =>
        v ? String(v).trim().toLowerCase() : '',
      );

      const hasPerspective = values.some((v) => v.includes('perspective'));
      const hasObjective = values.some((v) => v.includes('objective'));
      const hasPlan = values.some((v) => v.includes('plan'));
      const hasActual = values.some((v) => v.includes('actual'));

      if (hasPerspective && hasObjective && (hasPlan || hasActual)) {
        headerRowIndex = rowNumber;
        values.forEach((v, idx) => {
          if (v.includes('perspective')) colMap['perspective'] = idx;
          else if (v.includes('objective')) colMap['objective'] = idx;
          else if (v.includes('measurement') || v.includes('measure'))
            colMap['measurement'] = idx;
          else if (v.includes('unit')) colMap['unit'] = idx;
          else if (v.includes('plan')) colMap['plan'] = idx;
          else if (v.includes('actual')) colMap['actual'] = idx;
          else if (v.includes('note')) colMap['notes'] = idx;
        });
      }
    });

    if (headerRowIndex === -1) {
      return {
        entries: [],
        warnings: [],
        errors: [
          'Could not find header row. Expected columns: Perspective, Objective, Measurement, Unit, Plan, Actual, Notes.',
        ],
        totalRows: 0,
        validRows: 0,
      };
    }

    // Perspective standardizer
    const normalizePerspective = (raw: string): BscPerspective | null => {
      const clean = raw.toLowerCase().trim();
      if (clean.includes('finan')) return BscPerspective.FINANCIAL;
      if (clean.includes('cust')) return BscPerspective.CUSTOMER;
      if (clean.includes('process') || clean.includes('internal'))
        return BscPerspective.INTERNAL_PROCESS;
      if (
        clean.includes('learn') ||
        clean.includes('growth') ||
        clean.includes('people')
      )
        return BscPerspective.LEARNING_GROWTH;
      return null;
    };

    let totalRows = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;

      const getCellVal = (key: string): string => {
        const idx = colMap[key];
        if (!idx) return '';
        const cell = row.getCell(idx);
        if (cell.value === null || cell.value === undefined) return '';
        if (typeof cell.value === 'object' && 'result' in cell.value) {
          return String(cell.value.result ?? '').trim();
        }
        if (typeof cell.value === 'object' && 'text' in cell.value) {
          return String(cell.value.text ?? '').trim();
        }
        return String(cell.value).trim();
      };

      const rawPerspective = getCellVal('perspective');
      const rawObjective = getCellVal('objective');
      const rawMeasurement = getCellVal('measurement');
      const rawUnit = getCellVal('unit');
      const rawPlan = getCellVal('plan');
      const rawActual = getCellVal('actual');
      const rawNotes = getCellVal('notes');

      // Skip empty row
      if (
        !rawPerspective &&
        !rawObjective &&
        !rawPlan &&
        !rawActual &&
        !rawMeasurement
      ) {
        return;
      }

      totalRows++;

      // Validations
      const perspective = normalizePerspective(rawPerspective);
      if (!perspective) {
        errors.push(
          `Row ${rowNumber}: Invalid perspective "${rawPerspective}". Must be Financial, Customer, Internal Process, or Learning & Growth.`,
        );
        return;
      }

      if (!rawObjective) {
        errors.push(`Row ${rowNumber}: Objective cannot be empty.`);
        return;
      }

      const planVal = parseFloat(rawPlan.replace(/[^0-9.-]/g, ''));
      if (isNaN(planVal) || planVal <= 0) {
        errors.push(
          `Row ${rowNumber}: Plan value "${rawPlan}" is invalid. Must be a positive number.`,
        );
        return;
      }

      const actualVal = parseFloat(rawActual.replace(/[^0-9.-]/g, ''));
      if (isNaN(actualVal) || actualVal < 0) {
        errors.push(
          `Row ${rowNumber}: Actual value "${rawActual}" is invalid. Must be a number >= 0.`,
        );
        return;
      }

      entries.push({
        perspective,
        objective: rawObjective,
        measurement: rawMeasurement || 'Standard metric',
        unit: rawUnit || 'units',
        plan_value: planVal,
        actual_value: actualVal,
        notes: rawNotes || undefined,
        raw_row: rowNumber,
      });
    });

    if (entries.length === 0 && errors.length === 0) {
      errors.push('The worksheet contains no data rows below the header.');
    }

    return {
      entries,
      warnings,
      errors,
      totalRows,
      validRows: entries.length,
    };
  }
}
