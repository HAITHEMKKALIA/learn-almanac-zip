// Curriculum B2 — DE/FR/AR
import type { Unit } from "./curriculum";
import { NETZWERK_B2 } from "./netzwerkB2";

const UNITS_B2_BASE: Unit[] = [
  {
    id: "b2_u1", title: "Konnektoren avancés", titleAr: "أدوات الربط المتقدّمة",
    icon: "🧩", desc: "obwohl, trotzdem, deshalb, sodass...", descAr: "روابط متقدّمة",
    color: "#0ea5e9", level: "B2",
    lessons: [
      {
        id: "b2_u1_l1", title: "Concession, conséquence, but", titleAr: "التنازل، النتيجة، الغاية",
        content: `**Concession** : obwohl (subord.), trotzdem (princ., V2)
**Conséquence** : deshalb / deswegen / daher (princ., V2), sodass (subord.)
**But** : damit (subord.), um...zu (infinitif)

Ex : **Obwohl** es regnet, gehen wir spazieren.
Es regnet; **trotzdem** gehen wir spazieren.
Wir lernen, **um** die Prüfung zu **bestehen**.`,
        vocab: [
          { de: "obwohl", fr: "bien que", ar: "رغم أن", ex: "Obwohl es kalt ist, schwimmen wir." },
          { de: "trotzdem", fr: "malgré tout", ar: "ومع ذلك", ex: "Es regnet, trotzdem gehen wir." },
          { de: "deshalb", fr: "c'est pourquoi", ar: "لذلك", ex: "Ich bin müde, deshalb schlafe ich." },
          { de: "damit", fr: "afin que", ar: "لكي", ex: "Ich lerne, damit ich bestehe." },
          { de: "sodass", fr: "de sorte que", ar: "بحيث", ex: "Es schneite, sodass die Schule zu war." },
        ],
        exercises: [
          { type: "qcm", q: "« ___ es regnet, bleibe ich zu Hause. » (parce que)", opts: ["weil", "obwohl", "trotzdem", "denn"], ans: 0, tip: "Cause subord. → weil." },
          { type: "translate", q: "« J'apprends pour réussir l'examen. »", ans: "Ich lerne, um die Prüfung zu bestehen", tip: "um...zu + infinitif." },
        ],
      },
    ],
  },
  {
    id: "b2_u2", title: "Nominalisation & Genitiv", titleAr: "الإسمية وحالة الإضافة",
    icon: "📚", desc: "Style écrit académique", descAr: "الأسلوب الأكاديمي",
    color: "#8b5cf6", level: "B2",
    lessons: [
      {
        id: "b2_u2_l1", title: "Du verbe au nom", titleAr: "من الفعل إلى الاسم",
        content: `**Style B2 = nominalisation + Genitiv**

• entwickeln → die Entwicklung (le développement)
• untersuchen → die Untersuchung
• entscheiden → die Entscheidung
• Genitiv : des Mannes, der Frau, des Kindes, der Leute

Ex : Die **Entwicklung** der Wirtschaft ist wichtig.`,
        vocab: [
          { de: "die Entwicklung", fr: "le développement", ar: "التطوّر", ex: "Die Entwicklung der KI." },
          { de: "die Forschung", fr: "la recherche", ar: "البحث", ex: "Die Forschung zeigt..." },
          { de: "die Auswirkung", fr: "la conséquence", ar: "التأثير", ex: "Die Auswirkungen des Klimawandels." },
          { de: "die Untersuchung", fr: "l'étude", ar: "الدراسة", ex: "Eine wissenschaftliche Untersuchung." },
          { de: "die Entscheidung", fr: "la décision", ar: "القرار", ex: "Eine schwierige Entscheidung." },
        ],
        exercises: [
          { type: "fill", q: "Genitiv : das Auto ___ Mann___", ans: "des Mannes", tip: "M.Gen → des + -es." },
          { type: "translate", q: "« Le développement de l'économie. »", ans: "Die Entwicklung der Wirtschaft", tip: "Genitiv féminin → der." },
        ],
      },
    ],
  },
  {
    id: "b2_u3", title: "Konjunktiv I — discours indirect", titleAr: "الكلام غير المباشر",
    icon: "📰", desc: "Style journalistique", descAr: "الأسلوب الصحفي",
    color: "#10b981", level: "B2",
    lessons: [
      {
        id: "b2_u3_l1", title: "Reporter ce qui est dit", titleAr: "نقل الكلام",
        content: `**Konjunktiv I** = discours rapporté (presse).

• sein → er sei, sie seien
• haben → er habe
• Verbes réguliers → er sage, er komme
• Si forme = indicatif, on bascule en Konjunktiv II : sie hätten, würden gehen.

Ex : Der Minister sagte, er **sei** zufrieden / die Lage **habe** sich verbessert.`,
        vocab: [
          { de: "er sei", fr: "il serait/est (rapp.)", ar: "(يقال) إنه", ex: "Er sagte, er sei krank." },
          { de: "er habe", fr: "il aurait/a (rapp.)", ar: "(يقال) لديه", ex: "Sie sagte, er habe Recht." },
          { de: "er komme", fr: "il viendrait", ar: "(يقال) يأتي", ex: "Er behauptet, er komme bald." },
        ],
        exercises: [
          { type: "translate", q: "Discours rapp. : « Il dit qu'il est malade. »", ans: "Er sagt, er sei krank", tip: "sein → sei (Konj. I)." },
        ],
      },
    ],
  },
  {
    id: "b2_u4", title: "Partizipialkonstruktionen", titleAr: "الجمل المختصرة بالمشاركات",
    icon: "✂️", desc: "Phrases compactes — Partizip I/II", descAr: "اختصار الجمل بالمشاركات",
    color: "#f59e0b", level: "B2",
    lessons: [
      {
        id: "b2_u4_l1", title: "Partizip I et II en attribut", titleAr: "المشاركة في موضع الصفة",
        content: `**Partizip I** = Infinitiv + d → lesend, schlafend (action en cours)
**Partizip II** = forme passée → gelesen, geschlafen

Comme adjectif décliné :
• das **lesende** Kind = l'enfant qui lit
• das **gelesene** Buch = le livre lu

Permet de condenser une relative en une formule courte.`,
        vocab: [
          { de: "lesend", fr: "lisant", ar: "قارئ", ex: "Das lesende Kind." },
          { de: "schlafend", fr: "dormant", ar: "نائم", ex: "Das schlafende Baby." },
          { de: "gelesen", fr: "lu", ar: "مقروء", ex: "Das gelesene Buch." },
          { de: "verlorengegangen", fr: "perdu", ar: "ضائع", ex: "Der verlorengegangene Schlüssel." },
        ],
        exercises: [
          { type: "translate", q: "« Le bébé qui dort » (en Partizip)", ans: "Das schlafende Baby", tip: "schlafen → schlafend + déclinaison faible." },
        ],
      },
    ],
  },
  {
    id: "b2_u5", title: "Konjunktiv II passé", titleAr: "صيغة الشرط الماضية",
    icon: "🕰️", desc: "hätte/wäre + Partizip II", descAr: "الندم والافتراض الماضي",
    color: "#0ea5e9", level: "B2",
    lessons: [{
      id: "b2_u5_l1", title: "Regret et hypothèse passée", titleAr: "الندم والافتراض",
      content: `**hätte / wäre + Partizip II** : Ich **hätte** mehr **gelernt**, wenn ich Zeit gehabt hätte.\nWenn-Satz au Plusquamperfekt-Konj II.`,
      vocab: [
        { de: "hätte gewusst", fr: "aurait su", ar: "كان قد يعلم", ex: "Wenn ich es gewusst hätte…" },
        { de: "wäre gekommen", fr: "serait venu", ar: "كان قد يأتي", ex: "Er wäre gekommen, wenn…" },
        { de: "an deiner Stelle", fr: "à ta place", ar: "في مكانك", ex: "An deiner Stelle hätte ich Nein gesagt." },
      ],
      exercises: [
        { type: "fill", q: "Wenn ich Zeit gehabt ___, wäre ich gekommen.", ans: "hätte", tip: "Konj II passé." },
        { type: "translate", q: "« Si j'avais su, je serais venu. »", ans: "Wenn ich das gewusst hätte, wäre ich gekommen", tip: "hätte + wäre." },
      ],
    }],
  },
  {
    id: "b2_u6", title: "Modalverben subjectifs", titleAr: "الأفعال الناقصة الذاتية",
    icon: "🤔", desc: "Er soll krank sein", descAr: "نقل ادّعاء أو احتمال",
    color: "#f59e0b", level: "B2",
    lessons: [{
      id: "b2_u6_l1", title: "Sens subjectif", titleAr: "المعنى الذاتي",
      content: `**sollen** subjectif = on dit que · **müssen** = il doit (forte certitude) · **können** = peut-être · **wollen** = prétend.\nEx : Er **soll** reich sein (= on dit qu'il est riche).`,
      vocab: [
        { de: "soll … sein", fr: "on dit que", ar: "يُقال إن", ex: "Er soll krank sein." },
        { de: "muss … sein", fr: "doit certainement être", ar: "لا بدّ أن", ex: "Sie muss zu Hause sein." },
        { de: "kann … sein", fr: "peut être", ar: "ربّما", ex: "Das kann wahr sein." },
        { de: "will … haben", fr: "prétend avoir", ar: "يدّعي", ex: "Er will Millionär sein." },
      ],
      exercises: [
        { type: "qcm", q: "« On dit qu'il est riche » :", opts: ["Er muss reich sein","Er soll reich sein","Er kann reich sein","Er will reich sein"], ans: 1, tip: "sollen subjectif." },
      ],
    }],
  },
  {
    id: "b2_u7", title: "Passif d'état (Zustandspassiv)", titleAr: "مجهول الحالة",
    icon: "🪟", desc: "sein + Partizip II", descAr: "sein + اسم المفعول",
    color: "#a855f7", level: "B2",
    lessons: [{
      id: "b2_u7_l1", title: "werden- vs sein-Passiv", titleAr: "الفرق بين النوعين",
      content: `**Vorgangspassiv (werden)** = action : Die Tür **wird geöffnet**.\n**Zustandspassiv (sein)** = état/résultat : Die Tür **ist geöffnet**.`,
      vocab: [
        { de: "ist geöffnet", fr: "est ouvert", ar: "مفتوح", ex: "Das Geschäft ist geöffnet." },
        { de: "wird geöffnet", fr: "est en train d'être ouvert", ar: "يُفتح الآن", ex: "Die Tür wird geöffnet." },
        { de: "ist geschlossen", fr: "est fermé", ar: "مغلق", ex: "Die Bank ist geschlossen." },
      ],
      exercises: [
        { type: "qcm", q: "Action en cours :", opts: ["ist geöffnet","wird geöffnet"], ans: 1, tip: "werden = action." },
        { type: "translate", q: "« La lettre est écrite (état). »", ans: "Der Brief ist geschrieben", tip: "sein + Partizip." },
      ],
    }],
  },
  {
    id: "b2_u8", title: "Verben mit Präpositionen avancés", titleAr: "أفعال متقدّمة مع حروف",
    icon: "🔗", desc: "sich beschäftigen mit, bestehen aus", descAr: "أفعال ثابتة + حرف",
    color: "#22c55e", level: "B2",
    lessons: [{
      id: "b2_u8_l1", title: "Pronoms da-/wo-", titleAr: "الضمائر da- و wo-",
      content: `Pour les choses : **damit, dafür, darauf, davon…** remplacent prép. + pronom.\nPour les questions : **womit?, wofür?, worauf?**.\nEx : Ich freue mich **darauf**. **Worauf** wartest du?`,
      vocab: [
        { de: "sich beschäftigen mit", fr: "s'occuper de", ar: "ينشغل بـ", ex: "Er beschäftigt sich mit Politik." },
        { de: "bestehen aus", fr: "se composer de", ar: "يتكوّن من", ex: "Wasser besteht aus H und O." },
        { de: "abhängen von", fr: "dépendre de", ar: "يعتمد على", ex: "Das hängt vom Wetter ab." },
        { de: "darauf", fr: "là-dessus", ar: "على ذلك", ex: "Ich freue mich darauf." },
        { de: "worauf", fr: "sur quoi", ar: "على ماذا", ex: "Worauf wartest du?" },
      ],
      exercises: [
        { type: "fill", q: "Ich freue mich ___ (sur cela).", ans: "darauf", tip: "da+r+auf." },
        { type: "translate", q: "« De quoi parles-tu ? »", ans: "Wovon sprichst du?", tip: "wo+von." },
      ],
    }],
  },
  {
    id: "b2_u9", title: "Adjektive mit Präposition", titleAr: "صفات مع حروف جرّ",
    icon: "💡", desc: "stolz auf, abhängig von", descAr: "صفات ثابتة + حرف",
    color: "#ef4444", level: "B2",
    lessons: [{
      id: "b2_u9_l1", title: "Liste essentielle", titleAr: "قائمة أساسية",
      content: `Apprendre l'adjectif **avec** sa préposition :\n• stolz **auf** + Akk\n• zufrieden **mit** + Dat\n• abhängig **von** + Dat\n• fähig **zu** + Dat\n• bekannt **für** + Akk`,
      vocab: [
        { de: "stolz auf", fr: "fier de", ar: "فخور بـ", ex: "Ich bin stolz auf dich." },
        { de: "zufrieden mit", fr: "satisfait de", ar: "راضٍ عن", ex: "Sie ist zufrieden mit der Arbeit." },
        { de: "abhängig von", fr: "dépendant de", ar: "معتمد على", ex: "Wir sind abhängig vom Öl." },
        { de: "bekannt für", fr: "connu pour", ar: "معروف بـ", ex: "Köln ist bekannt für den Dom." },
      ],
      exercises: [
        { type: "qcm", q: "Ich bin stolz ___ meinen Sohn.", opts: ["auf","an","für","von"], ans: 0, tip: "stolz + auf + Akk." },
        { type: "fill", q: "Sie ist zufrieden ___ dem Ergebnis.", ans: "mit", tip: "zufrieden + mit + Dat." },
      ],
    }],
  },
  {
    id: "b2_u10", title: "Textarbeit & Konnektoren formels", titleAr: "العمل على النص",
    icon: "📰", desc: "einerseits…andererseits, zwar…aber", descAr: "أدوات الربط الرسمية",
    color: "#06b6d4", level: "B2",
    lessons: [{
      id: "b2_u10_l1", title: "Argumenter à l'écrit", titleAr: "الحجاج كتابيًا",
      content: `**einerseits … andererseits** = d'une part… d'autre part.\n**zwar … aber** = certes… mais.\n**je … desto** = plus… plus.\n**nicht nur … sondern auch** = non seulement… mais aussi.`,
      vocab: [
        { de: "einerseits … andererseits", fr: "d'une part… d'autre part", ar: "من جهة... من جهة أخرى", ex: "Einerseits ist es teuer, andererseits ist es gut." },
        { de: "zwar … aber", fr: "certes… mais", ar: "صحيح... لكن", ex: "Zwar ist es kalt, aber sonnig." },
        { de: "je … desto", fr: "plus… plus", ar: "كلّما... كلّما", ex: "Je mehr, desto besser." },
        { de: "nicht nur … sondern auch", fr: "non seulement… mais aussi", ar: "ليس فقط... بل أيضًا", ex: "Nicht nur klug, sondern auch fleißig." },
      ],
      exercises: [
        { type: "translate", q: "« Plus on apprend, mieux on parle. »", ans: "Je mehr man lernt, desto besser spricht man", tip: "je…desto + ordre inversé." },
        { type: "fill", q: "Zwar ist es kalt, ___ es ist sonnig.", ans: "aber", tip: "zwar…aber." },
      ],
    }],
  },
];

export const UNITS_B2: import("./curriculum").Unit[] = [...UNITS_B2_BASE, ...NETZWERK_B2];
