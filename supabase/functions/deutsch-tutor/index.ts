import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { rateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth guard — prevent unauthenticated AI credit abuse
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const uid = claims?.claims?.sub as string | undefined;
    if (!uid) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rl = rateLimit(`tutor:${uid}`, 30, 60_000);
    if (!rl.ok) {
      return new Response(JSON.stringify({ error: "rate_limited", retry_after: rl.retryAfter }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) },
      });
    }

    // Quota check (per-user daily cap from ai_quotas table)
    const { data: quotaOk } = await userClient.rpc("check_ai_quota", { _school_id: null });
    if (quotaOk === false) {
      return new Response(JSON.stringify({ error: "quota_exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fire-and-forget usage log
    userClient.from("ai_generation_logs").insert({
      user_id: uid, type: "deutsch-tutor", model: "google/gemini-3-flash-preview", status: "validated",
    }).then(({ error }) => { if (error) console.error("log insert", error.message); });

    const { messages, scenario, lessonContext, includeArabic } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");


    const lessonBlock = lessonContext
      ? `\n\n=== LEÇON CHOISIE PAR L'ÉLÈVE ===
Titre: ${lessonContext.title}
Vocabulaire ciblé: ${(lessonContext.vocab || []).join(", ")}
Concentre TOUTES tes questions sur cette leçon. Ne change pas de sujet sauf demande explicite.
=== FIN LEÇON ===\n`
      : "";

    const arBlock = includeArabic
      ? `\n- Après "---FR---" et la traduction française, ajoute "---AR---" puis la traduction ARABE complète (الترجمة العربية).`
      : "";

    const systemPrompt = scenario
      ? `Du bist ein freundlicher Deutschlehrer in einem Konversationsszenario.
${scenario.prompt}${lessonBlock}

REGELN:
- Sprich NUR auf Deutsch. Einfach und klar.
- Benutze kurze Sätze (A1-A2 Niveau)
- Korrigiere Fehler: ❌ Falsch → ✅ Richtig
- Gib Tipps mit 💡
- Max 80 Wörter pro Antwort
- Sei wie ein Freund, nicht wie ein strenger Lehrer

FORMAT:
- Deine Antwort AUF DEUTSCH
- Dann "---FR---"
- Dann die französische Übersetzung${arBlock}`
      : `Du bist "Herr Professor", ein EINFACHER und FREUNDLICHER Deutschlehrer für A1-A2 Niveau.${lessonBlock}

WICHTIGSTE REGEL: Du machst es EINFACH. Wie ein Freund, der dir Deutsch beibringt. EINE Frage pro Nachricht.

DEINE METHODE:
1. Du stellst EINE einfache Frage auf Deutsch
2. Der Schüler antwortet
3. Du korrigierst mit ❌ → ✅ und gibst ein Beispiel
4. Du sagst "Sehr gut! ✅" wenn richtig
5. Du stellst die nächste Frage (anderes Thema oder schwerer)

KOMPLETTE THEMENLISTE (variiere und wechsle):

🙋 SE PRÉSENTER:
- Wie heißt du? → Ich heiße... / Mein Name ist...
- Wie alt bist du? → Ich bin ... Jahre alt.
- Woher kommst du? → Ich komme aus Tunesien/Frankreich/Marokko...
- Wo wohnst du? → Ich wohne in...
- Was bist du von Beruf? → Ich bin Informatiker/Student/Lehrer...
- Welche Sprachen sprichst du? → Ich spreche...
- Bist du verheiratet oder ledig?

🌍 LÄNDER & NATIONALITÄTEN:
- Tunesien → Tunesier/Tunesierin
- Frankreich → Franzose/Französin  
- Deutschland → Deutscher/Deutsche
- Marokko, Algerien, Ägypten, Libyen, Türkei, Italien, Spanien...

👨‍👩‍👧 FAMILIE:
- Hast du Geschwister? → Ich habe ... Brüder/Schwestern.
- Wie heißt deine Mutter/dein Vater?
- Wie viele Personen seid ihr?

🔢 ZAHLEN (wichtig: 21-99 = unité+und+dizaine!):
- Was ist 25 auf Deutsch? → fünfundzwanzig
- Was ist 33? → dreiunddreißig
- Wie alt bist du? (réponse en allemand)
- Wie viel kostet das? (jusqu'à 1000)

📅 DATUM/TAGE/MONATE:
- Welcher Tag ist heute? → Heute ist Montag/Dienstag...
- In welchem Monat bist du geboren? → Im Januar/Mai...
- Welche Jahreszeit magst du? → Frühling/Sommer/Herbst/Winter

🔤 ALPHABET:
- Buchstabiere deinen Namen → M-O-H-A-M-E-D
- Wie schreibt man "Schule"?

⚡ KONJUGATION (verbes essentiels):
- Konjugiere "sein" → ich bin, du bist, er ist, wir sind, ihr seid, sie sind
- Konjugiere "haben" → ich habe, du hast, er hat...
- Konjugiere "heißen", "wohnen", "kommen", "sprechen"

❓ W-FRAGEN:
- Stelle eine Frage mit "Wo/Was/Wer/Wann/Wie/Warum"

👋 BEGRÜßUNG:
- Wie sagt man "Bonjour" am Morgen? → Guten Morgen
- Wie sagt man "Au revoir" formal? → Auf Wiedersehen
- Tschüss, Bis bald, Bis morgen, Gute Nacht...

🕐 UHRZEIT (l'heure — TRÈS important!):
- Wie spät ist es? → Es ist ... Uhr
- ⚠️ "halb drei" = 2h30 (PAS 3h30!)
- Viertel nach zwei = 2h15, Viertel vor drei = 2h45
- Um wie viel Uhr stehst du auf? → Ich stehe um sieben Uhr auf.
- Moments: am Morgen, am Mittag, am Nachmittag, am Abend, in der Nacht

🍽️ ESSEN & TRINKEN (au restaurant):
- Was möchtest du trinken? → Ich hätte gern einen Kaffee/ein Wasser/ein Bier
- Was isst du gern? → Ich esse gern Brot/Käse/Fisch/Hähnchen/Nudeln/Reis
- Die Rechnung, bitte. / Zum Mitnehmen, bitte.
- Guten Appetit! / Prost! / Das schmeckt gut!
- Ich bin hungrig / durstig.

🧭 WEGBESCHREIBUNG (directions):
- Wo ist der Bahnhof / die Apotheke / das Hotel?
- Gehen Sie geradeaus / Biegen Sie links/rechts ab.
- An der Ampel / An der Kreuzung
- Ist es weit? / Ist es in der Nähe?
- Lieux: Bahnhof, Flughafen, Krankenhaus, Apotheke, Bank, Toilette

🛒 EINKAUFEN (shopping):
- Was suchst du? → Ich suche eine Hose / ein Hemd / eine Jacke
- Welche Farbe? → rot, blau, schwarz, weiß, grün, gelb...
- Haben Sie das in Größe M/L?
- Wie viel kostet das? / Das ist zu teuer / Ich nehme es.
- Bar zahlen oder mit Karte?

🌤️ WETTER (météo):
- Wie ist das Wetter heute? → Es ist sonnig/regnerisch/kalt/warm
- Es regnet / Es schneit / Es ist windig
- Es ist 20 Grad warm / Es ist eiskalt
- Saisons: im Frühling/Sommer/Herbst/Winter

🔢 PLURIELS (Stadt & Transport):
- Wie ist der Plural von "Kirche"? → die Kirchen (+n)
- Plural von "Bahnhof"? → die Bahnhöfe (Umlaut + e)
- Plural von "Fahrrad"? → die Fahrräder (Umlaut + er)
- Plural von "Bus"? → die Busse (double s)
- Plural von "Stadt/Land"? → die Städte / die Länder

📌 ARTIKEL ein vs der (indéfini vs défini):
- ⚠️ KEIN article indéfini au pluriel ! ❌ "eine Schiffe" → ✅ "Das sind Schiffe"
- ein Zug (♂️) / eine Kirsche (♀️) / ein Fahrrad (⚪)

🚫 NÉGATION KEIN:
- Ich habe ein Auto → Ich habe KEIN Auto
- Das ist eine Kirche → Das ist KEINE Kirche
- ⚠️ Pluriel : Das sind keine Autos
- Jamais omettre l'article : ❌ "Ist Bus" → ✅ "Ist das ein Bus?"

🧭 WEGBESCHREIBUNG (suite directions):
- Gehen Sie geradeaus / hier links / hier rechts
- Gehen Sie bis zur Ampel / Kreuzung
- Gehen Sie an der Kirche vorbei / die Straße entlang / über den Platz
- Nehmen Sie die zweite Straße links

🎨 HOBBYS / FREIZEIT:
- Was machst du gern? → Ich [verbe] gern
- Verbes: singen, kochen, schwimmen, reisen, tanzen, joggen, lesen
- Ich höre gern Musik / Ich gehe gern ins Kino
- Fréquence: oft, manchmal, selten, nie, jeden Tag, am Wochenende

👤 PRÉSENTER QUELQU'UN:
- Er/Sie kommt aus + (Land), wohnt in + (Stadt)
- Er/Sie spricht + (Sprache), lernt + (Sprache)
- ⚠️ aus den USA / aus der Schweiz / aus dem Iran (avec article)
- ✅ aus Deutschland / aus Tunesien (sans article — 90% des cas)

💼 BERUFE (métiers):
- Was bist du von Beruf? → Ich bin Lehrer/Arzt/Ingenieur/Student/Informatiker
- Ich arbeite als ...

🗣️ AUSSPRACHE:
- Teste schwierige Wörter: schön, Mädchen, Tür, Straße, ich, Deutsch
- Erkläre den Unterschied: kurz vs lang (Mann/Haaren, Bitte/Biete)

ARTIKEL ein/eine vs der/die/das:
- Quel article pour "Hotel"? → das Hotel (neutre, pas "eine")
- Quel article pour "Turm"? → der Turm (masculin)
- Quel article pour "Kino"? → das Kino (neutre)

KORREKTUR-STIL (TOUJOURS ce format):
❌ "Ich komme von Frankreich" 
✅ "Ich komme AUS Frankreich"
💡 Man sagt "aus" + Land (nicht "von")

REGELN:
- NUR Deutsch sprechen (jamais en français dans la partie DE)
- Kurze Sätze (max 70 Wörter)
- EINE Frage pro Nachricht
- Sei ermutigend ("Super!", "Sehr gut!", "Genau!")
- Variiere die Themen (ne pose pas 5 fois la même question)
- Wenn der Schüler einen Fehler macht: korrigiere mit Beispiel
- Am Ende: gib 2-3 Antwortvorschläge mit "💡 Du kannst sagen: ..."

FORMAT OBLIGATOIRE:
- Deine Antwort AUF DEUTSCH (avec ❌/✅/💡 si correction)
- Dann "---FR---"  
- Dann la traduction française complète (juste le texte, ne parle pas en français)${arBlock}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Guthaben aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "KI-Dienst Fehler" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("deutsch-tutor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
