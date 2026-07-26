import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    const { audioBase64, mimeType, expected, mode, level } = await req.json();
    if (!audioBase64) throw new Error('audioBase64 required');

    // 1) STT
    const bin = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const ext = (mimeType || 'audio/webm').includes('mp4') ? 'mp4'
      : (mimeType || '').includes('wav') ? 'wav'
      : (mimeType || '').includes('mpeg') ? 'mp3' : 'webm';
    const fd = new FormData();
    fd.append('model', 'openai/gpt-4o-transcribe');
    fd.append('language', 'de');
    fd.append('file', new Blob([bin], { type: mimeType || 'audio/webm' }), `rec.${ext}`);

    const sttRes = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: fd,
    });
    if (!sttRes.ok) {
      const t = await sttRes.text();
      return new Response(JSON.stringify({ error: 'STT failed', status: sttRes.status, details: t }),
        { status: sttRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const sttJson = await sttRes.json();
    const transcript: string = sttJson.text || '';

    // 2) Grade with chat model
    const sys = `Tu es un coach vocal d'allemand niveau ${level || 'A2'}. Réponds STRICTEMENT en JSON:
{
 "pronunciation_score": 0-100,
 "grammar_score": 0-100,
 "vocabulary_score": 0-100,
 "overall_score": 0-100,
 "feedback_fr": "conseils concrets en français (2-3 phrases)",
 "corrected_de": "version corrigée en allemand",
 "next_challenge_de": "une phrase à répéter pour progresser"
}`;
    const userMsg = mode === 'repeat' && expected
      ? `Phrase cible: "${expected}"\nCe que l'élève a dit: "${transcript}"\nNote la fidélité de la prononciation par rapport à la cible.`
      : `Mode conversation libre. Ce que l'élève a dit: "${transcript}"\nÉvalue prononciation, grammaire et richesse.`;

    const chatRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: userMsg },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!chatRes.ok) {
      const t = await chatRes.text();
      return new Response(JSON.stringify({ error: 'Grading failed', status: chatRes.status, details: t, transcript }),
        { status: chatRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const chatJson = await chatRes.json();
    let evaluation: unknown = {};
    try { evaluation = JSON.parse(chatJson.choices?.[0]?.message?.content || '{}'); } catch { /* keep raw */ }

    return new Response(JSON.stringify({ transcript, evaluation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
