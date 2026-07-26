// Dialogues interactifs audio mot-par-mot
export interface DialogLine {
  speaker: string;          // ex: "🚖 Taxifahrer"
  speakerColor: string;     // hsl raw value
  side: "left" | "right";   // bulle gauche/droite
  de: string[];             // mots allemands
  fr: string;               // traduction FR
  note?: string;
}

export interface InteractiveDialog {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  intro: string;
  lines: DialogLine[];
}

const PRIMARY = "hsl(217 91% 60%)";   // bleu (visiteur/client)
const ACCENT = "hsl(45 93% 47%)";     // jaune (commerçant/agent)

export const TAXI_DIALOG: InteractiveDialog = {
  id: "taxi",
  icon: "🚖",
  title: "Taxi à Brême",
  subtitle: "Visiter la ville · Bildgeschichte",
  intro: "📖 Un visiteur arrive à Brême et demande au taxi de l'amener à l'hôtel Weser. Le chauffeur lui montre les monuments en chemin.",
  lines: [
    { speaker: "🧳 Besucher", speakerColor: PRIMARY, side: "right", de: ["Guten", "Tag!", "Zum", "Hotel", "Weser", "bitte."], fr: "Bonjour ! À l'hôtel Weser, s'il vous plaît." },
    { speaker: "🚖 Taxifahrer", speakerColor: ACCENT, side: "left", de: ["Guten", "Tag!", "Kennen", "Sie", "Bremen?"], fr: "Bonjour ! Vous connaissez Brême ?" },
    { speaker: "🧳 Besucher", speakerColor: PRIMARY, side: "right", de: ["Nein,", "leider", "nicht."], fr: "Non, malheureusement pas.", note: "leider = malheureusement" },
    { speaker: "🚖 Taxifahrer", speakerColor: ACCENT, side: "left", de: ["Schauen", "Sie!", "Das", "ist", "das", "Rathaus."], fr: "Regardez ! C'est la mairie.", note: "das Rathaus = la mairie" },
    { speaker: "🚖 Taxifahrer", speakerColor: ACCENT, side: "left", de: ["Und", "dort", "ist", "der", "Dom."], fr: "Et là-bas, c'est la cathédrale.", note: "der Dom = la cathédrale (= die Kirche)" },
    { speaker: "🧳 Besucher", speakerColor: PRIMARY, side: "right", de: ["Wow!", "Sehr", "schön!"], fr: "Wow ! Très beau !" },
    { speaker: "🚖 Taxifahrer", speakerColor: ACCENT, side: "left", de: ["Hier", "ist", "das", "Theater.", "Es", "ist", "modern."], fr: "Ici, c'est le théâtre. Il est moderne.", note: "Pour les comédies musicales" },
    { speaker: "🚖 Taxifahrer", speakerColor: ACCENT, side: "left", de: ["Und", "dort", "sehen", "Sie", "das", "Museum."], fr: "Et là-bas, vous voyez le musée." },
    { speaker: "🚖 Taxifahrer", speakerColor: ACCENT, side: "left", de: ["Das", "ist", "der", "Bahnhof."], fr: "Ça, c'est la gare.", note: "der Bahnhof = la gare" },
    { speaker: "🧳 Besucher", speakerColor: PRIMARY, side: "right", de: ["Ah,", "interessant!"], fr: "Ah, intéressant !" },
    { speaker: "🚖 Taxifahrer", speakerColor: ACCENT, side: "left", de: ["So,", "wir", "sind", "da.", "Das", "Hotel", "Weser."], fr: "Voilà, nous y sommes. L'hôtel Weser." },
    { speaker: "🚖 Taxifahrer", speakerColor: ACCENT, side: "left", de: ["Das", "macht", "10", "Euro."], fr: "Ça fait 10 euros.", note: "Demander/dire le prix" },
    { speaker: "🧳 Besucher", speakerColor: PRIMARY, side: "right", de: ["Bitte", "schön.", "Vielen", "Dank!"], fr: "Tenez. Merci beaucoup !", note: "Bitte schön = Tenez / Je vous en prie" },
    { speaker: "🚖 Taxifahrer", speakerColor: ACCENT, side: "left", de: ["Auf", "Wiedersehen!", "Schönen", "Tag", "noch!"], fr: "Au revoir ! Bonne journée encore !" },
  ],
};

export const RESTAURANT_DIALOG: InteractiveDialog = {
  id: "restaurant",
  icon: "🍽️",
  title: "Au restaurant",
  subtitle: "Commander un repas",
  intro: "📖 Vous entrez dans un restaurant allemand. Le serveur vous accueille, vous commandez un plat et une boisson, puis vous demandez l'addition.",
  lines: [
    { speaker: "👨‍🍳 Kellner", speakerColor: ACCENT, side: "left", de: ["Guten", "Abend!", "Haben", "Sie", "reserviert?"], fr: "Bonsoir ! Avez-vous réservé ?", note: "reservieren = réserver" },
    { speaker: "🧑 Gast", speakerColor: PRIMARY, side: "right", de: ["Nein,", "ich", "habe", "nicht", "reserviert.", "Ist", "ein", "Tisch", "frei?"], fr: "Non, je n'ai pas réservé. Y a-t-il une table libre ?", note: "frei = libre" },
    { speaker: "👨‍🍳 Kellner", speakerColor: ACCENT, side: "left", de: ["Ja,", "kommen", "Sie", "bitte.", "Hier", "ist", "die", "Speisekarte."], fr: "Oui, venez s'il vous plaît. Voici la carte.", note: "die Speisekarte = la carte / le menu" },
    { speaker: "🧑 Gast", speakerColor: PRIMARY, side: "right", de: ["Danke", "schön."], fr: "Merci beaucoup." },
    { speaker: "👨‍🍳 Kellner", speakerColor: ACCENT, side: "left", de: ["Was", "möchten", "Sie", "trinken?"], fr: "Que voulez-vous boire ?", note: "möchten = aimerais (poli)" },
    { speaker: "🧑 Gast", speakerColor: PRIMARY, side: "right", de: ["Ich", "hätte", "gern", "ein", "Mineralwasser", "und", "einen", "Apfelsaft."], fr: "Je voudrais une eau minérale et un jus de pomme.", note: "Ich hätte gern = formule polie pour commander" },
    { speaker: "👨‍🍳 Kellner", speakerColor: ACCENT, side: "left", de: ["Und", "zum", "Essen?"], fr: "Et à manger ?", note: "zum Essen = pour le repas" },
    { speaker: "🧑 Gast", speakerColor: PRIMARY, side: "right", de: ["Ich", "nehme", "das", "Schnitzel", "mit", "Pommes,", "bitte."], fr: "Je prends l'escalope avec des frites, s'il vous plaît.", note: "nehmen = prendre" },
    { speaker: "👨‍🍳 Kellner", speakerColor: ACCENT, side: "left", de: ["Sehr", "gern.", "Möchten", "Sie", "auch", "einen", "Salat?"], fr: "Avec plaisir. Voulez-vous aussi une salade ?" },
    { speaker: "🧑 Gast", speakerColor: PRIMARY, side: "right", de: ["Nein,", "danke.", "Das", "ist", "alles."], fr: "Non, merci. C'est tout.", note: "Das ist alles = c'est tout" },
    { speaker: "👨‍🍳 Kellner", speakerColor: ACCENT, side: "left", de: ["Guten", "Appetit!"], fr: "Bon appétit !" },
    { speaker: "🧑 Gast", speakerColor: PRIMARY, side: "right", de: ["Danke!", "Es", "schmeckt", "sehr", "gut."], fr: "Merci ! C'est très bon.", note: "schmecken = avoir bon goût" },
    { speaker: "🧑 Gast", speakerColor: PRIMARY, side: "right", de: ["Die", "Rechnung,", "bitte."], fr: "L'addition, s'il vous plaît.", note: "die Rechnung = l'addition" },
    { speaker: "👨‍🍳 Kellner", speakerColor: ACCENT, side: "left", de: ["Das", "macht", "achtzehn", "Euro", "fünfzig."], fr: "Ça fait 18 euros 50." },
    { speaker: "🧑 Gast", speakerColor: PRIMARY, side: "right", de: ["Hier", "sind", "zwanzig", "Euro.", "Stimmt", "so."], fr: "Voici 20 euros. Gardez la monnaie.", note: "Stimmt so = Gardez la monnaie" },
    { speaker: "👨‍🍳 Kellner", speakerColor: ACCENT, side: "left", de: ["Vielen", "Dank!", "Auf", "Wiedersehen!"], fr: "Merci beaucoup ! Au revoir !" },
  ],
};

export const SUPERMARKET_DIALOG: InteractiveDialog = {
  id: "supermarket",
  icon: "🛒",
  title: "Au supermarché",
  subtitle: "Faire les courses",
  intro: "📖 Vous faites vos courses au supermarché. Vous demandez où sont les produits, comparez les prix et passez à la caisse.",
  lines: [
    { speaker: "🧑 Kunde", speakerColor: PRIMARY, side: "right", de: ["Entschuldigung,", "wo", "ist", "die", "Milch?"], fr: "Excusez-moi, où est le lait ?", note: "die Milch = le lait" },
    { speaker: "👩 Verkäuferin", speakerColor: ACCENT, side: "left", de: ["Die", "Milch", "ist", "dort", "hinten,", "neben", "dem", "Käse."], fr: "Le lait est là-bas au fond, à côté du fromage.", note: "neben = à côté de · der Käse = le fromage" },
    { speaker: "🧑 Kunde", speakerColor: PRIMARY, side: "right", de: ["Danke!", "Und", "haben", "Sie", "frisches", "Brot?"], fr: "Merci ! Et avez-vous du pain frais ?", note: "frisch = frais · das Brot = le pain" },
    { speaker: "👩 Verkäuferin", speakerColor: ACCENT, side: "left", de: ["Ja,", "natürlich.", "Das", "Brot", "ist", "vorne", "bei", "der", "Kasse."], fr: "Oui, bien sûr. Le pain est devant, près de la caisse.", note: "die Kasse = la caisse" },
    { speaker: "🧑 Kunde", speakerColor: PRIMARY, side: "right", de: ["Wie", "viel", "kostet", "ein", "Kilo", "Äpfel?"], fr: "Combien coûte un kilo de pommes ?", note: "kosten = coûter · der Apfel → die Äpfel" },
    { speaker: "👩 Verkäuferin", speakerColor: ACCENT, side: "left", de: ["Ein", "Kilo", "kostet", "zwei", "Euro", "neunzig."], fr: "Un kilo coûte 2 euros 90." },
    { speaker: "🧑 Kunde", speakerColor: PRIMARY, side: "right", de: ["Das", "ist", "günstig.", "Ich", "nehme", "zwei", "Kilo."], fr: "C'est bon marché. Je prends deux kilos.", note: "günstig = avantageux / pas cher" },
    { speaker: "🧑 Kunde", speakerColor: PRIMARY, side: "right", de: ["Ich", "brauche", "auch", "Tomaten", "und", "Kartoffeln."], fr: "J'ai aussi besoin de tomates et de pommes de terre.", note: "brauchen = avoir besoin de" },
    { speaker: "👩 Verkäuferin", speakerColor: ACCENT, side: "left", de: ["Das", "Gemüse", "ist", "hier", "links."], fr: "Les légumes sont ici à gauche.", note: "das Gemüse = les légumes" },
    { speaker: "🧑 Kunde", speakerColor: PRIMARY, side: "right", de: ["Wo", "kann", "ich", "bezahlen?"], fr: "Où puis-je payer ?", note: "bezahlen = payer" },
    { speaker: "👩 Verkäuferin", speakerColor: ACCENT, side: "left", de: ["An", "der", "Kasse", "vorne", "rechts."], fr: "À la caisse, devant à droite." },
    { speaker: "👨 Kassierer", speakerColor: ACCENT, side: "left", de: ["Das", "macht", "fünfzehn", "Euro", "zwanzig.", "Bar", "oder", "mit", "Karte?"], fr: "Ça fait 15 euros 20. En espèces ou par carte ?", note: "bar = en espèces · die Karte = la carte" },
    { speaker: "🧑 Kunde", speakerColor: PRIMARY, side: "right", de: ["Mit", "Karte,", "bitte."], fr: "Par carte, s'il vous plaît." },
    { speaker: "👨 Kassierer", speakerColor: ACCENT, side: "left", de: ["Möchten", "Sie", "eine", "Tüte?"], fr: "Voulez-vous un sac ?", note: "die Tüte = le sac" },
    { speaker: "🧑 Kunde", speakerColor: PRIMARY, side: "right", de: ["Ja,", "bitte.", "Hier", "ist", "die", "Quittung?"], fr: "Oui, s'il vous plaît. Voici le reçu ?", note: "die Quittung = le reçu" },
    { speaker: "👨 Kassierer", speakerColor: ACCENT, side: "left", de: ["Ja,", "bitte", "schön.", "Schönen", "Tag!"], fr: "Oui, voilà. Bonne journée !" },
  ],
};

export const PHARMACY_DIALOG: InteractiveDialog = {
  id: "pharmacy",
  icon: "💊",
  title: "À la pharmacie",
  subtitle: "Demander un médicament",
  intro: "📖 Vous êtes malade et allez à la pharmacie. Vous décrivez vos symptômes et la pharmacienne vous conseille un médicament.",
  lines: [
    { speaker: "💊 Apothekerin", speakerColor: ACCENT, side: "left", de: ["Guten", "Tag!", "Wie", "kann", "ich", "Ihnen", "helfen?"], fr: "Bonjour ! Comment puis-je vous aider ?", note: "helfen = aider" },
    { speaker: "🤒 Patient", speakerColor: PRIMARY, side: "right", de: ["Guten", "Tag.", "Ich", "fühle", "mich", "nicht", "gut."], fr: "Bonjour. Je ne me sens pas bien.", note: "sich fühlen = se sentir" },
    { speaker: "💊 Apothekerin", speakerColor: ACCENT, side: "left", de: ["Was", "haben", "Sie", "denn?"], fr: "Qu'est-ce que vous avez ?", note: "Qu'avez-vous comme problème ?" },
    { speaker: "🤒 Patient", speakerColor: PRIMARY, side: "right", de: ["Ich", "habe", "Kopfschmerzen", "und", "Halsschmerzen."], fr: "J'ai mal à la tête et mal à la gorge.", note: "die Kopfschmerzen = maux de tête · die Halsschmerzen = mal de gorge" },
    { speaker: "💊 Apothekerin", speakerColor: ACCENT, side: "left", de: ["Haben", "Sie", "auch", "Fieber?"], fr: "Avez-vous aussi de la fièvre ?", note: "das Fieber = la fièvre" },
    { speaker: "🤒 Patient", speakerColor: PRIMARY, side: "right", de: ["Ja,", "ein", "bisschen.", "Achtunddreißig", "Grad."], fr: "Oui, un peu. 38 degrés.", note: "ein bisschen = un peu" },
    { speaker: "💊 Apothekerin", speakerColor: ACCENT, side: "left", de: ["Seit", "wann", "sind", "Sie", "krank?"], fr: "Depuis quand êtes-vous malade ?", note: "seit wann = depuis quand · krank = malade" },
    { speaker: "🤒 Patient", speakerColor: PRIMARY, side: "right", de: ["Seit", "zwei", "Tagen."], fr: "Depuis deux jours." },
    { speaker: "💊 Apothekerin", speakerColor: ACCENT, side: "left", de: ["Ich", "empfehle", "Ihnen", "diese", "Tabletten."], fr: "Je vous recommande ces comprimés.", note: "empfehlen = recommander · die Tablette = le comprimé" },
    { speaker: "💊 Apothekerin", speakerColor: ACCENT, side: "left", de: ["Nehmen", "Sie", "dreimal", "täglich", "eine", "Tablette."], fr: "Prenez un comprimé trois fois par jour.", note: "dreimal täglich = trois fois par jour" },
    { speaker: "🤒 Patient", speakerColor: PRIMARY, side: "right", de: ["Vor", "oder", "nach", "dem", "Essen?"], fr: "Avant ou après le repas ?", note: "vor = avant · nach = après" },
    { speaker: "💊 Apothekerin", speakerColor: ACCENT, side: "left", de: ["Nach", "dem", "Essen,", "mit", "viel", "Wasser."], fr: "Après le repas, avec beaucoup d'eau." },
    { speaker: "🤒 Patient", speakerColor: PRIMARY, side: "right", de: ["Brauche", "ich", "ein", "Rezept?"], fr: "Ai-je besoin d'une ordonnance ?", note: "das Rezept = l'ordonnance" },
    { speaker: "💊 Apothekerin", speakerColor: ACCENT, side: "left", de: ["Nein,", "diese", "Tabletten", "sind", "rezeptfrei."], fr: "Non, ces comprimés sont sans ordonnance.", note: "rezeptfrei = sans ordonnance" },
    { speaker: "🤒 Patient", speakerColor: PRIMARY, side: "right", de: ["Wie", "viel", "kostet", "das?"], fr: "Combien ça coûte ?" },
    { speaker: "💊 Apothekerin", speakerColor: ACCENT, side: "left", de: ["Acht", "Euro", "fünfzig,", "bitte."], fr: "8 euros 50, s'il vous plaît." },
    { speaker: "🤒 Patient", speakerColor: PRIMARY, side: "right", de: ["Hier,", "bitte.", "Vielen", "Dank!"], fr: "Voici, s'il vous plaît. Merci beaucoup !" },
    { speaker: "💊 Apothekerin", speakerColor: ACCENT, side: "left", de: ["Gute", "Besserung!"], fr: "Bon rétablissement !", note: "Gute Besserung = formule pour souhaiter la guérison" },
  ],
};

export const ALL_DIALOGS: InteractiveDialog[] = [
  TAXI_DIALOG,
  RESTAURANT_DIALOG,
  SUPERMARKET_DIALOG,
  PHARMACY_DIALOG,
];

export function getDialog(id: string): InteractiveDialog | undefined {
  return ALL_DIALOGS.find(d => d.id === id);
}
