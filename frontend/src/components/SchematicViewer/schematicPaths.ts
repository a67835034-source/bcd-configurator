// SVG path geometry ported verbatim from 0711檔案.html (~line 334-408).
// This is static presentation data (line-art outlines), not product data,
// so it lives in the frontend rather than the database.
//
// NOTE: the three background photos (<img> inside each .illu) were inlined
// as base64 data URIs in the legacy file (~36-39k chars each). Extract them
// to real files and drop them at the paths below - do not re-inline base64
// into the bundle.
//
// The legacy dimension rulers (arrow + "65cm"/"20cm"/"43cm" labels) are
// intentionally not ported: this viewer's only job is "which item did the
// customer pick, and how do the colors look together" - not a spec sheet.

export interface PartPathDef {
  d: string;
  fillRule?: 'evenodd';
}

export interface PartDef {
  part: string; // matches data-part in the legacy markup, and Step.part for steps 01-04
  paths: PartPathDef[]; // >1 when a part is drawn as multiple <path> (e.g. left/right weight pockets)
}

export interface ViewDef {
  index: number;
  name: string;
  viewBox: string;
  imageSrc: string;
  parts: PartDef[];
}

export const VIEWS: ViewDef[] = [
  {
    index: 0,
    name: '正面・背帶側',
    viewBox: '0 0 220 560',
    imageSrc: '/images/schematic/view-0-front.jpg',
    parts: [
      {
        part: 'wing',
        paths: [
          {
            fillRule: 'evenodd',
            d: 'M30 300 C14 225 12 130 30 80 C55 25 92 14 110 14 C152 12 192 36 201 90 C213 142 208 232 190 300 C185 320 176 330 166 326 L160 252 C170 182 168 112 150 76 L70 76 C52 112 50 182 58 252 L52 326 C42 332 34 318 30 300 Z',
          },
        ],
      },
      {
        part: 'backplate',
        paths: [{ d: 'M72 80 L148 80 C162 118 165 190 156 258 L149 320 L72 320 L63 258 C54 190 57 118 72 80 Z' }],
      },
      {
        part: 'weight',
        paths: [
          { d: 'M14 338 C8 372 16 406 36 416 C56 424 70 406 66 376 C62 350 46 334 30 332 Z' },
          { d: 'M206 334 C212 368 206 402 186 412 C166 420 152 402 155 372 C159 346 174 330 190 328 Z' },
        ],
      },
    ],
  },
  {
    index: 1,
    name: '側面',
    viewBox: '0 0 311 560',
    imageSrc: '/images/schematic/view-1-side.jpg',
    parts: [
      {
        part: 'wing',
        paths: [
          {
            d: 'M196 62 C242 76 262 142 260 232 C258 332 244 432 218 492 C202 524 176 526 166 500 C152 460 150 380 152 300 C154 210 160 122 172 82 C180 62 188 58 196 62 Z',
          },
        ],
      },
      {
        part: 'backplate',
        paths: [{ d: 'M120 120 L148 116 L152 380 L126 386 Z' }],
      },
      {
        part: 'weight',
        paths: [
          {
            d: 'M60 442 C46 456 44 490 58 508 C72 524 96 522 106 504 C114 488 108 462 94 450 C82 440 70 436 60 442 Z',
          },
        ],
      },
    ],
  },
  {
    index: 2,
    name: '背面・氣瓶側',
    viewBox: '0 0 401 560',
    imageSrc: '/images/schematic/view-2-back.jpg',
    parts: [
      {
        part: 'wing',
        paths: [
          {
            fillRule: 'evenodd',
            d: 'M200 32 C300 28 358 96 362 202 C366 312 340 432 286 496 C240 540 152 542 106 500 C56 450 38 330 46 210 C53 100 112 34 200 32 Z M172 112 L242 108 Q256 108 257 122 L262 408 Q262 422 248 423 L178 427 Q164 427 163 413 L158 126 Q158 112 172 112 Z M92 142 L332 128 L336 202 L96 218 Z M84 292 L324 278 L328 352 L88 368 Z',
          },
        ],
      },
      {
        part: 'sta',
        paths: [
          {
            d: 'M172 112 L242 108 Q256 108 257 122 L262 408 Q262 422 248 423 L178 427 Q164 427 163 413 L158 126 Q158 112 172 112 Z',
          },
        ],
      },
      {
        part: 'tank-a',
        paths: [{ d: 'M92 142 L332 128 L336 202 L96 218 Z' }],
      },
      {
        part: 'tank-b',
        paths: [{ d: 'M84 292 L324 278 L328 352 L88 368 Z' }],
      },
    ],
  },
];
