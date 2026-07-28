import { Link } from "react-router-dom";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";

/** Public SEO landing: German for Healthcare Professionals (allemand médical). */
export default function MedicalGerman() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeo
        title="Allemand médical — Cours d'allemand pour professionnels de santé"
        description="Guide complet d'allemand médical (Medizinisches Deutsch) pour médecins, infirmiers et soignants qui veulent travailler en Allemagne : vocabulaire, dialogues et préparation FSP/B2."
        path="/learn/medical-german"
        type="article"
      />

      <header className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Parcours professionnel · Niveau B1 → C1
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Allemand médical : le guide pour travailler en Allemagne
          </h1>
          <p className="mt-3 text-muted-foreground">
            Medizinisches Deutsch pour médecins, infirmiers et professionnels de santé
            francophones. Vocabulaire clinique, dialogues patient-soignant et préparation à
            l'examen de langue professionnelle (Fachsprachprüfung / FSP).
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/auth">Commencer gratuitement</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/pricing">Voir les tarifs</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-6 py-12">
        <section>
          <h2 className="text-2xl font-semibold">Pourquoi apprendre l'allemand médical ?</h2>
          <p className="mt-3 text-muted-foreground">
            L'Allemagne recrute activement des soignants étrangers. La reconnaissance du
            diplôme (Approbation) et l'exercice clinique exigent un niveau B2 général et un
            allemand médical spécialisé validé par la Fachsprachprüfung, organisée par les
            Ärztekammern régionales.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Vocabulaire clinique essentiel</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><strong>Anamnese</strong> — anamnèse, interrogatoire médical</li>
            <li><strong>Beschwerden</strong> — symptômes, plaintes du patient</li>
            <li><strong>Untersuchung</strong> — examen clinique</li>
            <li><strong>Diagnose / Verdachtsdiagnose</strong> — diagnostic / diagnostic présumé</li>
            <li><strong>Therapie / Behandlung</strong> — traitement, prise en charge</li>
            <li><strong>Aufklärung</strong> — information et consentement du patient</li>
            <li><strong>Rezept / Verordnung</strong> — ordonnance</li>
            <li><strong>Überweisung</strong> — lettre d'orientation vers un spécialiste</li>
            <li><strong>Notaufnahme</strong> — service des urgences</li>
            <li><strong>Pflegekraft / Krankenschwester</strong> — infirmier(ère)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Dialogue type : premier contact patient</h2>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg border bg-muted p-4 text-sm">{`— Guten Tag, was führt Sie zu mir?
— Ich habe seit drei Tagen starke Kopfschmerzen und Fieber.
— Seit wann genau? Haben Sie noch andere Beschwerden?
— Auch Übelkeit und Lichtempfindlichkeit.
— Ich werde Sie jetzt untersuchen. Bitte machen Sie den Oberkörper frei.`}</pre>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Préparer la Fachsprachprüfung (FSP)</h2>
          <p className="mt-3 text-muted-foreground">
            L'examen dure environ 60 minutes en trois parties : anamnèse avec un
            patient simulé, rédaction d'un compte-rendu (Arztbrief) et présentation
            orale du cas à un confrère. Notre parcours <em>Medizinisches Deutsch</em>
            entraîne ces trois épreuves avec des mises en situation notées et un retour
            corrigé par IA.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Parcours recommandé</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6 text-muted-foreground">
            <li>Consolider B1/B2 général via <Link className="underline" to="/learn">le parcours DeutschMeister</Link>.</li>
            <li>Ajouter 200 termes de vocabulaire médical (flashcards espacées).</li>
            <li>Pratiquer 20 anamnèses simulées avec le Professeur IA.</li>
            <li>Rédiger 10 Arztbriefe corrigés automatiquement.</li>
            <li>Passer la Fachsprachprüfung blanche avant l'inscription officielle.</li>
          </ol>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Commencez votre parcours médical</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Créez un compte gratuit et accédez au module Allemand médical dès le niveau B1.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild><Link to="/auth">Créer un compte</Link></Button>
            <Button asChild variant="outline"><Link to="/pricing">Tarifs en TND</Link></Button>
          </div>
        </section>
      </main>
    </div>
  );
}
