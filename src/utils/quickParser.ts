import type { ParsedQuickTransaction, TransactionCategory } from "../types";

interface KeywordRule {
  category: TransactionCategory;
  keywords: string[];
}

const CATEGORY_RULES: KeywordRule[] = [
  {
    category: "Food",
    keywords: [
      "กะเพรา", "ข้าว", "ข้าวผัด", "ข้าวแกง", "ข้าวเหนียว", "ข้าวสาร", "ผัดไทย", "ก๋วยเตี๋ยว", "ก๋วยจั๊บ",
      "ส้มตำ", "ไก่ทอด", "กาแฟ", "ชา", "ชานม", "ขนม", "อาหาร", "หมูกระทะ", "บุฟเฟต์", "ชาบู", "หม่าล่า",
      "สเต็ก", "เบอร์เกอร์", "พิซซ่า", "น้ำ", "น้ำเปล่า", "น้ำผลไม้", "น้ำอัดลม", "เป๊ปซี่", "โค้ก", "ไอติม",
      "บิงซู", "เบเกอรี่", "ขนมปัง", "ผลไม้", "กับข้าว", "ต้มยำ", "เค้ก", "ไข่", "ไข่ไก่", "ไข่เป็ด",
      "หมู", "หมูสับ", "หมูกรอบ", "ไก่", "เนื้อ", "ปลา", "กุ้ง", "ผัก", "ผักสด", "เนย", "ชีส",
      "น้ำมันพืช", "น้ำมันหอย", "น้ำมันงา", "ซอส", "น้ำปลา", "น้ำตาล", "เครื่องปรุง", "สลัด", "แซนวิช",
      "เบนโตะ", "เซเว่น", "7-11", "7-eleven", "tops", "bigc", "lotus", "lotuss", "gourmet",
      "grabfood", "lineman", "shopeefood", "robinhood", "foodpanda", "starbucks", "amazon",
      "cafe", "coffee", "tea", "lunch", "dinner", "breakfast", "meal", "restaurant", "snack",
      "drink", "pizza", "burger", "noodle", "sushi", "bakery", "grocery", "groceries", "market",
      "food", "kfc", "mcdonald", "bonchon", "mk", "sizzler", "yayoi", "fuji", "after you",
      "pepsi", "coke", "salad", "sandwich", "bento", "soda", "ต้มแซ่บ", "ลาบ", "น้ำตก", "แกงเขียวหวาน",
      "แกงส้ม", "ราเมง", "ramen"
    ],
  },
  {
    category: "Transport",
    keywords: [
      "bts", "mrt", "arl", "srt", "brt", "รถเมล์", "แท็กซี่", "แท๊กซี่", "วิน", "มอเตอร์ไซค์",
      "มอไซค์", "สองแถว", "grab", "bolt", "indrive", "line man taxi", "lineman taxi", "น้ำมัน",
      "เติมน้ำมัน", "ปั๊ม", "gas", "fuel", "ทางด่วน", "ค่าทางด่วน", "ค่าผ่านทาง", "easy pass",
      "m-pass", "m-flow", "mflow", "ที่จอดรถ", "ค่าจอด", "ตั๋วเครื่องบิน", "สายการบิน", "รถไฟ",
      "เรือ", "เรือด่วน", "เรือคลอง", "รถตู้", "ซ่อมรถ", "ล้างรถ", "ประกันรถ", "ยางรถ", "transport",
      "transit", "taxi", "toll", "parking", "flight", "petrol", "train", "bus", "subway",
      "commute", "shell", "ptt", "caltex", "bcp", "bangchak", "esso", "airasia", "nokair",
      "vietjet", "ev charge", "การบินไทย"
    ],
  },
  {
    category: "Home",
    keywords: [
      "ค่าเช่า", "เช่าห้อง", "ค่าห้อง", "คอนโด", "บ้าน", "ค่าน้ำ", "ค่าไฟ", "ไฟฟ้า", "ประปา",
      "ค่าเน็ต", "อินเทอร์เน็ต", "เน็ตบ้าน", "wifi", "internet", "ส่วนกลาง", "ค่าส่วนกลาง",
      "ซ่อมบ้าน", "ล้างแอร์", "ซ่อมแอร์", "ทำความสะอาด", "แม่บ้าน", "ซักผ้า", "ผงซักฟอก",
      "น้ำยาปรับผ้านุ่ม", "ทิชชู่", "กระดาษทิชชู่", "หลอดไฟ", "ของใช้ในบ้าน", "rent", "utilities",
      "electricity", "water", "maintenance", "cleaning", "laundry", "condo", "apartment",
      "ikea", "homepro", "mr.diy", "mr diy", "ไทวัสดุ", "index living mall", "dohome", "furniture", "household",
      "3bb", "ais fibre", "true online"
    ],
  },
  {
    category: "Health",
    keywords: [
      "ซื้อยา", "ร้านยา", "ยา", "หมอ", "หาหมอ", "โรงพยาบาล", "คลินิก", "ทำฟัน", "จัดฟัน",
      "ขูดหินปูน", "อุดฟัน", "แว่นตา", "คอนแทคเลนส์", "ตรวจสุขภาพ", "ตรวจเลือด", "วัคซีน",
      "วิตามิน", "อาหารเสริม", "ฟิตเนส", "ยิม", "fitness", "gym", "yoga", "workout", "massage",
      "นวด", "นวดแผนไทย", "สปา", "medicine", "pharmacy", "hospital", "clinic", "doctor",
      "dental", "health", "medical", "optical", "boots", "watsons", "lab pharmacy", "supplement"
    ],
  },
  {
    category: "Learning",
    keywords: [
      "หนังสือ", "ซื้อหนังสือ", "e-book", "ebook", "meb", "คอร์ส", "อบรม", "สัมมนา", "เรียน",
      "ค่าเทอม", "ติว", "กวดวิชา", "สอบ", "ค่าสอบ", "toefl", "ielts", "toeic", "ใบรับรอง",
      "เครื่องเขียน", "สมุด", "ปากกา", "udemy", "coursera", "skilllane", "edx", "kindle",
      "book", "course", "tuition", "class", "school", "study", "workshop", "exam", "learning",
      "education", "kinokuniya", "se-ed", "naiin", "นายอินทร์"
    ],
  },
  {
    category: "Fun",
    keywords: [
      "หนัง", "ดูหนัง", "โรงหนัง", "netflix", "spotify", "youtube", "disney", "disney+", "hbo",
      "prime", "apple tv", "game", "เกม", "เติมเกม", "steam", "nintendo", "switch", "playstation",
      "ps5", "concert", "คอนเสิร์ต", "คอนเสริต", "ตั๋วคอน", "party", "ปาร์ตี้", "เหล้า", "เบียร์",
      "ผับ", "บาร์", "เที่ยว", "ทริป", "ท่องเที่ยว", "โรงแรม", "ที่พัก", "resort", "hotel",
      "agoda", "booking.com", "karaoke", "เกะ", "trip", "entertainment", "fun", "hobby",
      "vacation", "leisure", "movie", "cinema", "major", "sf", "sf cinema", "arcade"
    ],
  },
  {
    category: "Debt",
    keywords: [
      "ผ่อนคอนโด", "ผ่อนบ้าน", "ผ่อนรถ", "ค่างวดบ้าน", "ค่างวดรถ", "ค่างวด", "กู้ซื้อบ้าน",
      "กู้ซื้อรถ", "บัตรเครดิต", "จ่ายบัตร", "ชำระบัตร", "บัตร", "ผ่อน", "ชำระหนี้", "ดอกเบี้ย",
      "กยศ", "เงินกู้", "สินเชื่อ", "credit card", "loan", "debt", "installment", "interest",
      "mortgage", "repayment", "ktc", "aeon", "first choice", "umay+", "umay", "speedy cash"
    ],
  },
  {
    category: "Savings",
    keywords: [
      "ออม", "เงินออม", "ฝากประจำ", "ฝากบัญชี", "กองทุน", "กองทุนรวม", "หุ้น", "ซื้อหุ้น",
      "หุ้นกู้", "tfex", "crypto", "บิทคอยน์", "btc", "eth", "thaiesg", "esg", "rmf", "ssf",
      "pvd", "สำรองเลี้ยงชีพ", "gpf", "กบข", "กอช", "nsf", "ทอง", "ซื้อทอง", "ทองคำ",
      "deposit", "save", "savings", "invest", "investment", "fund", "stock", "gold",
      "asset", "dime", "innovestx", "streaming"
    ],
  },
  {
    category: "Income",
    keywords: [
      "เงินเดือน", "salary", "โบนัส", "bonus", "freelance", "ฟรีแลนซ์", "รับจ้าง", "ค่าจ้าง",
      "ค่าคอม", "คอมมิชชั่น", "commission", "ปันผล", "เงินปันผล", "dividend", "ดอกเบี้ยรับ",
      "คืนเงิน", "cashback", "ขายของ", "รายได้", "ได้เงิน", "เงินโอนเข้า", "รับเงิน", "wage",
      "paycheck", "revenue", "income"
    ],
  },
];

const CATEGORY_TAG_MAP: Record<string, TransactionCategory> = {
  // English lowercase
  food: "Food",
  transport: "Transport",
  travel: "Transport",
  transit: "Transport",
  home: "Home",
  housing: "Home",
  utility: "Home",
  health: "Health",
  medical: "Health",
  fitness: "Health",
  learning: "Learning",
  study: "Learning",
  education: "Learning",
  fun: "Fun",
  entertainment: "Fun",
  debt: "Debt",
  loan: "Debt",
  savings: "Savings",
  saving: "Savings",
  invest: "Savings",
  income: "Income",
  // Thai tags
  อาหาร: "Food",
  กิน: "Food",
  กินข้าว: "Food",
  ของกิน: "Food",
  เดินทาง: "Transport",
  รถ: "Transport",
  ขนส่ง: "Transport",
  บ้าน: "Home",
  ห้อง: "Home",
  ที่พัก: "Home",
  สุขภาพ: "Health",
  ยา: "Health",
  หมอ: "Health",
  เรียน: "Learning",
  หนังสือ: "Learning",
  การเรียน: "Learning",
  บันเทิง: "Fun",
  เที่ยว: "Fun",
  เกม: "Fun",
  หนี้: "Debt",
  ผ่อน: "Debt",
  ออม: "Savings",
  เงินออม: "Savings",
  ลงทุน: "Savings",
  รายรับ: "Income",
  เงินเดือน: "Income",
  รายได้: "Income",
};

// Common Thai classifiers / unit words that denote quantities rather than total prices
const THAI_CLASSIFIERS = [
  "ถุง", "จาน", "ชาม", "ถ้วย", "แก้ว", "ชิ้น", "ขวด", "กล่อง", "อัน", "ชุด", "ตัว", "ใบ", "ซอง", "ห่อ",
  "แผง", "แผ่น", "กระป๋อง", "กระปุก", "ลูก", "ก้อน", "แพ็ค", "แพค", "แท่ง", "ม้วน", "ด้าม",
  "เล่ม", "ที่", "คน", "มื้อ", "กิโล", "กก", "ถาด", "คู่"
];

// Mapping for Thai numerals (เลขไทย ๐-๙) to Arabic digits
const THAI_TO_ARABIC_DIGITS: Record<string, string> = {
  "๐": "0",
  "๑": "1",
  "๒": "2",
  "๓": "3",
  "๔": "4",
  "๕": "5",
  "๖": "6",
  "๗": "7",
  "๘": "8",
  "๙": "9",
};

export function normalizeThaiDigits(str: string): string {
  return str.replace(/[๐-๙]/g, (ch) => THAI_TO_ARABIC_DIGITS[ch] || ch);
}

// Flatten and sort keywords by length descending to prioritize more specific multi-word / longer keywords
// e.g. "น้ำมันพืช" (Food) > "น้ำมัน" (Transport) > "น้ำ" (Food), "เงินปันผล" (Income) > "หุ้น" (Savings)
interface FlatRule {
  keyword: string;
  category: TransactionCategory;
  isAsciiWord: boolean;
}

const FLATTENED_RULES: FlatRule[] = CATEGORY_RULES.flatMap((rule) =>
  rule.keywords.map((kw) => ({
    keyword: kw.toLowerCase(),
    category: rule.category,
    isAsciiWord: /^[a-z0-9\s._-]+$/i.test(kw),
  }))
).sort((a, b) => b.keyword.length - a.keyword.length);

/**
 * Infer category from transaction text keywords with length-priority and word-boundary safety
 */
export function inferCategoryFromText(text: string): TransactionCategory {
  const lower = text.toLowerCase();

  for (const rule of FLATTENED_RULES) {
    if (rule.isAsciiWord && rule.keyword.length <= 4) {
      // Use word boundary for short English words (e.g. "tea", "mk", "gas", "bus", "gym")
      const regex = new RegExp(`\\b${rule.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(lower)) {
        return rule.category;
      }
    } else {
      if (lower.includes(rule.keyword)) {
        return rule.category;
      }
    }
  }

  return "Food";
}

/**
 * Safely evaluates simple arithmetic string expressions containing +, -, *, /, (, ), k, m
 * without using eval() or new Function().
 */
export function evaluateSafeMath(expr: string): number {
  if (!expr) return NaN;
  let s = normalizeThaiDigits(expr).trim().toLowerCase();

  // Normalize multipliers e.g. 1.5k -> 1500, 2m -> 2000000
  s = s.replace(/(\d+(?:\.\d+)?)\s*k\b/gi, (_, n) => String(parseFloat(n) * 1000));
  s = s.replace(/(\d+(?:\.\d+)?)\s*m\b/gi, (_, n) => String(parseFloat(n) * 1000000));
  // Replace 'x' or 'X' with '*'
  s = s.replace(/x/gi, "*");
  s = s.replace(/,/g, "");

  // Only allow digits, whitespace, operators, parenthesis, and decimal points
  if (!/^[\d\s.+\-*/()]+$/.test(s)) {
    return NaN;
  }

  // Tokenize
  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "(" || ch === ")") {
      tokens.push(ch);
      i++;
    } else if (/\d|\./.test(ch)) {
      let numStr = "";
      while (i < s.length && /[\d.]/.test(s[i])) {
        numStr += s[i];
        i++;
      }
      tokens.push(numStr);
    } else {
      return NaN;
    }
  }

  if (tokens.length === 0) return NaN;

  // Simple recursive descent parser
  let pos = 0;

  function parseExpression(): number {
    let result = parseTerm();
    while (pos < tokens.length) {
      const op = tokens[pos];
      if (op === "+") {
        pos++;
        result += parseTerm();
      } else if (op === "-") {
        pos++;
        result -= parseTerm();
      } else {
        break;
      }
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (pos < tokens.length) {
      const op = tokens[pos];
      if (op === "*") {
        pos++;
        result *= parseFactor();
      } else if (op === "/") {
        pos++;
        const denom = parseFactor();
        if (denom === 0) return NaN;
        result /= denom;
      } else {
        break;
      }
    }
    return result;
  }

  function parseFactor(): number {
    if (pos >= tokens.length) return NaN;
    const token = tokens[pos];

    if (token === "+") {
      pos++;
      return parseFactor();
    }
    if (token === "-") {
      pos++;
      return -parseFactor();
    }
    if (token === "(") {
      pos++;
      const val = parseExpression();
      if (pos >= tokens.length || tokens[pos] !== ")") return NaN;
      pos++; // consume ')'
      return val;
    }

    const val = parseFloat(token);
    if (isNaN(val)) return NaN;
    pos++;
    return val;
  }

  const res = parseExpression();
  return isNaN(res) || !isFinite(res) ? NaN : Math.round(res * 100) / 100;
}

/**
 * Parses numeric amount strings including suffixes like 'k', commas, currency symbols, arithmetic expressions, and .-.
 * Returns positive number, or NaN if unparseable.
 */
export function parseAmountValue(rawAmount: string): number {
  if (!rawAmount) return NaN;
  let s = normalizeThaiDigits(rawAmount).trim().toLowerCase();

  // Remove currency signs & common Thai suffixes (chained or standalone)
  s = s.replace(/^(?:฿|thb|\$)+/gi, "");
  s = s.replace(/(?:\.-|฿|thb|บาท|\$)+$/gi, "").trim();
  s = s.replace(/,/g, "").trim();

  // Try math expression evaluation if arithmetic operators exist
  if (/[\-+*x/]/.test(s)) {
    const mathVal = evaluateSafeMath(s);
    if (!isNaN(mathVal) && Math.abs(mathVal) > 0) {
      return Math.abs(mathVal);
    }
  }

  // Handle 'k' / 'm' multiplier suffix
  if (s.endsWith("k")) {
    const num = parseFloat(s.slice(0, -1));
    return isNaN(num) ? NaN : Math.abs(num) * 1000;
  }
  if (s.endsWith("m")) {
    const num = parseFloat(s.slice(0, -1));
    return isNaN(num) ? NaN : Math.abs(num) * 1000000;
  }

  const parsed = parseFloat(s);
  return isNaN(parsed) ? NaN : Math.abs(parsed);
}

interface AmountCandidate {
  rawMatch: string;
  startIndex: number;
  endIndex: number;
  value: number;
  hasCurrency: boolean;
  isMath: boolean;
  isQuantity: boolean;
  hasPlusSign: boolean;
}

/**
 * Main parser function: Converts a raw single-line natural language text to a structured transaction.
 */
export type QuickParseOptions = {
  accountAliases?: string[]; // Lowercased account aliases that "@alias" may refer to
  categoryTags?: Record<string, string>; // Lowercased custom category names -> category id
};

export function parseQuickInput(input: string, options: QuickParseOptions = {}): ParsedQuickTransaction {
  if (!input) {
    return {
      isValid: false,
      name: "",
      amount: 0,
      category: "Food",
      type: "expense",
      raw: "",
      error: "Empty input",
    };
  }

  // 0. Preprocess: normalize Thai digits, strip zero-width characters, flatten newlines/tabs
  const raw = input.trim();
  let text = normalizeThaiDigits(raw)
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width spaces
    .replace(/\r\n|\r|\n|\t/g, " ")       // flatten newlines and tabs to space
    .replace(/\u00A0/g, " ")               // non-breaking space to regular space
    .replace(/\s+/g, " ")                  // collapse multiple spaces
    .trim();

  if (!text) {
    return {
      isValid: false,
      name: "",
      amount: 0,
      category: "Food",
      type: "expense",
      raw,
      error: "Empty input",
    };
  }

  // 1. Detect Note syntax
  let notes: string | undefined;
  const noteMatch = text.match(/(?:note|notes|โน้ต|บันทึก|memo)\s*:\s*(.+)$/i);
  if (noteMatch) {
    notes = noteMatch[1].trim();
    text = text.substring(0, noteMatch.index).trim();
  }

  // 1b. Detect account alias "@kb" (takes priority over "@category" tags)
  let accountAlias: string | undefined;
  const aliasSet = new Set((options.accountAliases ?? []).map((alias) => alias.toLowerCase()));
  if (aliasSet.size > 0) {
    for (const match of text.matchAll(/(?:^|\s)@([\w\u0E00-\u0E7F-]+)/g)) {
      const key = match[1].toLowerCase();
      if (aliasSet.has(key)) {
        accountAlias = key;
        text = text.replace(`@${match[1]}`, " ").replace(/\s+/g, " ").trim();
        break;
      }
    }
  }

  // 2. Detect Category tags: #tag, @tag, [tag], (tag)
  let explicitCategory: TransactionCategory | undefined;

  const tagPatterns = [
    /#([a-zA-Z\u0E00-\u0E7F]+)/,
    /@([a-zA-Z\u0E00-\u0E7F]+)/,
    /\[([a-zA-Z\u0E00-\u0E7F]+)\]/,
    /\(([a-zA-Z\u0E00-\u0E7F]+)\)/,
  ];

  for (const pattern of tagPatterns) {
    const match = text.match(pattern);
    if (match) {
      const tagKey = match[1].toLowerCase();
      const tagged = options.categoryTags?.[tagKey] ?? CATEGORY_TAG_MAP[tagKey];
      if (tagged) {
        explicitCategory = tagged;
        text = text.replace(match[0], " ").trim();
        break;
      }
    }
  }

  // 2b. Any "@word" left over is a typo'd account alias once aliases are in use
  let unknownAccountAlias: string | undefined;
  if (aliasSet.size > 0) {
    const leftover = text.match(/(?:^|\s)@([\w\u0E00-\u0E7F-]+)/);
    if (leftover) {
      unknownAccountAlias = leftover[1];
      text = text.replace(`@${leftover[1]}`, " ").replace(/\s+/g, " ").trim();
    }
  }

  // 3. Detect Explicit Income flag '+'
  let isIncome = false;
  // Check for starting +, trailing +, standalone +, or 'income ' / 'รายรับ ' prefix
  if (
    text.startsWith("+") ||
    /\s\+\s*$/.test(text) ||
    /^\+\s*\d+/.test(text) ||
    text.toLowerCase().startsWith("income ") ||
    text.startsWith("รายรับ ")
  ) {
    isIncome = true;
    text = text.replace(/^\+\s*/, "");
    text = text.replace(/\s\+\s*$/, "");
    text = text.replace(/^(?:income|รายรับ)\s+/i, "");
  }

  // 4. Extract Amount Candidates
  // A. Check for safe arithmetic expressions first e.g. "60*2", "50*3", "35+20", "60x2", "(50+20)"
  const candidates: AmountCandidate[] = [];

  const mathRegex = /(?:^|\s)(?:฿|\$)?(\(?\s*(?:\d+(?:\.\d+)?(?:k|m)?\s*[*x/+\-]\s*)+\d+(?:\.\d+)?(?:k|m)?\s*\)?)(?:\s*(?:฿|\$|\.-|thb|บาท))?(?:\s|$)/gi;
  let mMatch: RegExpExecArray | null;
  while ((mMatch = mathRegex.exec(text)) !== null) {
    const exprToken = mMatch[1];
    const val = evaluateSafeMath(exprToken);
    if (!isNaN(val) && val > 0) {
      const matchIndex = mMatch.index + mMatch[0].indexOf(exprToken);
      candidates.push({
        rawMatch: mMatch[0].trim(),
        startIndex: matchIndex,
        endIndex: matchIndex + exprToken.length,
        value: val,
        hasCurrency: /฿|\$|\.-|thb|บาท/i.test(mMatch[0]),
        isMath: true,
        isQuantity: false,
        hasPlusSign: false,
      });
    }
  }

  // B. Match general and currency-marked tokens (supporting separated currency e.g. "80 บาท" or "100 THB", and +/- prefixes)
  const tokenRegex = /(?:^|\s)([+\-]?(?:฿|\$)?\s*\d[\d,]*(?:\.\d+)?(?:k|m)?(?:\s*(?:฿|\$|\.-|thb|บาท))?)(?:\s|$)/gi;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = tokenRegex.exec(text)) !== null) {
    const rawToken = tMatch[1].trim();
    const hasPlusSign = rawToken.startsWith("+");
    const val = parseAmountValue(rawToken);

    if (!isNaN(val) && val > 0) {
      const matchStart = tMatch.index + tMatch[0].indexOf(rawToken);
      const matchEnd = matchStart + rawToken.length;

      // Check if this token is immediately followed by a Thai classifier (e.g. "2 ถุง", "2 จาน")
      const textAfter = text.substring(matchEnd).trim();
      const isQuantity = THAI_CLASSIFIERS.some(
        (cls) => textAfter.startsWith(cls) || textAfter.startsWith(` ${cls}`)
      );

      // Check if it's a known brand part e.g. "7-11"
      const textBefore = text.substring(0, matchStart);
      const isHyphenBrand = textBefore.endsWith("-") || textAfter.startsWith("-");

      if (!isHyphenBrand) {
        candidates.push({
          rawMatch: rawToken,
          startIndex: matchStart,
          endIndex: matchEnd,
          value: val,
          hasCurrency: /฿|\$|\.-|thb|บาท/i.test(rawToken),
          isMath: false,
          isQuantity,
          hasPlusSign,
        });
      }
    }
  }

  let chosenCandidate: AmountCandidate | undefined;

  if (candidates.length > 0) {
    // 1. Math expressions have high priority
    const mathCand = candidates.find((c) => c.isMath);
    if (mathCand) {
      chosenCandidate = mathCand;
    } else {
      // 2. Explicit currency marks (฿, .-, บาท, THB) have next priority
      const currCand = candidates.find((c) => c.hasCurrency);
      if (currCand) {
        chosenCandidate = currCand;
      } else {
        // 3. Filter out quantity classifier numbers if non-quantity numbers exist
        const nonQuant = candidates.filter((c) => !c.isQuantity);
        if (nonQuant.length > 0) {
          // Choose the rightmost non-quantity candidate (standard Thai/English NLP pattern: "[Item] [Amount]")
          chosenCandidate = nonQuant[nonQuant.length - 1];
        } else {
          // Fallback to the rightmost candidate
          chosenCandidate = candidates[candidates.length - 1];
        }
      }
    }
  }

  let amount = NaN;
  let name = "";

  if (chosenCandidate) {
    amount = chosenCandidate.value;
    if (chosenCandidate.hasPlusSign) {
      isIncome = true;
    }
    const before = text.substring(0, chosenCandidate.startIndex).trim();
    const after = text.substring(chosenCandidate.endIndex).trim();
    name = `${before} ${after}`.trim();
  }

  name = name.replace(/\s+/g, " ").trim();

  if (isNaN(amount) || amount <= 0) {
    return {
      isValid: false,
      name: name || raw,
      amount: 0,
      category: explicitCategory || inferCategoryFromText(raw),
      type: isIncome ? "income" : "expense",
      notes,
      accountAlias,
      unknownAccountAlias,
      raw,
      error: 'Please include a valid amount (e.g. "กะเพรา 65")',
    };
  }

  if (!name) {
    name = isIncome ? "Income" : "Expense";
  }

  // 5. Determine Category
  let category: TransactionCategory;
  if (isIncome) {
    category = "Income";
  } else if (explicitCategory) {
    category = explicitCategory;
  } else {
    category = inferCategoryFromText(name);
  }

  if (category === "Income") {
    isIncome = true;
  }

  const finalAmount = isIncome ? Math.abs(amount) : -Math.abs(amount);

  return {
    isValid: !unknownAccountAlias,
    name,
    amount: finalAmount,
    category,
    type: isIncome ? "income" : "expense",
    notes,
    accountAlias,
    unknownAccountAlias,
    raw,
    ...(unknownAccountAlias ? { error: `Unknown account @${unknownAccountAlias}` } : {}),
  };
}
