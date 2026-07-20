// Response shapes intentionally mirror the legacy frontend's STEPS array
// (see 0711檔案.html) field-for-field, so the new API is a drop-in data
// source with no frontend rendering changes required.

export interface StepGroupDto {
  id: string; // was groups[].id, e.g. "18"
  label: string; // e.g. "18LBS"
  tagline?: string; // short buyer-guidance label, e.g. "輕便優先"
  recommendation?: string; // one-sentence "who this is for"
  parentLabel?: string; // groups sharing this collapse into one tab, e.g. STA's 3 alu specs -> "鋁板"
}

export interface OptionResponseDto {
  id: string; // sku_code, e.g. "w18-black"
  group?: string; // parent option_groups.group_code, if any
  name: string;
  priceRMB: number;
  weight: number | null;
  capacity?: number;
  badge?: string;
  def?: boolean;
  img?: string; // full product photo -> large tile (e.g. tank band)
  swatchImg?: string; // cropped fabric/pattern texture -> small chip (e.g. leopard/floral)
}

export interface StepResponseDto {
  id: string; // step_code, e.g. "wing"
  num: string; // zero-padded step_number, e.g. "01"
  part: string; // part_key
  title: string;
  sub?: string;
  desc?: string;
  note?: string; // short disclaimer near the title, e.g. weight-calculation caveat
  referenceImage?: string; // illustrative photo shown alongside the option grid
  referenceImageCaption?: string;
  groups?: StepGroupDto[]; // omitted entirely for ungrouped steps (e.g. tank)
  specNote?: Record<string, string>;
  options: OptionResponseDto[];
}
