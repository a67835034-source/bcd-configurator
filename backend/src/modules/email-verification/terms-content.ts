interface TermsBullet {
  lead: string;
  rest: string;
}

interface TermsSection {
  title: string;
  paragraphs?: string[];
  bullets?: TermsBullet[];
}

// Mirrors frontend/src/components/Checkout/TermsAgreement.tsx's TERMS
// constant - the checkout page's checkbox-gated terms are duplicated here
// (rather than imported, since backend/frontend are separate TS projects
// with no shared package) so the same wording can be appended to the order
// confirmation email. Keep the two in sync when either is edited.
export const TERMS: TermsSection[] = [
  {
    title: '一、專屬面交服務與免費 Fundive 裝備調校',
    paragraphs: ['為確保每件客製化 BCD 都能完美貼合您的身型與潛水習慣，本工作室僅提供「親自面交」服務，不提供物流寄送。'],
    bullets: [
      { lead: '免費專屬 Fundive：', rest: '凡購買整組 BCD 之潛水員，交貨時將由教練免費招待一支 Fundive。' },
      {
        lead: '下水實測與微調：',
        rest: '我們將利用這支 Fundive，親自為您進行水下的配重測試、織帶長度微調、以及 D 環位置校正。確認各項充排氣作動順暢，且裝備達到最佳的流線型與舒適度後，才算正式完成點交。',
      },
      {
        lead: '面交預約方式：',
        rest: '請透過 Fundive 預約系統完成面交場次預約，並同步將您的訂單編號提供予本工作室 LINE 官方帳號，以便我們核對訂單並安排教練與裝備。',
      },
    ],
  },
  {
    title: '二、客製化商品退換貨規範（七日猶豫期排除條款）',
    paragraphs: [
      '本工作室之 BCD 皆為依照您個人需求與喜好量身配置之「客製化給付」商品。依據《消費者保護法》第19條規定，客製化商品不適用於「七日猶豫期（鑑賞期）」之規範。',
      '訂單一經確認並進入叫貨或組裝排程後，恕不接受以「改變心意」、「顏色與預期不同」等非產品瑕疵之理由要求取消訂單、退貨或換貨。',
      '請於送出訂單及匯款前，務必再次確認您的配色、規格與零件選項。',
    ],
  },
  {
    title: '三、6 個月安心保固與「換新」承諾',
    paragraphs: ['我們對出貨的裝備品質具有絕對信心。凡於本工作室購買之「整組 BCD」，皆享有自 Fundive 點交當日起算 6 個月之裝備保固。'],
    bullets: [
      {
        lead: '瑕疵直接換新：',
        rest: '保固期間內，若因產品本身製造工藝或材質問題導致之明顯故障或瑕疵（例如：氣囊接縫處漏氣、充排氣閥卡死、金屬件非人為異常生鏽），經判定非人為因素後，一律以「更換全新同款零件」為原則，不以修補方式妥協，以最高標準確保您的潛水安全。',
      },
      {
        lead: '檢修流程：',
        rest: '發現異常時，請立即停止使用該裝備下水。請備妥「訂單編號」及「瑕疵處之清晰照片或影片」，透過 LINE 官方帳號與我們聯繫，我們將優先為您安排檢測與換新作業。',
      },
    ],
  },
  {
    title: '四、非保固範圍（人為與環境耗損）',
    paragraphs: ['潛水裝備會因使用習慣與保養方式而影響壽命，以下情況恕不涵蓋於免費保固範圍內，但我們仍提供付費檢修與零件替換服務：'],
    bullets: [
      {
        lead: '未依正常程序保養：',
        rest: '潛水後未以清水徹底沖洗內部氣囊與金屬件、洗後未陰乾而導致之發霉，或長時間曝曬於烈日下導致之材質老化與褪色。',
      },
      {
        lead: '人為損壞與疏失：',
        rest: '因不當拉扯、利刃割傷、水下礁石過度摩擦、岸上拖行導致之破損，或氣瓶未綁緊導致重摔之損壞。',
      },
      { lead: '未經授權之改裝：', rest: '自行拆解、改裝或更換非本工作室提供之第三方零件，導致原廠結構受損。' },
      {
        lead: '正常消耗：',
        rest: 'O-ring（防水橡膠圈）正常老化、氣囊表布正常褪色、金屬配件於正常使用下產生之微小刮痕與使用痕跡。',
      },
    ],
  },
  {
    title: '五、顯示色彩差異聲明',
    paragraphs: [
      '本平台展示之各式配色（線材、鋁合金線軸、氣瓶板等）皆以實體拍攝之照片為準，惟不同裝置之螢幕色彩校正、亮度設定不盡相同，實際到貨顏色可能與您螢幕上顯示之色澤產生些微落差。',
    ],
    bullets: [
      { lead: '色差非瑕疵：', rest: '此屬螢幕顯示之正常現象，不列入本工作室保固或退換貨範圍。' },
      { lead: '如有疑慮：', rest: '下單前歡迎透過 LINE 官方帳號索取實品照片或詢問教練，確認色澤後再行選色。' },
    ],
  },
  {
    title: '六、逾期未匯款之訂單處理',
    paragraphs: ['訂單成立後，請依通知期限（原則為 3 日）內完成匯款，以利安排叫貨與組裝排程。'],
    bullets: [
      {
        lead: '逾期視為放棄：',
        rest: '逾期未完成匯款，亦未主動與我們聯繫者，視為放棄本次訂單，恕不保留已排定之叫貨與組裝順序，需重新下單。',
      },
      {
        lead: '展延申請：',
        rest: '如有特殊原因需要延長匯款期限，請於期限內主動透過 LINE 官方帳號告知，我們將盡力協助保留您的訂單。',
      },
    ],
  },
  {
    title: '七、個人資料使用聲明',
    paragraphs: [
      '您於結帳時提供之姓名、電子郵件、LINE ID／聯絡電話等個人資料，僅用於本次訂單之聯繫確認、裝備客製化製作，以及後續保固服務之核對。',
    ],
    bullets: [
      { lead: '不作其他用途：', rest: '本工作室不會將您的個人資料提供、販售予第三方，亦不會用於本訂單以外之行銷用途。' },
    ],
  },
  {
    title: '八、潛水資格與活動風險聲明',
    paragraphs: [
      '潛水為具有一定風險之休閒活動，本商品雖經嚴格把關製造與組裝品質，仍需搭配使用者本身之資格、體能狀態與正確操作，方能發揮應有之保護作用。',
    ],
    bullets: [
      {
        lead: '資格要求：',
        rest: '本商品僅供領有合格潛水證照（或於合格教練監督下受訓中）之潛水員，依其受訓範圍與經驗使用，請勿從事超出個人資格與能力範圍之潛水活動（如深潛、洞潛、沉船潛水等進階活動）。',
      },
      {
        lead: '下水前自我檢查：',
        rest: '每次下水前，請自行確認裝備各項扣具、充排氣閥、織帶鬆緊皆正常運作；若發現任何異常，請立即停止下水，並依第三條檢修流程與我們聯繫。',
      },
      {
        lead: '健康與體能狀況：',
        rest: '潛水員應自行確保健康狀況（如心肺功能、有無感冒或身體不適）適合下水，本工作室不對因個人體能、疾病或身體狀況所引發之潛水意外負責。',
      },
      {
        lead: '遵守潛水規範：',
        rest: '請確實遵守潛水電腦錶／潛水表之免減壓極限、安全停留、上升速度等專業潛水規範，並全程與潛伴同行；未遵守前述規範所生之意外或損害，不在本裝備之保固與服務範圍內。',
      },
      {
        lead: '第三方組裝或改裝：',
        rest: '裝備如經非本工作室人員拆解、改裝或維修，本工作室不對其後續之安全性與功能表現負責（另見第四條「未經授權之改裝」）。',
      },
      {
        lead: '保固範圍界定：',
        rest: '本工作室僅就裝備本身之製造品質負保固責任（詳見第三、四條），不對潛水活動過程中因個人操作、體能狀況、天候、海況或其他環境因素所生之風險、意外、人身傷害或財產損失負責。',
      },
    ],
  },
  {
    title: '九、條款解釋與其他事項',
    paragraphs: [
      '本服務條款如有未盡事宜，或因活動內容、法規異動而需調整，本工作室保留隨時修訂本條款之權利，修訂後將公告於本平台，不另行個別通知，請留意最新版本內容。',
    ],
    bullets: [
      { lead: '最終解釋權：', rest: '本條款之解釋與適用範圍，如有疑義或爭議，以本工作室之解釋為最終依據。' },
      { lead: '條款效力：', rest: '若本條款中任一約定經認定無效或不可執行，不影響其餘條款之效力，其餘部分仍繼續有效。' },
    ],
  },
];

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Renders TERMS as a plain HTML block for the order confirmation email -
// unlike the checkout page's scrollable box, email clients render the full
// height inline (no JS, unreliable overflow support), so this is just the
// whole thing, top to bottom.
export function buildTermsHtml(): string {
  const sections = TERMS.map((section) => {
    const paragraphs = (section.paragraphs ?? [])
      .map((p) => `<p style="margin:0 0 6px;">${escHtml(p)}</p>`)
      .join('');
    const bullets = section.bullets
      ? `<ul style="margin:6px 0 0;padding-left:18px;">${section.bullets
          .map((b) => `<li style="margin-bottom:6px;"><strong>${escHtml(b.lead)}</strong>${escHtml(b.rest)}</li>`)
          .join('')}</ul>`
      : '';
    return `<div style="margin-bottom:14px;">
      <div style="font-weight:bold;margin-bottom:4px;">${escHtml(section.title)}</div>
      ${paragraphs}
      ${bullets}
    </div>`;
  }).join('');

  return `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:11.5px;line-height:1.6;color:#667c83;">
      <div style="font-weight:bold;color:#132228;margin-bottom:10px;">服務條款</div>
      ${sections}
    </div>
  `;
}
