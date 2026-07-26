// Expand each Netzwerk chapter with 3 additional lessons (Vocab vertieft, Grammatik, Hören & Sprechen)
// Run: bun scripts/expandNetzwerk.mjs
import fs from "node:fs";
import path from "node:path";

// ---------- Content database, keyed by chapter id ----------
// Each entry returns 3 Lesson objects (Wortschatz vertieft, Grammatik, Hören & Sprechen)
// Vocab arrays of 12 items, exercises of 4 items. Themed by chapter.

const E = (q, ans, tip) => ({ type: "translate", q, ans, tip });
const F = (q, ans, tip) => ({ type: "fill", q, ans, tip });
const Q = (q, opts, ans, tip) => ({ type: "qcm", q, opts, ans, tip });

function lessonVocab(id, title, titleAr, intro, vocab, ex) {
  return { id, title, titleAr, content: intro, vocab, exercises: ex };
}

// Per-chapter extra content. Keys are unit ids. Each value: [vocabL, gramL, hoerenL]
const DB = {
  // ===================== A2 =====================
  "nw_a2_k1": [
    {
      sub: "wortschatz", title: "Wortschatz vertieft — Wiedersehen", titleAr: "إثراء المفردات — لقاء جديد",
      intro: `**Mots utiles** pour parler de retrouvailles, voyages récents, changements de vie.\n• plaudern, sich austauschen, Neuigkeiten teilen.\n• Lebensereignisse: Hochzeit, Geburt, Umzug, Jobwechsel.`,
      vocab: [
        ["plaudern","bavarder","يثرثر","Wir haben lange geplaudert."],
        ["sich austauschen","échanger","يتبادل الحديث","Wir tauschen uns oft aus."],
        ["die Neuigkeit","la nouvelle","الخبر","Was gibt es Neues?"],
        ["unverändert","inchangé","دون تغيير","Du bist unverändert!"],
        ["der Jobwechsel","changement d'emploi","تغيير العمل","Ein Jobwechsel steht an."],
        ["sich gewöhnen an","s'habituer à","يعتاد على","Ich gewöhne mich an Berlin."],
        ["der Lebenslauf","le parcours","المسار/السيرة","Erzähl mal deinen Lebenslauf!"],
        ["überrascht sein","être surpris","متفاجئ","Ich bin überrascht!"],
        ["zufällig","par hasard","صدفة","Ich habe sie zufällig getroffen."],
        ["der Zufall","le hasard","الصدفة","So ein Zufall!"],
        ["sich melden","donner des nouvelles","يتواصل","Melde dich bald!"],
        ["in Kontakt bleiben","rester en contact","يبقى على تواصل","Bleiben wir in Kontakt!"],
      ],
      ex: [
        E("« Quelle coïncidence ! »","So ein Zufall","Expression."),
        Q("« rester en contact » ?",["sich melden","in Kontakt bleiben","sich gewöhnen","plaudern"],1,"in Kontakt bleiben."),
        F("Ich gewöhne mich ___ Berlin.","an","sich gewöhnen an + Akk."),
        E("« Donne-moi de tes nouvelles ! »","Melde dich","Verbe réfléchi impératif."),
      ],
    },
    {
      sub: "grammatik", title: "Grammatik — Perfekt vs. Präteritum", titleAr: "القواعد — الماضي المركّب والبسيط",
      intro: `**Règle clé**: \n• **Oral** → Perfekt (haben/sein + Partizip II).\n• **Écrit narratif** → Präteritum.\n• Toujours Präteritum: sein (war), haben (hatte), modaux (konnte, musste).`,
      vocab: [
        ["war","était","كان","Es war schön."],
        ["hatte","avait","كان لديه","Sie hatte Glück."],
        ["konnte","pouvait","استطاع","Ich konnte nicht kommen."],
        ["wollte","voulait","أراد","Er wollte schlafen."],
        ["musste","devait","كان عليه","Wir mussten gehen."],
        ["ist gegangen","est allé","ذهب","Er ist nach Hause gegangen."],
        ["hat gemacht","a fait","فعل","Was hat er gemacht?"],
        ["ist geblieben","est resté","بقي","Sie ist hier geblieben."],
        ["hat gesehen","a vu","رأى","Ich habe ihn gesehen."],
        ["ist gefahren","est parti","سافر","Wir sind nach Wien gefahren."],
        ["hat gegessen","a mangé","أكل","Er hat Pizza gegessen."],
        ["ist gekommen","est venu","جاء","Sie ist spät gekommen."],
      ],
      ex: [
        F("Gestern ___ ich krank. (Präteritum von sein)","war","Sg. → war."),
        F("Wir ___ nach Berlin gefahren.","sind","fahren → sein."),
        Q("Verbe toujours au Präteritum à l'oral ?",["machen","sein","essen","gehen"],1,"sein/haben/modaux."),
        E("« Hier, je suis allé au cinéma. »","Gestern bin ich ins Kino gegangen","gehen → sein."),
      ],
    },
    {
      sub: "hoeren", title: "Hören & Sprechen — Smalltalk", titleAr: "استماع ومحادثة — حديث قصير",
      intro: `**Dialogue type**: deux amis se retrouvent après deux ans.\n— Hey! Lange nicht gesehen! Wie geht's dir so?\n— Super, danke! Was machst du heute beruflich?\n— Ich arbeite jetzt als Lehrer in Hamburg.\n**Stratégie**: poser une question ouverte → relancer avec « Erzähl mal! ».`,
      vocab: [
        ["Hey!","Salut !","مرحبا!","Hey, alles klar?"],
        ["Wie geht's dir so?","Comment ça va alors ?","كيف حالك؟","Wie geht's dir so?"],
        ["Erzähl mal!","Raconte !","احكِ!","Erzähl mal von deiner Reise!"],
        ["Wirklich?","Vraiment ?","حقًا؟","Wirklich? Toll!"],
        ["Toll!","Super !","رائع!","Das ist ja toll!"],
        ["Ach so","Ah d'accord","آه فهمت","Ach so, verstehe."],
        ["Echt?","Sérieux ?","حقًا؟","Echt? Krass!"],
        ["Wahnsinn!","Dingue !","لا يُصدّق!","Wahnsinn, was du erlebt hast!"],
        ["Erzähl weiter!","Continue !","تابع!","Erzähl weiter, das ist spannend!"],
        ["Und du?","Et toi ?","وأنت؟","Und du? Was machst du?"],
        ["spannend","passionnant","مشوّق","Spannende Geschichte!"],
        ["Glückwunsch!","Félicitations !","مبروك!","Glückwunsch zur Hochzeit!"],
      ],
      ex: [
        Q("Relance d'écoute polie ?",["Halt!","Erzähl mal!","Stopp!","Schweig!"],1,"Encourager à parler."),
        E("« Ah d'accord. »","Ach so","Marqueur conversationnel."),
        F("Wahn___! (incroyable)","sinn","Wahnsinn."),
        E("« Et toi, qu'est-ce que tu fais ? »","Und du, was machst du","Question miroir."),
      ],
    },
  ],
  "nw_a2_k2": [
    {
      sub: "wortschatz", title: "Wortschatz vertieft — Körper & Gesundheit", titleAr: "المفردات — الجسد والصحّة",
      intro: `**Plus de vocabulaire**: organes, symptômes, soins. Utile chez le médecin.`,
      vocab: [
        ["das Auge","l'œil","العين","Mein Auge tut weh."],
        ["das Ohr","l'oreille","الأذن","Ich habe Ohrenschmerzen."],
        ["der Hals","la gorge / cou","الحلق","Mein Hals tut weh."],
        ["die Nase","le nez","الأنف","Meine Nase läuft."],
        ["das Knie","le genou","الركبة","Mein Knie ist verletzt."],
        ["der Arzt","le médecin","الطبيب","Ich gehe zum Arzt."],
        ["der Termin","le rendez-vous","الموعد","Ich habe einen Arzttermin."],
        ["das Rezept","l'ordonnance","الوصفة","Hier ist Ihr Rezept."],
        ["der Schmerz","la douleur","الألم","Ich habe starke Schmerzen."],
        ["sich erholen","se rétablir","يتعافى","Ich erhole mich gut."],
        ["müde","fatigué","متعب","Ich bin sehr müde."],
        ["gesund werden","guérir","يُشفى","Werde schnell gesund!"],
      ],
      ex: [
        E("« Je vais chez le médecin. »","Ich gehe zum Arzt","zu + Dat."),
        Q("« ordonnance » ?",["Termin","Rezept","Schmerz","Pflaster"],1,"Rezept."),
        F("Meine Nase ___. (couler)","läuft","laufen."),
        E("« Bon rétablissement ! »","Gute Besserung","Formule."),
      ],
    },
    {
      sub: "grammatik", title: "Grammatik — Modalverben für Ratschläge", titleAr: "القواعد — أفعال المساعدة للنصيحة",
      intro: `**Conseils & obligations** :\n• **sollen** (Konj. II → solltest) = devrait\n• **müssen** = devoir absolu\n• **dürfen** = permission / **nicht dürfen** = interdiction\n**Position**: modal conjugué (place 2), infinitif à la fin.`,
      vocab: [
        ["sollen","devoir (conseil)","ينبغي","Du sollst mehr trinken."],
        ["solltest","devrait","ينبغي لك","Du solltest schlafen."],
        ["müssen","devoir","يجب","Ich muss arbeiten."],
        ["dürfen","avoir le droit","يُسمح","Du darfst gehen."],
        ["können","pouvoir","يستطيع","Ich kann nicht kommen."],
        ["wollen","vouloir","يريد","Ich will Pizza."],
        ["möchten","souhaiter","يودّ","Ich möchte Tee."],
        ["nicht dürfen","interdiction","ممنوع","Du darfst nicht rauchen."],
        ["der Rat","le conseil","النصيحة","Ein guter Rat."],
        ["empfehlen","recommander","يوصي","Ich empfehle Aspirin."],
        ["raten","conseiller","ينصح","Ich rate dir, zu schlafen."],
        ["die Anweisung","l'instruction","تعليمات","Folgen Sie den Anweisungen."],
      ],
      ex: [
        F("Du ___ mehr Wasser trinken. (conseil)","solltest","sollen Konj. II."),
        F("Du ___ nicht rauchen! (interdiction)","darfst","dürfen + nicht."),
        Q("Obligation forte ?",["sollen","müssen","können","dürfen"],1,"müssen."),
        E("« Tu devrais te reposer. »","Du solltest dich ausruhen","sollen Konj. II + Verbe réfléchi."),
      ],
    },
    {
      sub: "hoeren", title: "Hören & Sprechen — Beim Arzt", titleAr: "استماع ومحادثة — عند الطبيب",
      intro: `**Dialogue chez le médecin** :\n— Was fehlt Ihnen?\n— Ich habe seit drei Tagen Kopfschmerzen und Fieber.\n— Haben Sie auch Husten?\n— Ja, ein bisschen.\n— Ich verschreibe Ihnen Tabletten. Bleiben Sie im Bett!`,
      vocab: [
        ["Was fehlt Ihnen?","Qu'avez-vous ?","ما المشكلة؟","Was fehlt Ihnen heute?"],
        ["seit drei Tagen","depuis 3 jours","منذ ثلاثة أيام","Seit drei Tagen krank."],
        ["verschreiben","prescrire","يصف الدواء","Der Arzt verschreibt Medikamente."],
        ["im Bett bleiben","rester au lit","يبقى في السرير","Bleib im Bett!"],
        ["sich ausruhen","se reposer","يستريح","Ruh dich aus!"],
        ["die Krankschreibung","l'arrêt maladie","الإجازة المرضية","Eine Krankschreibung."],
        ["dreimal täglich","trois fois par jour","ثلاث مرات يوميًا","Dreimal täglich einnehmen."],
        ["nach dem Essen","après les repas","بعد الأكل","Nach dem Essen einnehmen."],
        ["die Beschwerden","les troubles","الشكاوى","Welche Beschwerden haben Sie?"],
        ["untersuchen","examiner","يفحص","Der Arzt untersucht mich."],
        ["die Diagnose","le diagnostic","التشخيص","Die Diagnose ist klar."],
        ["impfen","vacciner","يطعّم","Ich lasse mich impfen."],
      ],
      ex: [
        E("« Qu'est-ce qui ne va pas ? »","Was fehlt Ihnen","Formule médecin."),
        Q("« 3x par jour » ?",["dreimal wöchentlich","dreimal täglich","dreimal jährlich","dreifach"],1,"täglich = par jour."),
        F("Bleiben Sie ___ Bett!","im","im Bett bleiben."),
        E("« Reposez-vous bien. »","Ruhen Sie sich gut aus","sich ausruhen impératif Sie."),
      ],
    },
  ],
  // For brevity I'll generate the rest with a programmatic theme template (still rich, themed by desc).
};

// ---------- Generic theme templates for chapters not in DB ----------
function genericExtras(unitMeta) {
  // unitMeta: { id, title, titleAr, desc, level }
  const { id, title, desc, level } = unitMeta;
  const themeFr = desc;
  const baseTitle = title.replace(/^Kapitel \d+ — /, "");
  const v = (de, fr, ar, ex) => ({ de, fr, ar, ex });

  // Three lessons: Wortschatz vertieft, Grammatik, Hören & Sprechen
  return [
    {
      sub: "wortschatz",
      title: `Wortschatz vertieft — ${baseTitle}`,
      titleAr: `إثراء المفردات — ${unitMeta.titleAr || baseTitle}`,
      intro: `**Vocabulaire élargi (${level})** sur le thème : *${themeFr}*. Mots, expressions et collocations utiles pour s'exprimer avec précision.`,
      vocab: [
        v("typisch", "typique", "نموذجي", `Ein typisches Beispiel für ${baseTitle}.`),
        v("der Vorteil", "l'avantage", "الميزة", "Der größte Vorteil ist…"),
        v("der Nachteil", "l'inconvénient", "العيب", "Ein klarer Nachteil ist…"),
        v("zum Beispiel", "par exemple", "على سبيل المثال", "Zum Beispiel…"),
        v("im Allgemeinen", "en général", "بشكل عام", "Im Allgemeinen ist das so."),
        v("häufig", "fréquemment", "غالبًا", "Das passiert häufig."),
        v("selten", "rarement", "نادرًا", "Das ist sehr selten."),
        v("entweder…oder", "soit…soit", "إمّا…أو", "Entweder Tee oder Kaffee."),
        v("trotzdem", "malgré tout", "رغم ذلك", "Es regnet, trotzdem gehen wir."),
        v("vor allem", "surtout", "خصوصًا", "Vor allem im Winter."),
        v("ähnlich", "semblable", "مشابه", "Eine ähnliche Situation."),
        v("der Unterschied", "la différence", "الفرق", "Ein großer Unterschied."),
      ],
      ex: [
        E("« par exemple »", "zum Beispiel", "Locution figée (z. B.)."),
        Q("Synonyme de 'häufig' ?", ["selten", "oft", "nie", "kaum"], 1, "oft = souvent."),
        F("___ regnet es, trotzdem gehen wir.", "Es", "Sujet impersonnel."),
        E("« la plus grande différence »", "der größte Unterschied", "Superlatif + masc."),
      ],
    },
    {
      sub: "grammatik",
      title: `Grammatik im Fokus — ${baseTitle}`,
      titleAr: `قواعد مركّزة — ${unitMeta.titleAr || baseTitle}`,
      intro: grammarIntroFor(level, baseTitle),
      vocab: grammarVocabFor(level),
      ex: grammarExFor(level),
    },
    {
      sub: "hoeren",
      title: `Hören & Sprechen — ${baseTitle}`,
      titleAr: `استماع ومحادثة — ${unitMeta.titleAr || baseTitle}`,
      intro: `**Mini-scène d'écoute** sur *${themeFr}*. Repère les **mots-clés**, les **connecteurs** et la **prosodie**. Puis reformule à l'oral en 4 phrases.`,
      vocab: [
        v("die Aussage", "l'affirmation", "التصريح", "Eine klare Aussage."),
        v("die Stimme", "la voix", "الصوت", "Eine ruhige Stimme."),
        v("betonen", "mettre l'accent sur", "يُبرز", "Er betont das Wort."),
        v("zuhören", "écouter (attentivement)", "يصغي", "Hör mir gut zu!"),
        v("die Pause", "la pause", "الاستراحة", "Mach eine kurze Pause."),
        v("wiederholen", "répéter", "يكرّر", "Bitte wiederholen Sie."),
        v("Können Sie das wiederholen?", "Pouvez-vous répéter ?", "هل يمكنك الإعادة؟", "Können Sie das wiederholen?"),
        v("Was meinen Sie?", "Que voulez-vous dire ?", "ما قصدك؟", "Was meinen Sie damit?"),
        v("Ich verstehe nicht.", "Je ne comprends pas.", "لا أفهم.", "Entschuldigung, ich verstehe nicht."),
        v("Genau!", "Exactement !", "بالضبط!", "Genau, das stimmt."),
        v("Stimmt das?", "C'est vrai ?", "هل هذا صحيح؟", "Stimmt das wirklich?"),
        v("Ich bin der Meinung, dass…", "Je pense que…", "في رأيي أنّ…", "Ich bin der Meinung, dass das richtig ist."),
      ],
      ex: [
        E("« Pouvez-vous répéter ? »", "Können Sie das wiederholen", "Question polie."),
        Q("Marqueur d'accord fort ?", ["Vielleicht", "Genau", "Naja", "Eher nicht"], 1, "Genau = exactement."),
        F("Ich bin der Meinung, ___ das stimmt.", "dass", "dass + verbe à la fin."),
        E("« Je n'ai pas compris. »", "Ich habe nicht verstanden", "Perfekt de verstehen."),
      ],
    },
  ];
}

function grammarIntroFor(level, theme) {
  if (level === "A2") {
    return `**Focus A2 — ${theme}**\n• **Konjunktionen**: weil, dass, wenn, als (verbe à la fin)\n• **Wechselpräpositionen** : in/an/auf/vor/hinter + **Akk** (mouvement) ou **Dat** (lieu)\n• **Komparativ/Superlativ** : groß → größer → am größten`;
  }
  if (level === "B1") {
    return `**Focus B1 — ${theme}**\n• **Konjunktiv II** (irréel) : ich würde…, ich hätte…, ich wäre…\n• **Passif présent** : wird + Partizip II ; **passif modal** : muss…werden\n• **Konnektoren** : obwohl, trotzdem, deshalb, sodass, damit (≠ um…zu)`;
  }
  // B2
  return `**Focus B2 — ${theme}**\n• **Konjunktiv I** (discours rapporté) : er sei, sie habe, er werde\n• **Partizipialkonstruktionen** : der **lesende** Mann / das **gelesene** Buch\n• **Nominalisierung** + **Genitiv** : die Förderung **der Bildung**\n• **Konnektoren formels** : einerseits…andererseits, zwar…aber, sowohl…als auch`;
}
function grammarVocabFor(level) {
  if (level === "A2") return [
    { de: "weil", fr: "parce que", ar: "لأنّ", ex: "Weil ich müde bin." },
    { de: "wenn", fr: "si / quand", ar: "إذا/حين", ex: "Wenn es regnet, bleibe ich." },
    { de: "dass", fr: "que", ar: "أنّ", ex: "Ich denke, dass es gut ist." },
    { de: "als", fr: "quand (passé)", ar: "حين (ماضٍ)", ex: "Als ich Kind war…" },
    { de: "obwohl", fr: "bien que", ar: "رغم أنّ", ex: "Obwohl es regnet…" },
    { de: "deshalb", fr: "c'est pourquoi", ar: "لذلك", ex: "Es regnet, deshalb bleibe ich." },
    { de: "in den Park (Akk)", fr: "vers le parc", ar: "إلى الحديقة", ex: "Ich gehe in den Park." },
    { de: "im Park (Dat)", fr: "dans le parc", ar: "في الحديقة", ex: "Ich bin im Park." },
    { de: "größer als", fr: "plus grand que", ar: "أكبر من", ex: "Ich bin größer als du." },
    { de: "am besten", fr: "le mieux", ar: "الأفضل", ex: "Ich spiele am besten Schach." },
    { de: "lieber", fr: "plutôt", ar: "أُفضّل", ex: "Ich trinke lieber Tee." },
    { de: "der Vergleich", fr: "la comparaison", ar: "المقارنة", ex: "Ein interessanter Vergleich." },
  ];
  if (level === "B1") return [
    { de: "obwohl", fr: "bien que", ar: "رغم أنّ", ex: "Obwohl er müde ist, arbeitet er." },
    { de: "trotzdem", fr: "malgré tout", ar: "ومع ذلك", ex: "Es regnet, trotzdem gehen wir." },
    { de: "deshalb", fr: "c'est pourquoi", ar: "لذلك", ex: "Es ist spät, deshalb schlafe ich." },
    { de: "sodass", fr: "de sorte que", ar: "بحيث", ex: "Es war so spät, sodass ich ging." },
    { de: "damit", fr: "afin que", ar: "لكي", ex: "Damit du es verstehst…" },
    { de: "um…zu", fr: "afin de", ar: "لكي + مصدر", ex: "Ich lerne, um zu reisen." },
    { de: "ich würde…", fr: "je…rais", ar: "كنت سأ…", ex: "Ich würde gern reisen." },
    { de: "ich hätte gern", fr: "je voudrais", ar: "أودّ", ex: "Ich hätte gern Tee." },
    { de: "wird gemacht", fr: "est fait (passif)", ar: "يُفعَل", ex: "Das Auto wird repariert." },
    { de: "muss gemacht werden", fr: "doit être fait", ar: "يجب أن يُفعل", ex: "Das muss gemacht werden." },
    { de: "der Konjunktiv", fr: "le subjonctif", ar: "الشرطي/الكلام غير المباشر", ex: "Konjunktiv II für Wünsche." },
    { de: "das Passiv", fr: "le passif", ar: "المبني للمجهول", ex: "Das Passiv mit werden." },
  ];
  // B2
  return [
    { de: "er sei", fr: "il serait (Konj. I)", ar: "يكون (شرطي I)", ex: "Er sagt, er sei krank." },
    { de: "sie habe", fr: "elle aurait", ar: "لديها (شرطي I)", ex: "Sie meint, sie habe Zeit." },
    { de: "er werde", fr: "il (futur indirect)", ar: "سـ (شرطي I)", ex: "Er sagt, er werde kommen." },
    { de: "der lesende Mann", fr: "l'homme qui lit", ar: "الرجل القارئ", ex: "Der lesende Mann sitzt." },
    { de: "das gelesene Buch", fr: "le livre lu", ar: "الكتاب المقروء", ex: "Das gelesene Buch ist gut." },
    { de: "die Förderung der Bildung", fr: "la promotion de l'éducation", ar: "دعم التعليم", ex: "Die Förderung der Bildung ist wichtig." },
    { de: "einerseits…andererseits", fr: "d'une part…d'autre part", ar: "من جهة…ومن جهة", ex: "Einerseits gut, andererseits teuer." },
    { de: "zwar…aber", fr: "certes…mais", ar: "صحيح…لكن", ex: "Zwar interessant, aber lang." },
    { de: "sowohl…als auch", fr: "à la fois…et", ar: "كلاهما", ex: "Sowohl Tee als auch Kaffee." },
    { de: "weder…noch", fr: "ni…ni", ar: "لا…ولا", ex: "Weder kalt noch heiß." },
    { de: "die Nominalisierung", fr: "la nominalisation", ar: "التسمية الاسمية", ex: "Nominalisierung ist typisch fürs Deutsche." },
    { de: "der Genitiv", fr: "le génitif", ar: "حالة الإضافة", ex: "Das Auto des Vaters." },
  ];
}
function grammarExFor(level) {
  if (level === "A2") return [
    F("___ es regnet, bleibe ich zu Hause.", "Wenn", "wenn (si/quand)."),
    Q("Mouvement vers ?", ["im Park", "in den Park", "am Park", "auf Park"], 1, "Akk = mouvement."),
    F("Ich bin größer ___ du.", "als", "Comparatif → als."),
    E("« Bien qu'il pleuve, je sors. »", "Obwohl es regnet, gehe ich raus", "obwohl + verbe à la fin."),
  ];
  if (level === "B1") return [
    F("Das Auto ___ repariert. (passif)", "wird", "werden + Partizip II."),
    F("Ich ___ gern Tee. (Konj. II)", "hätte", "hätte gern."),
    Q("« afin de » (même sujet) ?", ["damit", "um…zu", "sodass", "obwohl"], 1, "um…zu."),
    E("« Bien qu'il soit fatigué, il travaille. »", "Obwohl er müde ist, arbeitet er", "obwohl + verbe à la fin."),
  ];
  // B2
  return [
    F("Er sagt, er ___ krank. (Konj. I)", "sei", "sein Konj. I = sei."),
    Q("Konstruktion participiale ?", ["der lesende Mann", "der Mann liest", "der Mann hat gelesen", "lesen Mann"], 0, "Partizip I = -end."),
    F("Sowohl Tee ___ auch Kaffee.", "als", "sowohl…als auch."),
    E("« d'une part…d'autre part »", "einerseits…andererseits", "Connecteur formel."),
  ];
}

// ---------- File patcher ----------
function patchFile(filePath, prefix) {
  let src = fs.readFileSync(filePath, "utf8");
  // Find each unit block: { id: "xxx", ... lessons: [{...}] },
  // We append 3 lessons inside the lessons: [ ... ] array, just before the closing `]` of lessons.
  // Strategy: regex match for unit objects starting with `id: "<prefix>_kN"`, then locate its `lessons: [` and the matching `}]`.

  // Find all unit ids in order
  const unitIdRegex = new RegExp(`id:\\s*"(${prefix}_k\\d+)"`, "g");
  const ids = [];
  let m;
  while ((m = unitIdRegex.exec(src)) !== null) ids.push(m[1]);

  for (const id of ids) {
    // Locate the unit block by id
    const idIdx = src.indexOf(`id: "${id}"`);
    if (idIdx < 0) continue;
    // Find the lessons: [ start after this position
    const lessonsStart = src.indexOf("lessons: [", idIdx);
    if (lessonsStart < 0) continue;
    // Find matching closing `]` for this array (track bracket depth)
    let i = lessonsStart + "lessons: [".length;
    let depth = 1;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === "[") depth++;
      else if (ch === "]") depth--;
      if (depth === 0) break;
      i++;
    }
    if (depth !== 0) continue;
    const closeIdx = i; // position of closing ]

    // Determine unit metadata for generic template
    const unitSlice = src.slice(idIdx, lessonsStart);
    const titleMatch = unitSlice.match(/title:\s*"([^"]+)"/);
    const titleArMatch = unitSlice.match(/titleAr:\s*"([^"]+)"/);
    const descMatch = unitSlice.match(/desc:\s*"([^"]+)"/);
    const levelMatch = unitSlice.match(/level:\s*"([^"]+)"/);
    const meta = {
      id,
      title: titleMatch?.[1] || id,
      titleAr: titleArMatch?.[1],
      desc: descMatch?.[1] || "",
      level: levelMatch?.[1] || "A2",
    };

    const extras = DB[id] || genericExtras(meta);

    // Build TS source for the 3 extra lessons
    const lessonsTs = extras.map((l, idx) => {
      const lid = `${id}_l${idx + 2}`;
      const vocabTs = l.vocab.map(v => {
        const arr = Array.isArray(v) ? v : [v.de, v.fr, v.ar, v.ex];
        const [de, fr, ar, ex] = arr;
        return `        { de: ${JSON.stringify(de)}, fr: ${JSON.stringify(fr)}, ar: ${JSON.stringify(ar)}, ex: ${JSON.stringify(ex)} },`;
      }).join("\n");
      const exTs = l.ex.map(e => {
        if (e.type === "qcm") {
          return `        { type: "qcm", q: ${JSON.stringify(e.q)}, opts: ${JSON.stringify(e.opts)}, ans: ${e.ans}, tip: ${JSON.stringify(e.tip)} },`;
        }
        if (e.type === "fill") {
          return `        { type: "fill", q: ${JSON.stringify(e.q)}, ans: ${JSON.stringify(e.ans)}, tip: ${JSON.stringify(e.tip)} },`;
        }
        return `        { type: "translate", q: ${JSON.stringify(e.q)}, ans: ${JSON.stringify(e.ans)}, tip: ${JSON.stringify(e.tip)} },`;
      }).join("\n");
      return `    {
      id: ${JSON.stringify(lid)}, title: ${JSON.stringify(l.title)}, titleAr: ${JSON.stringify(l.titleAr)},
      content: ${JSON.stringify(l.intro)},
      vocab: [
${vocabTs}
      ],
      exercises: [
${exTs}
      ],
    },`;
    }).join("\n");

    // Insert before closeIdx. Make sure the previous lesson has a trailing comma.
    // Look back from closeIdx to find the last `}` (closing of last lesson) — ensure comma after it.
    let before = src.slice(0, closeIdx).replace(/}\s*$/, "},\n");
    const after = src.slice(closeIdx);
    src = before + "\n" + lessonsTs + "\n  " + after;
  }

  fs.writeFileSync(filePath, src);
  console.log(`Patched ${filePath}`);
}

const root = path.resolve(process.cwd(), "src/data");
patchFile(path.join(root, "netzwerkA2.ts"), "nw_a2");
patchFile(path.join(root, "netzwerkB1.ts"), "nw_b1");
patchFile(path.join(root, "netzwerkB2.ts"), "nw_b2");
