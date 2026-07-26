// Scènes d'écoute "Hören réel" : dialogues authentiques avec ambiance sonore
// associée. Le composant HoerenScenes joue la voix TTS allemande PAR-DESSUS
// le bruit d'ambiance pour simuler une vraie situation.
import type { AmbianceId } from "@/lib/ambientAudio";

export interface HoerenLine {
  speaker: string;       // ex : "Frau", "Herr", "Verkäufer"
  de: string;            // texte allemand prononcé
  fr: string;            // traduction française (affichable à la demande)
}

export interface HoerenScene {
  id: string;
  category: "city" | "transport" | "shopping" | "weather" | "social";
  title: string;
  emoji: string;
  ambiance: AmbianceId;
  level: "A1" | "A2";
  description: string;   // contexte court
  lines: HoerenLine[];
}

export const HOEREN_SCENES: HoerenScene[] = [
  // ===== VILLE =====
  {
    id: "scene_street_directions",
    category: "city",
    title: "Demander son chemin dans la rue",
    emoji: "🗺️",
    ambiance: "street",
    level: "A1",
    description: "Une touriste demande la direction de la gare à un passant.",
    lines: [
      { speaker: "Touristin", de: "Entschuldigung, wo ist der Bahnhof, bitte?", fr: "Excusez-moi, où est la gare, s'il vous plaît ?" },
      { speaker: "Passant", de: "Gehen Sie geradeaus, dann links.", fr: "Allez tout droit, puis à gauche." },
      { speaker: "Touristin", de: "Ist es weit?", fr: "C'est loin ?" },
      { speaker: "Passant", de: "Nein, nur fünf Minuten zu Fuß.", fr: "Non, seulement cinq minutes à pied." },
      { speaker: "Touristin", de: "Vielen Dank!", fr: "Merci beaucoup !" },
      { speaker: "Passant", de: "Bitte schön, schönen Tag noch!", fr: "Je vous en prie, bonne journée !" },
    ],
  },
  {
    id: "scene_cafe_order",
    category: "social",
    title: "Commander dans un café",
    emoji: "☕",
    ambiance: "cafe",
    level: "A1",
    description: "Au comptoir d'un café berlinois.",
    lines: [
      { speaker: "Kellnerin", de: "Guten Tag! Was möchten Sie?", fr: "Bonjour ! Que désirez-vous ?" },
      { speaker: "Kunde", de: "Einen Kaffee, bitte. Mit Milch.", fr: "Un café, s'il vous plaît. Avec du lait." },
      { speaker: "Kellnerin", de: "Klein oder groß?", fr: "Petit ou grand ?" },
      { speaker: "Kunde", de: "Groß, bitte. Und ein Stück Apfelkuchen.", fr: "Grand, s'il vous plaît. Et une part de tarte aux pommes." },
      { speaker: "Kellnerin", de: "Das macht sechs Euro fünfzig.", fr: "Cela fait six euros cinquante." },
      { speaker: "Kunde", de: "Hier, bitte. Stimmt so.", fr: "Voilà. Gardez la monnaie." },
      { speaker: "Kellnerin", de: "Vielen Dank, einen schönen Tag!", fr: "Merci beaucoup, bonne journée !" },
    ],
  },

  // ===== TRANSPORT =====
  {
    id: "scene_train_station",
    category: "transport",
    title: "À la gare : acheter un billet",
    emoji: "🎫",
    ambiance: "train",
    level: "A1",
    description: "Au guichet, achat d'un billet pour Munich.",
    lines: [
      { speaker: "Reisende", de: "Guten Tag, eine Fahrkarte nach München, bitte.", fr: "Bonjour, un billet pour Munich, s'il vous plaît." },
      { speaker: "Beamter", de: "Einfach oder hin und zurück?", fr: "Aller simple ou aller-retour ?" },
      { speaker: "Reisende", de: "Hin und zurück, zweite Klasse.", fr: "Aller-retour, deuxième classe." },
      { speaker: "Beamter", de: "Wann möchten Sie fahren?", fr: "Quand voulez-vous voyager ?" },
      { speaker: "Reisende", de: "Heute Nachmittag, um vier Uhr.", fr: "Cet après-midi, à quatre heures." },
      { speaker: "Beamter", de: "Das macht achtzig Euro. Gleis sieben.", fr: "Cela fait quatre-vingts euros. Voie sept." },
      { speaker: "Reisende", de: "Wann kommt der Zug an?", fr: "Quand le train arrive-t-il ?" },
      { speaker: "Beamter", de: "Um halb neun. Gute Reise!", fr: "À huit heures et demie. Bon voyage !" },
    ],
  },
  {
    id: "scene_train_announcement",
    category: "transport",
    title: "Annonce dans le train",
    emoji: "📢",
    ambiance: "train",
    level: "A2",
    description: "Annonce à bord d'un ICE allemand.",
    lines: [
      { speaker: "Durchsage", de: "Meine Damen und Herren, willkommen im ICE 591 nach München.", fr: "Mesdames et messieurs, bienvenue dans l'ICE 591 à destination de Munich." },
      { speaker: "Durchsage", de: "Nächster Halt: Frankfurt am Main Hauptbahnhof.", fr: "Prochain arrêt : gare centrale de Francfort-sur-le-Main." },
      { speaker: "Durchsage", de: "Ankunft in zehn Minuten.", fr: "Arrivée dans dix minutes." },
      { speaker: "Durchsage", de: "Bitte vergessen Sie Ihr Gepäck nicht.", fr: "N'oubliez pas vos bagages, s'il vous plaît." },
      { speaker: "Durchsage", de: "Wir wünschen Ihnen eine gute Weiterreise.", fr: "Nous vous souhaitons une bonne continuation." },
    ],
  },
  {
    id: "scene_traffic_taxi",
    category: "transport",
    title: "Prendre un taxi",
    emoji: "🚕",
    ambiance: "cars",
    level: "A1",
    description: "Conversation avec un chauffeur de taxi.",
    lines: [
      { speaker: "Fahrgast", de: "Guten Abend! Können Sie mich zum Hotel Adler bringen?", fr: "Bonsoir ! Pouvez-vous m'emmener à l'hôtel Adler ?" },
      { speaker: "Fahrer", de: "Natürlich. Steigen Sie bitte ein.", fr: "Bien sûr. Montez, s'il vous plaît." },
      { speaker: "Fahrgast", de: "Wie lange dauert die Fahrt?", fr: "Combien de temps dure le trajet ?" },
      { speaker: "Fahrer", de: "Ungefähr zwanzig Minuten, bei diesem Verkehr.", fr: "Environ vingt minutes, avec cette circulation." },
      { speaker: "Fahrgast", de: "Was kostet das?", fr: "Combien ça coûte ?" },
      { speaker: "Fahrer", de: "Etwa fünfundzwanzig Euro.", fr: "Environ vingt-cinq euros." },
      { speaker: "Fahrgast", de: "In Ordnung, danke.", fr: "D'accord, merci." },
    ],
  },

  // ===== SHOPPING =====
  {
    id: "scene_supermarket",
    category: "shopping",
    title: "Au supermarché",
    emoji: "🛒",
    ambiance: "supermarket",
    level: "A1",
    description: "Demander un produit et payer à la caisse.",
    lines: [
      { speaker: "Kunde", de: "Entschuldigung, wo finde ich die Milch?", fr: "Excusez-moi, où puis-je trouver le lait ?" },
      { speaker: "Mitarbeiter", de: "Im Gang drei, hinten rechts.", fr: "Dans l'allée trois, au fond à droite." },
      { speaker: "Kunde", de: "Vielen Dank!", fr: "Merci beaucoup !" },
      { speaker: "Kassiererin", de: "Haben Sie eine Kundenkarte?", fr: "Avez-vous une carte de fidélité ?" },
      { speaker: "Kunde", de: "Nein, leider nicht.", fr: "Non, malheureusement pas." },
      { speaker: "Kassiererin", de: "Das macht zweiundzwanzig Euro fünfzig.", fr: "Cela fait vingt-deux euros cinquante." },
      { speaker: "Kunde", de: "Kann ich mit Karte bezahlen?", fr: "Puis-je payer par carte ?" },
      { speaker: "Kassiererin", de: "Ja, natürlich. Bitte hier.", fr: "Oui, bien sûr. Par ici, s'il vous plaît." },
      { speaker: "Kunde", de: "Danke, einen schönen Tag!", fr: "Merci, bonne journée !" },
    ],
  },
  {
    id: "scene_bakery",
    category: "shopping",
    title: "À la boulangerie",
    emoji: "🥖",
    ambiance: "supermarket",
    level: "A1",
    description: "Acheter du pain et des pâtisseries.",
    lines: [
      { speaker: "Bäckerin", de: "Guten Morgen! Was darf es sein?", fr: "Bonjour ! Que désirez-vous ?" },
      { speaker: "Kundin", de: "Ich hätte gerne zwei Brötchen und ein Brot.", fr: "Je voudrais deux petits pains et un pain." },
      { speaker: "Bäckerin", de: "Welches Brot möchten Sie?", fr: "Quel pain voulez-vous ?" },
      { speaker: "Kundin", de: "Das Vollkornbrot, bitte.", fr: "Le pain complet, s'il vous plaît." },
      { speaker: "Bäckerin", de: "Sonst noch etwas?", fr: "Autre chose ?" },
      { speaker: "Kundin", de: "Ja, drei Croissants, bitte.", fr: "Oui, trois croissants, s'il vous plaît." },
      { speaker: "Bäckerin", de: "Das macht acht Euro zwanzig.", fr: "Cela fait huit euros vingt." },
    ],
  },

  // ===== MÉTÉO =====
  {
    id: "scene_weather_forecast",
    category: "weather",
    title: "Bulletin météo à la radio",
    emoji: "📻",
    ambiance: "rain",
    level: "A2",
    description: "Prévisions météo allemandes pour la journée.",
    lines: [
      { speaker: "Sprecherin", de: "Hier ist das Wetter für heute.", fr: "Voici la météo pour aujourd'hui." },
      { speaker: "Sprecherin", de: "Im Norden regnet es den ganzen Tag.", fr: "Au nord, il pleut toute la journée." },
      { speaker: "Sprecherin", de: "Die Temperaturen liegen bei zwölf Grad.", fr: "Les températures sont autour de douze degrés." },
      { speaker: "Sprecherin", de: "Im Süden scheint die Sonne.", fr: "Au sud, le soleil brille." },
      { speaker: "Sprecherin", de: "Es wird warm, bis zu zweiundzwanzig Grad.", fr: "Il fera chaud, jusqu'à vingt-deux degrés." },
      { speaker: "Sprecherin", de: "Am Abend kommt Wind aus dem Westen.", fr: "Le soir, du vent viendra de l'ouest." },
      { speaker: "Sprecherin", de: "Vergessen Sie Ihren Regenschirm nicht!", fr: "N'oubliez pas votre parapluie !" },
    ],
  },
  {
    id: "scene_weather_chat",
    category: "weather",
    title: "Parler du temps qu'il fait",
    emoji: "🌦️",
    ambiance: "wind",
    level: "A1",
    description: "Une conversation banale entre voisins sur la météo.",
    lines: [
      { speaker: "Frau Müller", de: "Guten Morgen! Was für ein Wetter heute!", fr: "Bonjour ! Quel temps il fait aujourd'hui !" },
      { speaker: "Herr Schmidt", de: "Ja, es ist sehr windig.", fr: "Oui, il y a beaucoup de vent." },
      { speaker: "Frau Müller", de: "Und kalt! Nur acht Grad.", fr: "Et froid ! Seulement huit degrés." },
      { speaker: "Herr Schmidt", de: "Morgen soll es schneien.", fr: "Demain il devrait neiger." },
      { speaker: "Frau Müller", de: "Wirklich? Im Oktober?", fr: "Vraiment ? En octobre ?" },
      { speaker: "Herr Schmidt", de: "Ja, das ist ungewöhnlich.", fr: "Oui, c'est inhabituel." },
      { speaker: "Frau Müller", de: "Bleiben Sie warm!", fr: "Restez au chaud !" },
    ],
  },
  {
    id: "scene_storm",
    category: "weather",
    title: "Alerte orage",
    emoji: "⛈️",
    ambiance: "thunder",
    level: "A2",
    description: "Annonce d'un orage soudain.",
    lines: [
      { speaker: "Sprecher", de: "Achtung! Ein schweres Gewitter kommt.", fr: "Attention ! Un fort orage arrive." },
      { speaker: "Sprecher", de: "Bleiben Sie zu Hause!", fr: "Restez chez vous !" },
      { speaker: "Sprecher", de: "Schließen Sie die Fenster.", fr: "Fermez les fenêtres." },
      { speaker: "Sprecher", de: "Der Sturm dauert ungefähr zwei Stunden.", fr: "La tempête dure environ deux heures." },
      { speaker: "Sprecher", de: "Wir informieren Sie weiter.", fr: "Nous vous informerons davantage." },
    ],
  },

  // ===== TEMPS / HORAIRES =====
  {
    id: "scene_time_train_announce",
    category: "transport",
    title: "Annonce horaire en gare",
    emoji: "🕐",
    ambiance: "train",
    level: "A2",
    description: "Un haut-parleur annonce les horaires de départ et un retard.",
    lines: [
      { speaker: "Lautsprecher", de: "Achtung, eine Durchsage.", fr: "Attention, une annonce." },
      { speaker: "Lautsprecher", de: "Der ICE 745 nach München fährt um zehn Uhr fünfzehn.", fr: "L'ICE 745 vers Munich part à 10h15." },
      { speaker: "Lautsprecher", de: "Gleis sieben, bitte einsteigen.", fr: "Voie 7, veuillez monter." },
      { speaker: "Lautsprecher", de: "Der Regionalzug nach Köln hat fünfzehn Minuten Verspätung.", fr: "Le train régional vers Cologne a 15 minutes de retard." },
      { speaker: "Lautsprecher", de: "Wir bitten um Ihr Verständnis.", fr: "Nous vous prions de nous excuser." },
      { speaker: "Lautsprecher", de: "Vielen Dank für Ihre Geduld.", fr: "Merci pour votre patience." },
    ],
  },
  {
    id: "scene_time_appointment",
    category: "social",
    title: "Prendre rendez-vous au téléphone",
    emoji: "📞",
    ambiance: "cafe",
    level: "A1",
    description: "Au téléphone avec un cabinet médical.",
    lines: [
      { speaker: "Sekretärin", de: "Praxis Dr. Schmidt, guten Tag!", fr: "Cabinet Dr. Schmidt, bonjour !" },
      { speaker: "Patient", de: "Guten Tag, ich hätte gern einen Termin.", fr: "Bonjour, je voudrais un rendez-vous." },
      { speaker: "Sekretärin", de: "Wann passt es Ihnen? Morgen um halb neun?", fr: "Quand cela vous convient ? Demain à 8h30 ?" },
      { speaker: "Patient", de: "Halb neun ist zu früh. Geht es um zehn Uhr?", fr: "8h30 c'est trop tôt. À 10h, c'est possible ?" },
      { speaker: "Sekretärin", de: "Ja, zehn Uhr ist frei. Wie heißen Sie?", fr: "Oui, 10h est libre. Comment vous appelez-vous ?" },
      { speaker: "Patient", de: "Müller, Thomas Müller. Bis morgen!", fr: "Müller, Thomas Müller. À demain !" },
    ],
  },
  {
    id: "scene_time_alarm_morning",
    category: "social",
    title: "Le réveil sonne le matin",
    emoji: "⏰",
    ambiance: "street",
    level: "A1",
    description: "Conversation matinale en famille.",
    lines: [
      { speaker: "Mutter", de: "Aufstehen! Es ist schon halb acht!", fr: "Debout ! Il est déjà 7h30 !" },
      { speaker: "Kind", de: "Nein, noch fünf Minuten, bitte.", fr: "Non, encore cinq minutes, s'il te plaît." },
      { speaker: "Mutter", de: "Du kommst zu spät zur Schule!", fr: "Tu vas arriver en retard à l'école !" },
      { speaker: "Kind", de: "Wann beginnt der Unterricht?", fr: "Quand commence le cours ?" },
      { speaker: "Mutter", de: "Punkt acht Uhr. Du hast nur dreißig Minuten!", fr: "À 8h pile. Tu n'as que 30 minutes !" },
      { speaker: "Kind", de: "Okay, ich stehe auf!", fr: "OK, je me lève !" },
    ],
  },
  {
    id: "scene_time_meeting_late",
    category: "social",
    title: "Excuse pour un retard",
    emoji: "🏃",
    ambiance: "street",
    level: "A2",
    description: "Une amie arrive en retard à un rendez-vous.",
    lines: [
      { speaker: "Anna", de: "Entschuldigung! Ich bin zu spät.", fr: "Désolée ! Je suis en retard." },
      { speaker: "Lisa", de: "Kein Problem. Wie spät ist es jetzt?", fr: "Pas grave. Quelle heure est-il maintenant ?" },
      { speaker: "Anna", de: "Es ist Viertel nach drei.", fr: "Il est 3h15." },
      { speaker: "Lisa", de: "Wir wollten uns um drei Uhr treffen!", fr: "On devait se voir à 3h !" },
      { speaker: "Anna", de: "Ich weiß, der Bus hatte Verspätung.", fr: "Je sais, le bus avait du retard." },
      { speaker: "Lisa", de: "Macht nichts. Hast du Hunger?", fr: "C'est rien. Tu as faim ?" },
    ],
  },
];

export function getScenesByCategory(): Record<HoerenScene["category"], HoerenScene[]> {
  return HOEREN_SCENES.reduce((acc, scene) => {
    (acc[scene.category] = acc[scene.category] ?? []).push(scene);
    return acc;
  }, {} as Record<HoerenScene["category"], HoerenScene[]>);
}

export const CATEGORY_LABELS: Record<HoerenScene["category"], { label: string; emoji: string }> = {
  city: { label: "Ville & Rue", emoji: "🏙️" },
  transport: { label: "Transport", emoji: "🚆" },
  shopping: { label: "Courses", emoji: "🛒" },
  weather: { label: "Météo & Temps", emoji: "🌦️" },
  social: { label: "Vie sociale", emoji: "👥" },
};
