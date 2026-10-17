import { describe, it, expect } from "vitest";
import {
  parseQuickInput,
  inferCategoryFromText,
  parseAmountValue,
  evaluateSafeMath,
  normalizeThaiDigits,
} from "./quickParser";

describe("quickParser", () => {
  describe("normalizeThaiDigits", () => {
    it("converts Thai numerals to standard Arabic digits", () => {
      expect(normalizeThaiDigits("๑๒๓๔๕๖๗๘๙๐")).toBe("1234567890");
      expect(normalizeThaiDigits("กะเพรา ๖๕")).toBe("กะเพรา 65");
      expect(normalizeThaiDigits("ข้าว ๗๐ บาท")).toBe("ข้าว 70 บาท");
    });
  });

  describe("evaluateSafeMath", () => {
    it("evaluates simple addition, subtraction, multiplication, and division", () => {
      expect(evaluateSafeMath("60*2")).toBe(120);
      expect(evaluateSafeMath("50 * 3")).toBe(150);
      expect(evaluateSafeMath("60x2")).toBe(120);
      expect(evaluateSafeMath("35+20")).toBe(55);
      expect(evaluateSafeMath("100-25")).toBe(75);
      expect(evaluateSafeMath("120/2")).toBe(60);
      expect(evaluateSafeMath("100+250+50")).toBe(400);
    });

    it("evaluates expressions with parentheses and multipliers", () => {
      expect(evaluateSafeMath("(50+30)*2")).toBe(160);
      expect(evaluateSafeMath("(50+20)")).toBe(70);
      expect(evaluateSafeMath("1.5k * 2")).toBe(3000);
      expect(evaluateSafeMath("2m / 4")).toBe(500000);
    });

    it("evaluates math expressions with Thai numerals", () => {
      expect(evaluateSafeMath("๖๐*๒")).toBe(120);
      expect(evaluateSafeMath("๕๐+๓๐")).toBe(80);
    });

    it("returns NaN for invalid math strings", () => {
      expect(evaluateSafeMath("")).toBeNaN();
      expect(evaluateSafeMath("abc")).toBeNaN();
      expect(evaluateSafeMath("50/0")).toBeNaN();
    });
  });

  describe("parseAmountValue", () => {
    it("parses plain numbers", () => {
      expect(parseAmountValue("65")).toBe(65);
      expect(parseAmountValue("120.50")).toBe(120.5);
    });

    it("parses numbers with comma separators", () => {
      expect(parseAmountValue("1,200")).toBe(1200);
      expect(parseAmountValue("45,000.75")).toBe(45000.75);
    });

    it("parses Thai numerals", () => {
      expect(parseAmountValue("๖๕")).toBe(65);
      expect(parseAmountValue("๑,๒๕๐.๕๐")).toBe(1250.5);
    });

    it("parses currency symbols and suffixes", () => {
      expect(parseAmountValue("฿65")).toBe(65);
      expect(parseAmountValue("65฿")).toBe(65);
      expect(parseAmountValue("65.-")).toBe(65);
      expect(parseAmountValue("100 THB")).toBe(100);
      expect(parseAmountValue("$50")).toBe(50);
      expect(parseAmountValue("200 บาท")).toBe(200);
      expect(parseAmountValue("45.- บาท")).toBe(45);
    });

    it("parses arithmetic strings in parseAmountValue", () => {
      expect(parseAmountValue("60*2")).toBe(120);
      expect(parseAmountValue("35+20")).toBe(55);
      expect(parseAmountValue("60x2")).toBe(120);
    });

    it("parses k and m multiplier suffixes", () => {
      expect(parseAmountValue("1.5k")).toBe(1500);
      expect(parseAmountValue("45k")).toBe(45000);
      expect(parseAmountValue("1.2m")).toBe(1200000);
    });

    it("returns NaN for invalid amounts", () => {
      expect(parseAmountValue("abc")).toBeNaN();
      expect(parseAmountValue("")).toBeNaN();
    });
  });

  describe("inferCategoryFromText", () => {
    it("infers Food category from common food keywords", () => {
      expect(inferCategoryFromText("กะเพราหมูกรอบ")).toBe("Food");
      expect(inferCategoryFromText("Starbucks Iced Latte")).toBe("Food");
      expect(inferCategoryFromText("ข้าวกลางวัน")).toBe("Food");
      expect(inferCategoryFromText("7-11 snacks")).toBe("Food");
      expect(inferCategoryFromText("หมูกระทะกับเพื่อน")).toBe("Food");
      expect(inferCategoryFromText("ไข่ไก่ 75")).toBe("Food");
      expect(inferCategoryFromText("เนย 50")).toBe("Food");
      expect(inferCategoryFromText("น้ำมันพืช 45")).toBe("Food"); // Specific cooking oil rule
      expect(inferCategoryFromText("ราเมงข้อสอบ")).toBe("Food");
    });

    it("infers Transport category", () => {
      expect(inferCategoryFromText("BTS สยาม")).toBe("Transport");
      expect(inferCategoryFromText("MRT สุขุมวิท")).toBe("Transport");
      expect(inferCategoryFromText("เติมน้ำมัน PTT")).toBe("Transport");
      expect(inferCategoryFromText("ค่าทางด่วน")).toBe("Transport");
      expect(inferCategoryFromText("Grab ride")).toBe("Transport");
      expect(inferCategoryFromText("ตั๋วการบินไทย")).toBe("Transport");
    });

    it("infers Home category", () => {
      expect(inferCategoryFromText("ค่าเช่าคอนโด")).toBe("Home");
      expect(inferCategoryFromText("ค่าไฟเดือนนี้")).toBe("Home");
      expect(inferCategoryFromText("ค่าน้ำประปา")).toBe("Home");
      expect(inferCategoryFromText("True Internet wifi")).toBe("Home");
      expect(inferCategoryFromText("AIS Fibre")).toBe("Home");
    });

    it("infers Health category", () => {
      expect(inferCategoryFromText("ซื้อยาแก้แพ้ Boots")).toBe("Health");
      expect(inferCategoryFromText("พบแพทย์โรงพยาบาล")).toBe("Health");
      expect(inferCategoryFromText("Fitness First member")).toBe("Health");
    });

    it("infers Learning category", () => {
      expect(inferCategoryFromText("ซื้อหนังสือ Kinokuniya")).toBe("Learning");
      expect(inferCategoryFromText("Udemy React Course")).toBe("Learning");
      expect(inferCategoryFromText("ค่าคอร์สสัมมนา")).toBe("Learning");
    });

    it("infers Fun category", () => {
      expect(inferCategoryFromText("Netflix subscription")).toBe("Fun");
      expect(inferCategoryFromText("ตั๋วดูหนัง Major")).toBe("Fun");
      expect(inferCategoryFromText("Steam Summer Sale")).toBe("Fun");
      expect(inferCategoryFromText("ตั๋วคอนเสิร์ต")).toBe("Fun");
    });

    it("infers Debt category", () => {
      expect(inferCategoryFromText("จ่ายบัตรเครดิต KTC")).toBe("Debt");
      expect(inferCategoryFromText("ผ่อนคอนโดงวดที่ 10")).toBe("Debt");
      expect(inferCategoryFromText("ชำระหนี้ กยศ")).toBe("Debt");
    });

    it("infers Savings category", () => {
      expect(inferCategoryFromText("ซื้อกองทุน ThaiESG")).toBe("Savings");
      expect(inferCategoryFromText("ซื้อทองคำ 1 บาท")).toBe("Savings");
      expect(inferCategoryFromText("Dime US Stock")).toBe("Savings");
    });

    it("infers Income category", () => {
      expect(inferCategoryFromText("เงินเดือนประจำ")).toBe("Income");
      expect(inferCategoryFromText("Freelance Web Design")).toBe("Income");
      expect(inferCategoryFromText("เงินปันผลหุ้น")).toBe("Income");
    });
  });

  describe("parseQuickInput", () => {
    it("parses standard [Name] [Amount] expenses", () => {
      const result = parseQuickInput("กะเพราไข่ดาว 65");
      expect(result.isValid).toBe(true);
      expect(result.name).toBe("กะเพราไข่ดาว");
      expect(result.amount).toBe(-65);
      expect(result.category).toBe("Food");
      expect(result.type).toBe("expense");
    });

    it("parses [Amount] [Name] expenses", () => {
      const result = parseQuickInput("45 BTS");
      expect(result.isValid).toBe(true);
      expect(result.name).toBe("BTS");
      expect(result.amount).toBe(-45);
      expect(result.category).toBe("Transport");
      expect(result.type).toBe("expense");
    });

    it("parses Thai numerals (เลขไทย) in full natural language inputs", () => {
      const r1 = parseQuickInput("กะเพราไข่ดาว ๖๕");
      expect(r1.isValid).toBe(true);
      expect(r1.name).toBe("กะเพราไข่ดาว");
      expect(r1.amount).toBe(-65);
      expect(r1.category).toBe("Food");

      const r2 = parseQuickInput("BTS ๔๕");
      expect(r2.isValid).toBe(true);
      expect(r2.name).toBe("BTS");
      expect(r2.amount).toBe(-45);

      const r3 = parseQuickInput("+เงินเดือน ๔๕๐๐๐");
      expect(r3.isValid).toBe(true);
      expect(r3.name).toBe("เงินเดือน");
      expect(r3.amount).toBe(45000);
      expect(r3.type).toBe("income");
    });

    it("sanitizes multi-line pastes, tabs, and zero-width spaces", () => {
      const r1 = parseQuickInput("กะเพรา 65\n");
      expect(r1.isValid).toBe(true);
      expect(r1.name).toBe("กะเพรา");
      expect(r1.amount).toBe(-65);

      const r2 = parseQuickInput("กาแฟ 60\r\nน้ำตาลน้อย");
      expect(r2.isValid).toBe(true);
      expect(r2.name).toBe("กาแฟ น้ำตาลน้อย");
      expect(r2.amount).toBe(-60);

      const r3 = parseQuickInput("\u200Bข้าว\u00A0ผัด\t70");
      expect(r3.isValid).toBe(true);
      expect(r3.name).toBe("ข้าว ผัด");
      expect(r3.amount).toBe(-70);
    });

    it("parses multi-number inputs with Thai quantities and classifiers", () => {
      const r1 = parseQuickInput("ซื้อ 2 ถุง 150");
      expect(r1.isValid).toBe(true);
      expect(r1.name).toBe("ซื้อ 2 ถุง");
      expect(r1.amount).toBe(-150);
      expect(r1.category).toBe("Food");

      const r2 = parseQuickInput("กาแฟ 2 แก้ว 120");
      expect(r2.isValid).toBe(true);
      expect(r2.name).toBe("กาแฟ 2 แก้ว");
      expect(r2.amount).toBe(-120);
      expect(r2.category).toBe("Food");

      const r3 = parseQuickInput("ข้าว 2 จาน 80 บาท");
      expect(r3.isValid).toBe(true);
      expect(r3.name).toBe("ข้าว 2 จาน");
      expect(r3.amount).toBe(-80);

      const r4 = parseQuickInput("7-11 150");
      expect(r4.isValid).toBe(true);
      expect(r4.name).toBe("7-11");
      expect(r4.amount).toBe(-150);

      const r5 = parseQuickInput("PS5 18900");
      expect(r5.isValid).toBe(true);
      expect(r5.name).toBe("PS5");
      expect(r5.amount).toBe(-18900);
      expect(r5.category).toBe("Fun");

      const r6 = parseQuickInput("ไข่ไก่ 2 แผง 250");
      expect(r6.isValid).toBe(true);
      expect(r6.name).toBe("ไข่ไก่ 2 แผง");
      expect(r6.amount).toBe(-250);
    });

    it("parses arithmetic expressions safely including parentheses", () => {
      const r1 = parseQuickInput("กาแฟ 60*2");
      expect(r1.isValid).toBe(true);
      expect(r1.name).toBe("กาแฟ");
      expect(r1.amount).toBe(-120);
      expect(r1.category).toBe("Food");

      const r2 = parseQuickInput("50*3 ข้าวเที่ยง");
      expect(r2.isValid).toBe(true);
      expect(r2.name).toBe("ข้าวเที่ยง");
      expect(r2.amount).toBe(-150);

      const r3 = parseQuickInput("ข้าว 45+10");
      expect(r3.isValid).toBe(true);
      expect(r3.name).toBe("ข้าว");
      expect(r3.amount).toBe(-55);

      const r4 = parseQuickInput("35+20");
      expect(r4.isValid).toBe(true);
      expect(r4.amount).toBe(-55);

      const r5 = parseQuickInput("60x2 ชานม");
      expect(r5.isValid).toBe(true);
      expect(r5.name).toBe("ชานม");
      expect(r5.amount).toBe(-120);

      const r6 = parseQuickInput("กาแฟ (50+20)");
      expect(r6.isValid).toBe(true);
      expect(r6.name).toBe("กาแฟ");
      expect(r6.amount).toBe(-70);
    });

    it("parses explicit negative amount input", () => {
      const r1 = parseQuickInput("-50 กาแฟ");
      expect(r1.isValid).toBe(true);
      expect(r1.name).toBe("กาแฟ");
      expect(r1.amount).toBe(-50);

      const r2 = parseQuickInput("กาแฟ -50");
      expect(r2.isValid).toBe(true);
      expect(r2.name).toBe("กาแฟ");
      expect(r2.amount).toBe(-50);
    });

    it("parses currency symbols e.g. 60฿ or 70.-", () => {
      const r1 = parseQuickInput("กาแฟ 60฿");
      expect(r1.isValid).toBe(true);
      expect(r1.name).toBe("กาแฟ");
      expect(r1.amount).toBe(-60);
      expect(r1.category).toBe("Food");

      const r2 = parseQuickInput("ข้าวเที่ยง 70.-");
      expect(r2.isValid).toBe(true);
      expect(r2.name).toBe("ข้าวเที่ยง");
      expect(r2.amount).toBe(-70);
      expect(r2.category).toBe("Food");
    });

    it("parses + prefix as income", () => {
      const result = parseQuickInput("+เงินเดือน 45000");
      expect(result.isValid).toBe(true);
      expect(result.name).toBe("เงินเดือน");
      expect(result.amount).toBe(45000);
      expect(result.category).toBe("Income");
      expect(result.type).toBe("income");
    });

    it("parses income with trailing +, leading +, or embedded +amount", () => {
      const r1 = parseQuickInput("Freelance 5000 +");
      expect(r1.isValid).toBe(true);
      expect(r1.name).toBe("Freelance");
      expect(r1.amount).toBe(5000);
      expect(r1.type).toBe("income");

      const r2 = parseQuickInput("income โบนัส 30000");
      expect(r2.isValid).toBe(true);
      expect(r2.name).toBe("โบนัส");
      expect(r2.amount).toBe(30000);
      expect(r2.type).toBe("income");

      const r3 = parseQuickInput("โบนัส +50000");
      expect(r3.isValid).toBe(true);
      expect(r3.name).toBe("โบนัส");
      expect(r3.amount).toBe(50000);
      expect(r3.type).toBe("income");
    });

    it("parses custom category tags e.g. #tag, @tag, [tag], (tag)", () => {
      const r1 = parseQuickInput("กาแฟ 60 #fun");
      expect(r1.isValid).toBe(true);
      expect(r1.name).toBe("กาแฟ");
      expect(r1.amount).toBe(-60);
      expect(r1.category).toBe("Fun");

      const r2 = parseQuickInput("ยาแก้แพ้ 150 @Health");
      expect(r2.isValid).toBe(true);
      expect(r2.name).toBe("ยาแก้แพ้");
      expect(r2.amount).toBe(-150);
      expect(r2.category).toBe("Health");

      const r3 = parseQuickInput("โต๊ะทำงาน 1500 [Home]");
      expect(r3.isValid).toBe(true);
      expect(r3.name).toBe("โต๊ะทำงาน");
      expect(r3.amount).toBe(-1500);
      expect(r3.category).toBe("Home");

      const r4 = parseQuickInput("ซื้อหนังสือ 250 (Learning)");
      expect(r4.isValid).toBe(true);
      expect(r4.name).toBe("ซื้อหนังสือ");
      expect(r4.amount).toBe(-250);
      expect(r4.category).toBe("Learning");
    });

    it("parses notes / memo syntax", () => {
      const result = parseQuickInput("ข้าวเที่ยง 80 note: เลี้ยงน้องฝึกงาน");
      expect(result.isValid).toBe(true);
      expect(result.name).toBe("ข้าวเที่ยง");
      expect(result.amount).toBe(-80);
      expect(result.notes).toBe("เลี้ยงน้องฝึกงาน");
    });

    it("handles empty or invalid inputs gracefully", () => {
      const r1 = parseQuickInput("");
      expect(r1.isValid).toBe(false);

      const r2 = parseQuickInput("   ");
      expect(r2.isValid).toBe(false);

      const r3 = parseQuickInput("ข้าวผัด");
      expect(r3.isValid).toBe(false);
      expect(r3.error).toBeDefined();
    });

    it("handles standalone amount numbers without name", () => {
      const r1 = parseQuickInput("100");
      expect(r1.isValid).toBe(true);
      expect(r1.name).toBe("Expense");
      expect(r1.amount).toBe(-100);

      const r2 = parseQuickInput("+500");
      expect(r2.isValid).toBe(true);
      expect(r2.name).toBe("Income");
      expect(r2.amount).toBe(500);
    });

    it("parses additional Thai classifiers like ชาม, ห่อ, and tag aliases", () => {
      const r1 = parseQuickInput("ก๋วยเตี๋ยว 2 ชาม 120");
      expect(r1.isValid).toBe(true);
      expect(r1.name).toBe("ก๋วยเตี๋ยว 2 ชาม");
      expect(r1.amount).toBe(-120);
      expect(r1.category).toBe("Food");

      const r2 = parseQuickInput("บะหมี่กึ่งสำเร็จรูป 3 ห่อ 45");
      expect(r2.isValid).toBe(true);
      expect(r2.name).toBe("บะหมี่กึ่งสำเร็จรูป 3 ห่อ");
      expect(r2.amount).toBe(-45);

      const r3 = parseQuickInput("สเต็ก 300 #กินข้าว");
      expect(r3.isValid).toBe(true);
      expect(r3.category).toBe("Food");

      const r4 = parseQuickInput("ฝากประจำ 5000 @เงินออม");
      expect(r4.isValid).toBe(true);
      expect(r4.category).toBe("Savings");
    });
  });
});

describe("account aliases", () => {
  const options = { accountAliases: ["kb", "card"] };

  it("pulls a known @alias out of the name and amount", () => {
    const parsed = parseQuickInput("กะเพรา 65 @kb", options);
    expect(parsed).toMatchObject({ isValid: true, name: "กะเพรา", amount: -65, accountAlias: "kb" });
  });

  it("matches aliases case-insensitively and anywhere in the line", () => {
    expect(parseQuickInput("@CARD shopee 890", options)).toMatchObject({ accountAlias: "card", amount: -890, name: "shopee" });
  });

  it("still treats @category tags as categories", () => {
    expect(parseQuickInput("ยาแก้ไอ 120 @food", options)).toMatchObject({ isValid: true, category: "Food", accountAlias: undefined });
  });

  it("rejects an unknown @alias instead of keeping it in the name", () => {
    const parsed = parseQuickInput("ข้าว 50 @kbank", options);
    expect(parsed).toMatchObject({ isValid: false, unknownAccountAlias: "kbank", name: "ข้าว" });
  });

  it("keeps old behaviour when no aliases are configured", () => {
    expect(parseQuickInput("ข้าว 50 @kbank")).toMatchObject({ isValid: true, unknownAccountAlias: undefined });
  });
});
