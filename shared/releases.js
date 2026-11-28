// Public release history. Releases are grouped by app, newest version first within each app.
const arcadeReleases = {
  apps: {
    arcade: { title: "HunterJoe Arcade", href: "./index.html", kind: "arcade" },
    wind_turbine: { title: "Windkraftanlage 3D – Interaktiver Explainer", href: "./games/wind-turbine/index.html", kind: "game" },
    combustion_engine: { title: "Verbrennungsmotor 3D – Interaktiver Explainer", href: "./games/combustion-engine/index.html", kind: "game" },
    big_boy: { title: "Union Pacific Big Boy 4014 – 3D-Technik-Explainer", href: "./games/big-boy/index.html", kind: "game" },
    pistenbully_800w: { title: "PistenBully 800 W – 3D-Steilhang-Simulation", href: "./games/pistenbully-800w/index.html", kind: "game" },
    gondola_station: { title: "2-Etagen-Funitel – 4 Riesenräder & Doppelseil 3D", href: "./games/gondola-station/index.html", kind: "game" },
    podracer: { title: "Canyon Podracer 3D", href: "./games/podracer/index.html", kind: "game" },
    eroadtrip: { title: "e-Roadtrip: Pixel Europe", href: "./games/e-roadtrip/index.html", kind: "game" },
    solitaire3d: { title: "3D Spider Solitär (4 Farben)", href: "./games/solitaire3d/index.html", kind: "game" },
    minesweeper_3d_prompt_test: { title: "Minesweeper 3d prompt Version", href: "./games/minesweeper-3d-prompt-test/index.html", kind: "game" },
    minesweeper: { title: "Minesweeper 3D – Tech Demo KI-Agent", href: "./games/minesweeper/index.html", kind: "game" },
    roadster: { title: "Hyper-Roadster", href: "./games/roadster/index.html", kind: "game" },
    zombie: { title: "Zombie Horde: Gate Runner", href: "./games/zombie/index.html", kind: "game" },
    tower: { title: "Bastion Tower Defense", href: "./games/tower/index.html", kind: "game" },
    solitaire: { title: "Klondike Solitaire", href: "./games/solitaire/index.html", kind: "game" },
    p2048: { title: "2048 Prism", href: "./games/2048/index.html", kind: "game" },
    quiz_fussball: { title: "Fußball – Das große Quiz", href: "./games/quiz-fussball/index.html", kind: "quiz" },
    quiz_american_football: { title: "American Football – Das große NFL-Quiz", href: "./games/quiz-american-football/index.html", kind: "quiz" },
    quiz_golf: { title: "Golf – Das große Quiz", href: "./games/quiz-golf/index.html", kind: "quiz" },
    quiz_mil_air: { title: "Militärflugzeuge Quiz: Kampfjets bis Pionierzeit", href: "./games/quiz-military-aircraft/index.html", kind: "quiz" },
    quiz_airliners: { title: "Passagierflugzeuge Quiz: A380 bis Concorde", href: "./games/quiz-airliners/index.html", kind: "quiz" },
    quiz_etfs: { title: "Passives Investieren & ETFs Quiz", href: "./games/quiz-etfs/index.html", kind: "quiz" },
    quiz_bitcoin: { title: "Bitcoin Mega-Quiz: Protokoll bis Lightning", href: "./games/quiz-bitcoin/index.html", kind: "quiz" },
    quiz_porsche: { title: "Porsche & Taycan Quiz (75 Fragen)", href: "./games/quiz-porsche/index.html", kind: "quiz" },
    quiz_f1: { title: "Formel 1 – Legenden, Technik & Königsklasse", href: "./games/quiz-f1/index.html", kind: "quiz" },
    quiz_apple: { title: "Apple – Produkte, Kult & Technikgeschichte", href: "./games/quiz-apple/index.html", kind: "quiz" },
    quiz_md11: { title: "McDonnell Douglas MD-11 Quiz", href: "./games/quiz-md11/index.html", kind: "quiz" },
    quiz_naildesign: { title: "Nageldesign Quiz: Finger- & Fußnägel", href: "./games/quiz-naildesign/index.html", kind: "quiz" },
    quiz_torten: { title: "Torten Quiz: Klassiker & Patisserie", href: "./games/quiz-torten/index.html", kind: "quiz" },
    quiz_geburt: { title: "Bewusste Schwangerschaft & sanfte Geburt", href: "./games/quiz-geburt/index.html", kind: "quiz" },
    quiz_ai: { title: "KI: Entstehung & Funktionsweise Quiz", href: "./games/quiz-ai/index.html", kind: "quiz" },
    quiz_movies: { title: "Kino & Filme Quiz (ohne RomComs)", href: "./games/quiz-movies/index.html", kind: "quiz" },
    quiz_egypt: { title: "Ägyptische Geschichte Quiz", href: "./games/quiz-egypt/index.html", kind: "quiz" },
    quiz_diving: { title: "Tauchen & Scuba Diving Quiz", href: "./games/quiz-diving/index.html", kind: "quiz" },
    quiz_cpus: { title: "Prozessoren-Quiz (2000–Heute)", href: "./games/quiz-cpus/index.html", kind: "quiz" },
    quiz_gpus: { title: "Grafikkarten-Quiz (2000–Heute)", href: "./games/quiz-gpus/index.html", kind: "quiz" },
    quiz_phones: { title: "Handys & Smartphones Quiz (25 Jahre)", href: "./games/quiz-phones/index.html", kind: "quiz" },
    quiz_pilze_aachen: { title: "Pilz-Sammler-Quiz: Region Aachen & Eifel", href: "./games/quiz-pilze-aachen/index.html", kind: "quiz" },
    quiz_swiss_trains: { title: "Schweizer Eisenbahnloks (ca. 1970–Heute)", href: "./games/quiz-swiss-trains/index.html", kind: "quiz" },
    quiz_emob: { title: "E-Mobilität & Tesla Nerd-Quiz", href: "./games/quiz-emobility/index.html", kind: "quiz" },
    quiz_pol: { title: "Politik & Ökonomie: Freiheitliches Denken", href: "./games/quiz-politics/index.html", kind: "quiz" },
    quiz_hist: { title: "Geschichte & Weltereignisse", href: "./games/quiz-history/index.html", kind: "quiz" },
    quiz_china: { title: "Neuere Chinesische Geschichte Quiz", href: "./games/quiz-china/index.html", kind: "quiz" },
    quiz: { title: "Quiz Arena: Klassik", href: "./games/quiz/index.html", kind: "quiz" },
  },
  releases: [
    {
      app: "arcade", version: "0.7.1", date: "2026-11-27", type: "patch", title: "Hub-Karte auf Funitel-Doppelseil & 4 Riesenräder aktualisiert",
      author: "Joe", model: "Neon",
      highlights: [
        "Hub-Karte und Icon der 2-Etagen-Gondelstation auf das echte Galzigbahn-Funitel-Prinzip (Doppelseil & 4 Vertikal-Riesenräder) aktualisiert.",
      ],
    },
    {
      app: "arcade", version: "0.7.0", date: "2026-11-27", type: "feature", title: "Neuer 3D-Explainer: 2-Etagen-Gondelstation",
      author: "Joe", model: "Neon",
      highlights: [
        "Neuer interaktiver 3D-Technik-Explainer einer hochmodernen 2-Etagen-Gondelstation mit Vertikal-Riesenrädern, Level Walk-In EG und D-Line-Kuppeltechnik.",
        "Im Hub, im Burger-Menü, in der Sitemap und im Feedback-System nahtlos verknüpft.",
        "Modul- und Spielezähler im Hub auf 43 Module (15 Spiele & 3D-Explainer) aktualisiert.",
      ],
    },
    {
      app: "arcade", version: "0.6.0", date: "2026-11-27", type: "feature", title: "Neuer 3D-Explainer: PistenBully 800 W",
      author: "Joe", model: "Neon",
      highlights: [
        "Neuer interaktiver 3D-Technik-Explainer des Kässbohrer PistenBully 800 W im Steilhang-Einsatz (bis 45° / 100 % Steigung).",
        "Im Hub, im Burger-Menü, in der Sitemap und im Feedback-System nahtlos verknüpft.",
        "Modul- und Spielezähler im Hub auf 42 Module (14 Spiele & 3D-Explainer) aktualisiert.",
      ],
    },
    {
      app: "arcade", version: "0.5.0", date: "2026-11-27", type: "feature", title: "Neuer 3D-Explainer: Union Pacific Big Boy 4014",
      author: "Joe", model: "Neon",
      highlights: [
        "Neuer interaktiver 3D-Technik-Explainer der Union Pacific Big Boy 4014 (4-8-8-4-Gelenkdampflok) unter Games.",
        "Im Hub, im Burger-Menü, in der Sitemap und im Feedback-System nahtlos verknüpft.",
        "Modul- und Spielezähler im Hub auf 41 Module (13 Spiele & 3D-Explainer) aktualisiert.",
      ],
    },
    {
      app: "arcade", version: "0.4.4", date: "2026-11-27", type: "patch", title: "Serverseitig signierte Sicherheitsprüfung",
      author: "Joe", model: "Neon",
      highlights: [
        "Anmeldung, Registrierung und Community-Beiträge nutzen jetzt eine serverseitig signierte Einmal-Sicherheitsaufgabe statt eines öffentlichen Demo-Schlüssels.",
        "Fehlgeschlagene Anmeldeversuche laden automatisch eine neue Aufgabe nach.",
      ],
    },
    {
      app: "arcade", version: "0.4.3", date: "2026-11-27", type: "patch", title: "Sicherheits-Härtung, lokales 3D-Hosting & Schutz-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Plausibilitätsgrenzen für alle Bestenlisten, 8-KB-Anfragelimit, stärkere Passwort-Absicherung und kürzere Sitzungsdauer im Backend ergänzt.",
        "Alle 3D-Bibliotheken werden jetzt direkt lokal statt über externe Skript-CDNs ausgeliefert.",
        "Content-Security-Policy, Referrer-Schutz und automatischer Sitzungsabgleich auf allen Seiten ergänzt.",
      ],
    },
    {
      app: "arcade", version: "0.4.2", date: "2026-11-27", type: "patch", title: "Sicherheit, Bestenlisten-Schutz & Hub-Pflege",
      author: "Joe", model: "Neon",
      highlights: [
        "Bestenlisten-API gegen unbefugte Überschreibungen abgesichert, Ladezeit der Übersicht stark beschleunigt und Ratenbegrenzung ergänzt.",
        "Burger-Menü um American Football und Golf ergänzt sowie Modul- und Fragenzähler im Hub aktualisiert.",
        "Kontrast im Hell-Modus für Fehlermeldungen und leere Feedback-Karten verbessert sowie Datenschutzerklärung vervollständigt.",
      ],
    },
    {
      app: "arcade", version: "0.4.1", date: "2026-11-25", type: "patch", title: "Bestenlisten für kürzere Fahrten",
      author: "Michi", model: "Sol 6.2",
      highlights: [
        "Die e-Roadtrip-Bestenlisten akzeptieren kürzere Fahrzeiten in Level 2 und gewertete Zieleinläufe ab 0 Punkten.",
        "Eigene Bestenliste und Bestwert auf der Spielkarte für e-Roadtrip Level 3.",
      ],
    },
    {
      app: "arcade", version: "0.4.0", date: "2026-11-25", type: "feature", title: "Zwei interaktive 3D-Technik-Explainer",
      author: "Joe", model: "Neon",
      highlights: [
        "Neuer 3D-Explainer „Windkraftanlage 3D“ unter Games mit Cutaway, X-Ray, Explosionsansicht und Leistungskurve",
        "Neuer 3D-Explainer „Verbrennungsmotor 3D“ mit 4-Takt-Kinematik, Prüfstandskurve und Schritt-für-Schritt-Tour",
        "Beide 3D-Explainer sind im Hub, im Burger-Menü und im Feedback-System verknüpft",
      ],
    },
    {
      app: "wind_turbine", version: "0.2.0", date: "2026-11-28", type: "feature", title: "Wind am Rotor sichtbar machen",
      author: "Michi", model: "Astra 6.2",
      highlights: [
        "Ein dichter Strom blauer Kügelchen zeigt, wie die Luft am Rotor abbremst, an den Blättern abgelenkt wird und sich dahinter aufweitet.",
        "Im aufgeschnittenen Getriebe kannst du den Planetenrädern und den beiden Stirnradstufen bis zur schnellen Generatorwelle folgen.",
        "Eine neue Tourstation führt durch die Turmtür zu Leiter, Ruhepodesten und Service-Lift.",
        "Studiolicht, weiche Schatten und ein rauchgrauer Röntgenblick machen die Bauteile besser erkennbar.",
        "Im Grafikmenü lassen sich Kontaktschatten, Schatten und Partikeldichte einstellen und die Bildrate ablesen.",
      ],
    },
    {
      app: "wind_turbine", version: "0.1.3", date: "2026-11-27", type: "patch", title: "Lokales 3D-Hosting & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "3D-Engine wird jetzt direkt lokal ohne externes JavaScript-CDN geladen.",
        "Content-Security-Policy und Referrer-Schutz für die Seite ergänzt.",
      ],
    },
    {
      app: "wind_turbine", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Bauteil-Fokus & Sturmschutz-Physik",
      author: "Joe", model: "Neon",
      highlights: [
        "Ausgewählte Baugruppen leuchten jetzt isoliert ohne ungewolltes Mitleuchten anderer Teile.",
        "Bei 0,0 m/s Wind steht das Anemometer still und bei aktiver Sturmbremse (> 25 m/s) stoppt der Rotor vollständig.",
        "Diagramm-Steuerung reagiert sauber auf abgebrochene Touch-Gesten.",
      ],
    },
    {
      app: "wind_turbine", version: "0.1.1", date: "2026-11-25", type: "patch", title: "Drehachse im Triebstrang & mobiles Menü",
      author: "Joe", model: "Neon",
      highlights: [
        "Rotationsachse von Bremsscheibe, schneller Welle und Kupplung sowie Verzahnung im Getriebe und Blattausrichtung korrigiert",
        "Mobiles Steuerungsmenü hat jetzt einen festen Schließen-Knopf und schließt beim Tippen außerhalb",
      ],
    },
    {
      app: "wind_turbine", version: "0.1.0", date: "2026-11-25", type: "feature", title: "Erste Version",
      author: "Joe", model: "Neon",
      highlights: [
        "Interaktive 3,6-MW-Windkraftanlage in 3D mit Cutaway-Aufschnitt, X-Ray-Röntgenblick und Explosionsansicht mit 12 beschrifteten Baugruppen",
        "Windgeschwindigkeits-Regler (0–28 m/s) mit aktiver Pitch-Blattverstellung, verzahntem Getriebe und Sturmabschaltung",
        "Interaktive Live-Leistungskurve P(v) sowie geführte 6-Schritte-Tour von Wind bis Stromnetz",
      ],
    },
    {
      app: "combustion_engine", version: "0.5.2", date: "2026-11-27", type: "patch", title: "Vom Zündfunken zur Flammenfront",
      author: "Michi", model: "Astra 6.2", banner: false,
      highlights: [
        "An Rohrverzweigungen bleibt der Gasstrom breit. Im rauchgrauen Röntgenblick siehst du auch das Motoröl, dessen Oberfläche mit der Drehzahl vibriert.",
        "Beim Otto springt ein weißblauer Funke über. Beim Diesel entzünden sich mehrere Einspritzstrahlen. In beiden Motoren breitet sich die Flamme bis zur Kolbenkrone aus.",
        "Im Zahnradmenü wählst du die Stärke der Kontaktschatten, schaltest Schatten ein oder aus und regelst die Gasdichte. Dort siehst du auch die Bildrate (FPS).",
      ],
    },
    {
      app: "combustion_engine", version: "0.5.1", date: "2026-11-27", type: "patch", title: "Kurbeltrieb, Luftstrom und Zündung",
      author: "Michi", model: "Astra 6.2",
      highlights: [
        "Die Pleuel laufen auf den versetzten Hubzapfen. Das Zahnriemenrad sitzt mit Abstand vor der ersten Kurbelwange.",
        "Jeder Motor läuft mit passendem Leerlauf. Dichtere Gaspartikel zeigen beim Otto, wie die Drosselklappe den Luftstrom dosiert.",
        "Bei jeder Zündung leuchtet der Brennraum kurz auf. In der Tour siehst du, wie sich die Flamme von der Zündkerze oder vom Dieselstrahl bis zur Kolbenkrone ausbreitet.",
      ],
    },
    {
      app: "combustion_engine", version: "0.5.0", date: "2026-11-27", type: "feature", title: "Den Weg der Gase verfolgen",
      author: "Michi", model: "Astra 6.2",
      highlights: [
        "Verfolge Luft, Kraftstoff und Abgas als farbige Kügelchen vom Luftfilter bis zum Auspuff.",
        "Sieh, wie Zahnriemen, Nocken und Tassenstößel die Ventile in allen vier Bauformen öffnen.",
        "Vergleiche die Gemischbildung im Saugrohr des Benziners mit der Direkteinspritzung und Selbstzündung beim Diesel.",
        "Entdecke in der Tour den Turbolader, den Ladeluftkühler und beide Wege der Abgasrückführung.",
      ],
    },
    {
      app: "combustion_engine", version: "0.4.1", date: "2026-11-27", type: "patch", title: "Lokales 3D-Hosting & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "3D-Engine wird jetzt direkt lokal ohne externes JavaScript-CDN geladen.",
        "Content-Security-Policy und Referrer-Schutz für die Seite ergänzt.",
      ],
    },
    {
      app: "combustion_engine", version: "0.4.0", date: "2026-11-27", type: "feature", title: "Turbodiesel & vier Motor-Bauformen",
      author: "Joe", model: "Neon",
      highlights: [
        "Wähle jederzeit zwischen klassischem Otto-Saugmotor (Saugrohreinspritzung) und Common-Rail-Turbodiesel mit 3D-Turbolader, Direkteinspritzung und Ladedruck-Anzeige.",
        "Vier animierte Bauformen mit exakter Zündfolge und Kurbelwellen-Kinematik: Reihen-4, 180°-Boxer, 60°-V6 und 90°-Crossplane-V8.",
        "Prüfstandskurve, Muschelkurve, Getriebe, Live-Zylinderanzeige und geführte Tour passen sich live an Motor und Bauform an.",
        "Nockenwellen-Phasen auf Zylinder 2 und 3 sowie die Bauteil-Hervorhebung im 3D-Inspektor korrigiert.",
      ],
    },
    {
      app: "combustion_engine", version: "0.3.1", date: "2026-11-27", type: "patch", title: "Kennfeld eines Saugmotors",
      author: "Michi", model: "Sol 6.2",
      highlights: [
        "Das Beispielkennfeld beschreibt jetzt einen klassischen 2,0-l-Saugmotor mit Saugrohreinspritzung.",
        "Drehmoment, Leistung, Verbrauch, Voreinstellungen und Tour-Beispiele passen zum neuen Kennfeld.",
        "Im 3D-Modell siehst du die Kraftstoffleiste und die vier Einspritzventile am Ansaugkrümmer.",
      ],
    },
    {
      app: "combustion_engine", version: "0.3.0", date: "2026-11-27", type: "feature", title: "Getriebe und Tour zur Fahrlogik",
      author: "Michi", model: "Sol 6.2",
      highlights: [
        "Die Gangwahlanzeige unter dem Gaspedal zeigt den aktiven Gang und seine Übersetzung.",
        "Der Momentanverbrauch erscheint auch beim Beschleunigen und im Schub in l/100km.",
        "Die Tour zeigt live, wie sich Gaspedal, Fahrwiderstand und Hochschalten auf die Fahrt auswirken.",
        "Vergleiche verschiedene Gänge bei gleichem Tempo und lerne, die Muschelkurve zu lesen.",
      ],
    },
    {
      app: "combustion_engine", version: "0.2.0", date: "2026-11-27", type: "feature", title: "Gaspedal und Muschelkurve",
      author: "Michi", model: "Sol 6.2",
      highlights: [
        "Mit dem Gaspedal stellst du die Motorlast ein.",
        "Ein Beispielkennfeld liefert Wirkungsgrad und spezifischen Verbrauch für den gewählten Betriebspunkt.",
        "Drehzahl und Gaspedal bestimmen Gang, Geschwindigkeit und Verbrauch eines Beispielautos.",
        "In der interaktiven Muschelkurve siehst und verschiebst du den aktuellen Betriebspunkt.",
        "Die Voreinstellungen setzen Drehzahl und Last gemeinsam.",
      ],
    },
    {
      app: "combustion_engine", version: "0.1.1", date: "2026-11-25", type: "patch", title: "Mobiles Steuerungsmenü schließen",
      author: "Joe", model: "Neon",
      highlights: [
        "Mobiles Steuerungsmenü hat jetzt einen festen „Zurück zu 3D“-Knopf und schließt beim Tippen auf den Hintergrund oder per Escape",
      ],
    },
    {
      app: "combustion_engine", version: "0.1.0", date: "2026-11-25", type: "feature", title: "Erste Version",
      author: "Joe", model: "Neon",
      highlights: [
        "Interaktiver 2,0-Liter-4-Takt-Reihenvierzylinder (DOHC 16V, Zündfolge 1-3-4-2) mit Cutaway, X-Ray und Explosionsansicht mit 12 Baugruppen",
        "Drehzahl- und Zeitlupensteuerung mit synchronen Kolben, Pleueln, 16 Ventilen, Zündfunken und volumetrischen Brennräumen",
        "Interaktives Prüfstandsdiagramm (Drehmoment & Leistung) sowie 6-Schritte-Tour durch alle 4 Takte",
      ],
    },
    {
      app: "big_boy", version: "0.1.0", date: "2026-11-27", type: "feature", title: "Erste Version",
      author: "Joe", model: "Neon",
      highlights: [
        "Interaktive 3D-Simulation der Union Pacific Big Boy 4014 (4-8-8-4 Simple Articulated) mit 16 Boxpok-Treibrädern, 4 identischen 603-mm-Frischdampfzylindern und exakter Walschaerts-Steuerung an beiden Triebwerken.",
        "Schaltbarer Kessel- und Zylinderschnitt (Stoker-Förderschnecke, Elesco-Überhitzer, Doppel-Blasrohr, Kolbenschieber), Thermodynamik-Overlay und 20°-Kurvenfahrt-Demo mit beweglichen Kugelgelenk-Dampfrohren.",
        "Live-p-V-Indikatordiagramm mit 75-%-/25-%-Referenzkurven, Echtzeit-Telemetrie, optionalem 8-Schlag-Dampf-Audio mit Pfeife sowie geführter 8-Stationen-Technik-Tour.",
      ],
    },
    {
      app: "pistenbully_800w", version: "0.1.0", date: "2026-11-27", type: "feature", title: "Erste Version",
      author: "Joe", model: "Neon",
      highlights: [
        "Interaktive 3D-Steilhang-Simulation des Kässbohrer PistenBully 800 W (0–45° / 100 % Steigung) mit exakter X-Track-Aluketten- & 13-Zahn-Sternrad-Kinematik, 12-Wege-Räumschild (8 Hydraulikzylinder), AlpinFlexFräse, elastischem gelben Finisher (Cord-Rillen) und aktiver 4,7-t-Seilwinde.",
        "Schaltbarer 450-bar-Hydraulik-X-Ray (MAN D3876, Axialkolbenpumpen, pulsierende Hoch-/Niederdruck-Kreise), Fräsen-/Sinter-Längsschnitt („Schnee-Mikroskop“), 3D-Kraftvektoren, SNOWsat-Schneehöhen-Heatmap und Beleuchtungswechsel (Blaue Stunde vs. Alpiner Sonnentag).",
        "Live-Diagnostik für Hangphysik, 400-kW-Leistungsverteilung und Bodendruck-Vergleich, Echtzeit-Telemetrie, optionales 6-Zylinder-Diesel-/Hydraulik-Audio sowie geführte 8-Stationen-Technik-Tour.",
      ],
    },
    {
      app: "gondola_station", version: "0.2.0", date: "2026-11-27", type: "feature", title: "Echtes Galzigbahn-Funitel: Doppelseil & 4 Vertikal-Riesenräder",
      author: "Joe", model: "Neon",
      highlights: [
        "Technisch korrekt auf das echte Galzigbahn-Funitel-Prinzip umgebaut: 4 parallele 54-mm-Förderseile (2 je Fahrbahn) mit koaxialer Doppel-Antriebsscheibe (Ø 5,9 m) und Ablenkscheiben.",
        "4 gigantische Vertikal-Riesenräder (2 Zwillingspaare, Ø 8,56 m) heben und senken die Kabinen beidseitig kippfrei zwischen EG und OG.",
        "Neue kobaltblaue 24er-Funitel-Panoramakabinen mit breitem Doppelgehänge und 4 kuppelbaren Federklemmen pro Kabine (2×2 = 112 kN Klemmkraft) sowie 4 parallelen Kuppelrampen und 48 Stützenrollen (4×12) an Stütze 1.",
        "Alle 8 Tour-Stationen, 10 Hotspots, Telemetrie (1.350 kW / 640 kN Doppelseilspannung) und Diagnostik komplett auf Funitel-Technik aktualisiert.",
      ],
    },
    {
      app: "gondola_station", version: "0.1.0", date: "2026-11-27", type: "feature", title: "Erste Version",
      author: "Joe", model: "Neon",
      highlights: [
        "Interaktive 3D-Simulation einer modernen 2-Etagen-Gondelstation nach dem Galzigbahn-Riesenrad-Prinzip & D-Line-Technik: barrierefreier Level-Walk-In-Einstieg im EG (0,30 m/s), zwei 8,5-m-Vertikal-Riesenräder mit exakter Parallelführung, 40 gestufte Reifenförderer, 10 Panoramakabinen und Stütze 1 mit 12er-Rollenbatterien.",
        "Schaltbare Schnittansichten für Dach/Glasfassade, Makro-Federklemmen-Schnitt (Tellerfederpaket, Kuppelrampe & 28-kN-Kraftpfeile), DirectDrive- & Hydraulik-X-Ray (900 kW / 400.000 Nm / 420 kN Seilspannung), Zonen-Overlay v(s) und Beleuchtungswechsel (Blaue Stunde vs. Alpiner Tag).",
        "Interaktive Klemmfehler-Sicherheitsdemo mit Prüfstrecke & automatischer Bullwheel-Sicherheitsbremse, Gondel-Folgekamera, Super-Zeitlupe (0,02×) mit Einzelschritt, 3-Tab-Live-Diagnostik, optionalem Web-Audio sowie geführter 8-Stationen-Technik-Tour.",
      ],
    },
    {
      app: "arcade", version: "0.3.0", date: "2026-11-25", type: "feature", title: "Bestenlisten pro Level",
      author: "Michi", model: "Sol 6.2",
      highlights: [
        "Eigene Bestenlisten für die ersten beiden e-Roadtrip-Level",
        "Tabs für Level 1, Level 2 und die Gesamtbestenliste",
        "Level-Bestwerte auf der e-Roadtrip-Spielkarte",
        "Plausibilitätsprüfung für eingereichte e-Roadtrip-Ergebnisse",
      ],
    },
    {
      app: "arcade", version: "0.2.0", date: "2026-11-25", type: "feature", title: "Versionen und Changelogs",
      author: "Michi", model: "Sol 6.2",
      highlights: [
        "Versionsnummern und Changelogs für jedes öffentliche Spiel und Quiz",
        "Update-Hinweis mit blauem Punkt auf der Spielkarte",
        "Neue Seite „Changelogs“ mit Filter nach Spiel und Quiz sowie Angabe, wer die Änderung gemacht hat",
        "Link „Changelogs“ im Footer und im Menü",
      ],
    },
    {
      app: "arcade", version: "0.1.0", date: "2026-11-13", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false,
      highlights: [
        "Der Start des Web-Projekts HunterJoe Arcade",
      ],
    },
    {
      app: "eroadtrip", version: "0.6.0", date: "2026-11-25", type: "feature", title: "Winterfahrt an den Gardasee",
      author: "Michi", model: "Sol 6.2",
      highlights: [
        "Neues Level 3 mit drei Winterrouten von München nach Sirmione, Glatteis in den Passkehren und Hindernissen. Level 2 startet mittags und endet nach einer langen Hotelnacht am frühen Nachmittag in Montpellier.",
        "Stadtfahrten in Aachen, Hannover, Montpellier und München nach echten Stadtplänen. Du startest auf deiner Fahrspur und blinkst im Stand mit der Lenkung.",
        "Leichter rückwärts in jeder freien Ladebucht einparken und Anbieter an den Säulen erkennen. Rempler an Gebäuden und Säulen verursachen Wertverlust. Sehr langsame Rempler bleiben folgenlos. Der Airbag öffnet sich erst bei einem sehr schnellen Aufprall.",
        "Planungskarte mit echten Küstenlinien und mehr Städten, abgedunkelte Dialoge und ein Navi mit allen Straßen bis zum nächsten Halt. Unnötige Ladestopps lassen sich auslassen.",
        "Restakku am Ziel kann Punkte kosten. Essen in der Ladepause kostet 20 €.",
      ],
    },
    {
      app: "eroadtrip", version: "0.5.0", date: "2026-11-25", type: "feature", title: "Globale Bestenlisten pro Level",
      author: "Michi", model: "Sol 6.2",
      highlights: [
        "Eigene globale Bestenlisten für Level 1 und Level 2",
        "Top 10 und deine Platzierung direkt nach der Fahrt",
        "Bestenlisten-Knopf im Spiel mit Tabs für beide Level und die Gesamtwertung",
        "Abgeschlossene Fahrten zählen auch für die Gesamtbestenliste",
        "Einheitlicher Name „e-Roadtrip: Pixel Europe“ auf Karte, Spielseite und Bestenlisten",
      ],
    },
    {
      app: "eroadtrip", version: "0.4.0", date: "2026-11-25", type: "feature", title: "Ladeplanung und mobiles HUD",
      author: "Michi", model: "Sol 6.2",
      ref: "PR #4",
      highlights: [
        "Derselbe Ladepark ist auf Hin- und Rückweg nutzbar",
        "Maut wird pro Etappe abgebucht",
        "KI-Autos fahren rechts und kreisen nicht mehr",
        "Die Bremse hat Vorrang vor dem Gas. Das Hotel lädt acht Stunden lang mit 11 kW",
        "Überarbeitetes Handy-HUD",
      ],
    },
    {
      app: "eroadtrip", version: "0.3.0", date: "2026-11-25", type: "feature", title: "Auf nach Montpellier",
      author: "Michi", model: "Grok 4.7",
      ref: "PR #3",
      highlights: [
        "Level 2 nach Montpellier mit Hotel-Übernachtung",
        "Getrennte Planung für Hin- und Rückweg",
        "Vierfarbiger Reichweitenring",
        "Messe-Besuch mit Essen und AC-Laden",
        "Neue Autohöfe, Blitzer nach echter Geschwindigkeit und Unfall-Event mit Streaming-Option",
      ],
    },
    {
      app: "eroadtrip", version: "0.2.0", date: "2026-11-21", type: "feature", title: "Mehr Routen und bessere Übersicht",
      author: "Joe", model: "Hydrogen",
      highlights: [
        "Drei alternative Routen pro Level mit Vergleich",
        "Detaillierte Pixel-Europakarte mit Zoom und Anbieter-Logos",
        "Prognose des Akkustands bei Ankunft",
        "Etappenwahl, Anbieter-Filter und Reichweitenringe",
        "Pausen-Animationen, Stadtverkehr mit Regeln und Polizei sowie bessere Touch-Steuerung",
      ],
    },
    {
      app: "eroadtrip", version: "0.1.0", date: "2026-11-20", type: "feature", title: "Erste spielbare Version",
      author: "Joe", model: "Hydrogen",
      ref: "b6a44e4",
      banner: false,
      highlights: [
        "Level 1 Aachen ↔ Hannover Messe",
        "Ladeplanung mit echten Ladekurven und Lade-Abos",
        "Zeitraffer-Autobahn und Top-Down-Stadtfahrt",
        "Fahrzeug-Upgrades",
      ],
    },

    // Retrospective debut entries do not show update banners.
    {
      app: "podracer", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Lokales 3D-Hosting & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "3D-Engine wird jetzt direkt lokal ohne externes JavaScript-CDN geladen.",
        "Content-Security-Policy und Referrer-Schutz für die Seite ergänzt.",
      ],
    },
    {
      app: "podracer", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Kollisionsabfrage & Steuerungs-Fixes",
      author: "Joe", model: "Neon",
      highlights: [
        "Durchgängige Kollisionsprüfung bei hohem Boost-Tempo verhindert Überspringen von Felsen und Energie-Pickups.",
        "Unterboden-Leuchten richtet sich präzise nach dem aktuellen Streckenabschnitt aus.",
        "Stumm-Anzeige beim Start, Fokusverlust beim Boost und Tastenkürzel bei geöffneten Dialogen korrigiert.",
      ],
    },
    {
      app: "podracer", version: "0.1.0", date: "2026-11-21", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["3D-Rennen durch einen Wüsten-Canyon mit Boost-Pads und Hindernissen"],
    },
    {
      app: "solitaire3d", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Lokales 3D-Hosting & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "3D-Engine wird jetzt direkt lokal ohne externes JavaScript-CDN geladen.",
        "Content-Security-Policy und Referrer-Schutz für die Seite ergänzt.",
      ],
    },
    {
      app: "solitaire3d", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Hell-Modus, Speicher-Optimierung & Touch-Fixes",
      author: "Joe", model: "Neon",
      highlights: [
        "HUD, Menüs und Sieges-Overlay unterstützen jetzt auch den Hell-Modus mit hohem Kontrast.",
        "Karten-Texturen benötigen deutlich weniger Grafikspeicher für stabileres Spiel auf Mobilgeräten.",
        "Abgebrochene Touch-Gesten lösen keine ungewollten Züge mehr aus und ein Neustart bricht laufende Sieges-Timer sauber ab.",
      ],
    },
    {
      app: "solitaire3d", version: "0.1.0", date: "2026-11-21", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Spider Solitär mit vier Farben auf einem 3D-Kartentisch"],
    },
    {
      app: "minesweeper_3d_prompt_test", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Lokales 3D-Hosting & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "3D-Engine wird jetzt direkt lokal ohne externes JavaScript-CDN geladen.",
        "Content-Security-Policy und Referrer-Schutz für die Seite ergänzt.",
      ],
    },
    {
      app: "minesweeper_3d_prompt_test", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Grafikspeicher & Dialog-Scrollen",
      author: "Joe", model: "Neon",
      highlights: [
        "Unaufgedeckte Blöcke teilen sich ein gemeinsames Material und wechseln sauber zwischen Hell- und Dunkelmodus.",
        "Mausrad und Touch-Scrollen funktionieren wieder ungehindert in geöffneten Menüs und Bestenlisten.",
      ],
    },
    {
      app: "minesweeper_3d_prompt_test", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Minesweeper auf einem frei drehbaren und auffächerbaren 3D-Würfel"],
    },
    {
      app: "minesweeper", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Lokales 3D-Hosting & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "3D-Engine wird jetzt direkt lokal ohne externes JavaScript-CDN geladen.",
        "Content-Security-Policy und Referrer-Schutz für die Seite ergänzt.",
      ],
    },
    {
      app: "minesweeper", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Spielstand-Sicherheit & Grafikspeicher",
      author: "Joe", model: "Neon",
      highlights: [
        "Lokale Spielstände werden beim Anzeigen und Laden strikt bereinigt und sicher wiederhergestellt.",
        "Geometrien von Portalen und Ikosaeder-Brettern werden beim Levelwechsel sauber freigegeben.",
      ],
    },
    {
      app: "minesweeper", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Räumliches Minensuchrätsel mit 13 Geometrien und optionaler Assistenz"],
    },
    {
      app: "roadster", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sicherheits-Header ergänzt",
      author: "Joe", model: "Neon",
      highlights: [
        "Content-Security-Policy und Referrer-Schutz für die Spielseite ergänzt.",
      ],
    },
    {
      app: "roadster", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Landeschwellen, Drohnenschiff & Steuerdüsen",
      author: "Joe", model: "Neon",
      highlights: [
        "Landewinkel nach vollen Drehungen sowie die grünen/roten Grenzwerte in HUD und Visier sind jetzt vollständig einheitlich.",
        "Das bewegliche Drohnenschiff stoppt nach einer erfolgreichen Landung unter dem Roadster.",
        "Kaltgas-Strahlen der seitlichen Steuerdüsen zeigen jetzt physikalisch korrekt entgegen der Schubrichtung.",
      ],
    },
    {
      app: "roadster", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Landespiel mit Rampe, Stickstoffdüsen und Gyro-Hilfe"],
    },
    {
      app: "zombie", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Lokales 3D-Hosting & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "3D-Engine wird jetzt direkt lokal ohne externes JavaScript-CDN geladen.",
        "Content-Security-Policy und Referrer-Schutz für die Seite ergänzt.",
      ],
    },
    {
      app: "zombie", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Tore, Salven-Limit & Touch-Steuerung",
      author: "Joe", model: "Neon",
      highlights: [
        "Die Lücke zwischen linkem und rechtem Tor in der Fahrbahnmitte wurde geschlossen.",
        "Schuss-Limit auf 320 Projektile erhöht und Spielende durch rote Tore beendet den Frame sofort sauber.",
        "Touch-Steuerung hält den Fingerkontakt zuverlässiger und Namensänderungen aktualisieren den letzten Lauf.",
      ],
    },
    {
      app: "zombie", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Brückenspiel mit Zombie-Wellen, Energietoren und Verstärkungen"],
    },
    {
      app: "tower", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Lokales 3D-Hosting & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "3D-Engine wird jetzt direkt lokal ohne externes JavaScript-CDN geladen.",
        "Content-Security-Policy und Referrer-Schutz für die Seite ergänzt.",
      ],
    },
    {
      app: "tower", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Wellen-Balance, Banner & Grafikspeicher",
      author: "Joe", model: "Neon",
      highlights: [
        "Vorziehen von Wellen gewährt jetzt fair ausschließlich Gold-Bonus ohne Punkte-Farming.",
        "Der spezielle Hydra-Spalter-Banner in Welle 5 wird nun zuverlässig angezeigt.",
        "Kartenwechsel geben Portal- und Bastion-Ressourcen frei; abgebrochene Touch-Gesten bauen keine Türme mehr.",
      ],
    },
    {
      app: "tower", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Turmverteidigung mit drei Routen, ausbaubaren Türmen und Boss-Wellen"],
    },
    {
      app: "solitaire", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sicherheits-Header ergänzt",
      author: "Joe", model: "Neon",
      highlights: [
        "Content-Security-Policy und Referrer-Schutz für die Spielseite ergänzt.",
      ],
    },
    {
      app: "solitaire", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Touch-Abbruch, Spaltenhöhe & genaue Spielzeit",
      author: "Joe", model: "Neon",
      highlights: [
        "Abgebrochene Touch-Gesten oder Fensterwechsel führen keine versehentlichen Spielzüge mehr aus.",
        "Spaltenhöhen im Tableau und die finale Spielzeit beim Sieg werden jetzt exakt berechnet.",
      ],
    },
    {
      app: "solitaire", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Klondike mit Ein- oder Drei-Karten-Zug, Tipps und Rückgängig-Funktion"],
    },
    {
      app: "p2048", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sicherheits-Header ergänzt",
      author: "Joe", model: "Neon",
      highlights: [
        "Content-Security-Policy und Referrer-Schutz für die Spielseite ergänzt.",
      ],
    },
    {
      app: "p2048", version: "0.1.1", date: "2026-11-27", type: "patch", title: "2048-Abschluss, Rückgängig & große Zahlen",
      author: "Joe", model: "Neon",
      highlights: [
        "Wird 2048 mit dem allerletzten möglichen Zug erreicht, erkennt das Spiel den Endstand sauber ohne Hänger.",
        "Rückgängig ist nach dem Spielende gesperrt und 5-stellige Kacheln skalieren ihre Schriftgröße automatisch.",
      ],
    },
    {
      app: "p2048", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Zahlenpuzzle mit 4×4- und 5×5-Feldern, Wischgesten und Pfeiltasten"],
    },
    {
      app: "quiz_fussball", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_fussball", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fußball-Guru-Stufe & fairer Zeitbonus",
      author: "Joe", model: "Neon",
      highlights: [
        "Schwierigkeitsfilter „Fußball-Guru“ findet jetzt alle 120 kniffligen Fragen mit vollem 1,5×-Punktemultiplikator und 35 s Zeitbonus.",
        "Umschalten des Zeitmodus während einer Frage setzt den Zeitbonus nicht mehr zurück.",
      ],
    },
    {
      app: "quiz_fussball", version: "0.1.0", date: "2026-11-21", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Fußballquiz mit Vereins-Special und Bestenlisten je Themenbereich"],
    },
    {
      app: "quiz_american_football", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_american_football", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_american_football", version: "0.1.0", date: "2026-11-21", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Footballquiz zu Spielregeln, Ligageschichte und Fankultur"],
    },
    {
      app: "quiz_golf", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_golf", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_golf", version: "0.1.0", date: "2026-11-22", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Golfquiz zu Spielregeln, Ausrüstung, Turnieren und Plätzen"],
    },
    {
      app: "quiz_mil_air", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_mil_air", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_mil_air", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zur Geschichte und Technik der militärischen Luftfahrt"],
    },
    {
      app: "quiz_airliners", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_airliners", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_airliners", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu Verkehrsflugzeugen und der Technik an Bord"],
    },
    {
      app: "quiz_etfs", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_etfs", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Profi-Filter & fairer Zeitbonus",
      author: "Joe", model: "Neon",
      highlights: [
        "Schwierigkeitsfilter „Steuer- & Quant-Profi“ berücksichtigt jetzt auch alle Expertenfragen mit 1,5×-Wertung.",
        "Umschalten des Zeitmodus während einer Frage setzt den Zeitbonus nicht mehr zurück.",
      ],
    },
    {
      app: "quiz_etfs", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu Indexfonds, langfristigem Sparen und Besteuerung"],
    },
    {
      app: "quiz_bitcoin", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_bitcoin", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_bitcoin", version: "0.1.0", date: "2026-11-16", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zur Geschichte und Funktionsweise digitaler Währungen"],
    },
    {
      app: "quiz_porsche", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_porsche", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_porsche", version: "0.1.0", date: "2026-11-16", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zur Modellgeschichte und Technik von Sportwagen"],
    },
    {
      app: "quiz_f1", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_f1", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_f1", version: "0.1.0", date: "2026-11-21", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu Fahrern, Rennstrecken und Technik der Formel 1"],
    },
    {
      app: "quiz_apple", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_apple", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Start-Fix, Fragenverlauf & fairer Zeitbonus",
      author: "Joe", model: "Neon",
      highlights: [
        "Fehler beim Laden von Fragen und beim Umschalten zwischen Zeitbonus und Entspannt behoben.",
        "Gespielte Fragen werden nun korrekt im Anti-Wiederholungs-Verlauf gespeichert und der Überspringen-Joker ist abgesichert.",
        "Umschalten des Zeitmodus während einer Frage setzt den Zeitbonus nicht mehr zurück.",
      ],
    },
    {
      app: "quiz_apple", version: "0.1.0", date: "2026-11-21", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zur Geschichte eines Technikunternehmens und seiner Produkte"],
    },
    {
      app: "quiz_md11", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_md11", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_md11", version: "0.1.0", date: "2026-11-16", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu Konstruktion und Einsatzgeschichte eines dreistrahligen Verkehrsflugzeugs"],
    },
    {
      app: "quiz_naildesign", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_naildesign", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_naildesign", version: "0.1.0", date: "2026-11-21", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu Nagelpflege, Gestaltung und Materialkunde"],
    },
    {
      app: "quiz_torten", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_torten", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_torten", version: "0.1.0", date: "2026-11-21", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu Backtechniken, Tortendekoration und internationalen Klassikern"],
    },
    {
      app: "quiz_geburt", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_geburt", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Timer-Stabilität, Zeitmodus & Joker-Status",
      author: "Joe", model: "Neon",
      highlights: [
        "Timer-Anzeige im Sekundentakt und Umschalten des Entspannt-Modus während der Runde repariert.",
        "Der +10-Sekunden-Joker wird nach dem Einsatz sichtbar deaktiviert.",
        "Umschalten des Zeitmodus während einer Frage setzt den Zeitbonus nicht mehr zurück.",
      ],
    },
    {
      app: "quiz_geburt", version: "0.1.0", date: "2026-11-21", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu Geburtsvorbereitung und der ersten Zeit nach der Entbindung"],
    },
    {
      app: "quiz_ai", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_ai", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_ai", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zur Geschichte und Funktionsweise künstlicher Intelligenz"],
    },
    {
      app: "quiz_movies", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_movies", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_movies", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Filmquiz zu unterschiedlichen Genres und Kinotechnik"],
    },
    {
      app: "quiz_egypt", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_egypt", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_egypt", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zur Geschichte Ägyptens von der Frühzeit bis zur Moderne"],
    },
    {
      app: "quiz_diving", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_diving", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_diving", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu Tauchpraxis, Ausrüstung und Physik unter Wasser"],
    },
    {
      app: "quiz_cpus", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Sicherheits-Header & sichere Lizenzlinks",
      author: "Joe", model: "Neon",
      highlights: [
        "Lizenzlinks werden vor der Ausgabe strikt auf HTTPS geprüft.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_cpus", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Bilderquiz zur Geschichte von Computerprozessoren"],
    },
    {
      app: "quiz_gpus", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Sicherheits-Header & sichere Lizenzlinks",
      author: "Joe", model: "Neon",
      highlights: [
        "Lizenzlinks werden vor der Ausgabe strikt auf HTTPS geprüft.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_gpus", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Bilderquiz zu PC-Grafikkarten aus verschiedenen Jahren"],
    },
    {
      app: "quiz_phones", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Sicherheits-Header & sichere Lizenzlinks",
      author: "Joe", model: "Neon",
      highlights: [
        "Lizenzlinks werden vor der Ausgabe strikt auf HTTPS geprüft.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_phones", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Bilderquiz zu Mobiltelefonen aus mehreren Generationen"],
    },
    {
      app: "quiz_pilze_aachen", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Sicherheits-Header & sichere Lizenzlinks",
      author: "Joe", model: "Neon",
      highlights: [
        "Lizenzlinks werden vor der Ausgabe strikt auf HTTPS geprüft.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_pilze_aachen", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Bilderquiz zur Bestimmung regionaler Pilzarten und ihrer Giftigkeit"],
    },
    {
      app: "quiz_swiss_trains", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Sicherheits-Header & sichere Lizenzlinks",
      author: "Joe", model: "Neon",
      highlights: [
        "Lizenzlinks werden vor der Ausgabe strikt auf HTTPS geprüft.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_swiss_trains", version: "0.1.0", date: "2026-11-15", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Bilderquiz zu Fahrzeugen der Schweizer Eisenbahn"],
    },
    {
      app: "quiz_emob", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_emob", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_emob", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu Elektroautos, Batterietechnik und Schnellladen"],
    },
    {
      app: "quiz_pol", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_pol", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_pol", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu wirtschaftspolitischen Ideen und Denkschulen"],
    },
    {
      app: "quiz_hist", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_hist", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_hist", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zu historischen Meilensteinen verschiedener Epochen"],
    },
    {
      app: "quiz_china", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz_china", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz_china", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Quiz zur neueren Geschichte Chinas"],
    },
    {
      app: "quiz", version: "0.1.2", date: "2026-11-27", type: "patch", title: "Sichere Textausgabe & Sicherheits-Header",
      author: "Joe", model: "Neon",
      highlights: [
        "Antwortoptionen und Erklärtexte werden jetzt ausschließlich als sicherer Klartext gerendert.",
        "Content-Security-Policy und Referrer-Schutz für die Quiz-Seite ergänzt.",
      ],
    },
    {
      app: "quiz", version: "0.1.1", date: "2026-11-27", type: "patch", title: "Fairer Zeitbonus beim Moduswechsel",
      author: "Joe", model: "Neon",
      highlights: [
        "Umschalten zwischen „Ohne Zeitlimit“ und Zeitbonus während einer laufenden Frage füllt den Zeitbonus nicht mehr neu auf.",
      ],
    },
    {
      app: "quiz", version: "0.1.0", date: "2026-11-14", type: "feature", title: "Erste Version",
      author: "Joe", model: "Hydrogen",
      banner: false, highlights: ["Allgemeinwissen oder Themenmix mit optionalem Zeitlimit"],
    },
  ],
};

if (typeof window !== "undefined") window.ARCADE_RELEASES = arcadeReleases;
if (typeof module !== "undefined") module.exports = arcadeReleases;
