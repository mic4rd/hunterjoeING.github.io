// Windkraftanlage 3D – Physik-Modell, Bauteile-Katalog & 7-Schritte-Tour
export const TURBINE_SPECS = {
  ratedPowerMW: 3.6,
  rotorDiameterM: 126,
  hubHeightM: 112,
  cutInSpeed: 3.0,
  ratedSpeed: 12.0,
  cutOutSpeed: 25.0,
  maxWindSpeed: 28.0,
  gearRatio: 92,
  airDensity: 1.225, // kg/m³
  avgHouseholdKWhPerYear: 3500
};

/**
 * Berechnet alle Echtzeit-Betriebswerte einer 3,6-MW-Windkraftanlage
 * in Abhängigkeit von der Windgeschwindigkeit v (m/s).
 */
export function computeTurbineTelemetry(windSpeed) {
  const v = Math.max(0, Math.min(TURBINE_SPECS.maxWindSpeed, Number(windSpeed) || 0));
  const { cutInSpeed, ratedSpeed, cutOutSpeed, ratedPowerMW, rotorDiameterM, gearRatio, airDensity } = TURBINE_SPECS;

  let status = 'standby';
  let statusLabel = 'Stillstand (Flaute)';
  let powerMW = 0;
  let rotorRpm = 0;
  let pitchDeg = 12;
  let brakeActive = false;

  if (v < cutInSpeed) {
    status = 'standby';
    statusLabel = 'Flaute (< 3 m/s)';
    powerMW = 0;
    rotorRpm = v > 1.2 ? (v - 1.2) * 0.9 : 0;
    pitchDeg = 14 - Math.min(10, v * 3);
  } else if (v <= ratedSpeed) {
    status = 'partial';
    statusLabel = 'Teillast (Optimal-Cp)';
    // Realistische S-förmig geglättete kubische Leistungskurve P ~ v^3
    const t = (v - cutInSpeed) / (ratedSpeed - cutInSpeed);
    const cubic = Math.pow(t, 2.75);
    const smooth = cubic / (cubic + Math.pow(1 - t, 2.3) * 0.14 + 0.0001);
    powerMW = ratedPowerMW * Math.min(1, cubic * 0.88 + smooth * 0.12);
    if (t < 0.08) powerMW = ratedPowerMW * Math.pow(t, 2.4) * 0.8;
    powerMW = Math.max(0.02, Math.min(ratedPowerMW, powerMW));
    rotorRpm = 6.2 + t * 8.6; // 6.2 bis 14.8 U/min
    pitchDeg = 2.0 * (1 - t); // optimaler Anstellwinkel ~0°–2°
  } else if (v <= cutOutSpeed) {
    status = 'rated';
    statusLabel = 'Nennbetrieb (Pitch aktiv)';
    powerMW = ratedPowerMW;
    rotorRpm = 14.8;
    const t = (v - ratedSpeed) / (cutOutSpeed - ratedSpeed);
    // Blätter drehen sich schrittweise aus dem Wind (Fahnenstellung bis ~24°)
    pitchDeg = 2.5 + Math.pow(t, 0.85) * 23.5;
  } else {
    status = 'cutout';
    statusLabel = 'Sturmabschaltung (> 25 m/s)';
    powerMW = 0;
    rotorRpm = 0; // Mechanische Bremse hält Rotor fest
    pitchDeg = 86; // volle Fahnenstellung
    brakeActive = true;
  }

  const sweptArea = Math.PI * Math.pow(rotorDiameterM / 2, 2);
  const availableWindMW = (0.5 * airDensity * sweptArea * Math.pow(v, 3)) / 1e6;
  const cp = availableWindMW > 0.02 ? Math.min(0.49, powerMW / availableWindMW) : 0;
  const generatorRpm = rotorRpm * gearRatio;
  const tipSpeedMs = (rotorRpm / 60) * Math.PI * rotorDiameterM;
  // ~4500 Volllast-Äquivalent-Haushalte bei 3,6 MW Momentanleistung (ca. 0,4 kW/Haushalt Schnitt)
  const homesPowered = Math.round((powerMW * 1000) / 0.42);

  return {
    windSpeed: v,
    status,
    statusLabel,
    powerMW,
    powerKW: Math.round(powerMW * 1000),
    rotorRpm,
    generatorRpm,
    pitchDeg,
    cp,
    tipSpeedMs,
    homesPowered,
    brakeActive
  };
}

export const TURBINE_PARTS = [
  {
    id: 'blades',
    number: '01',
    name: 'Rotorblätter (3×)',
    shortLabel: 'Rotorblätter',
    category: 'Aerodynamik',
    energyStage: 'Windenergie → Rotationsenergie',
    spec: 'Länge 61,5 m · GFK/CFK-Verbund · Verwindung',
    description:
      'Wie Flugzeugtragflächen erzeugen die aerodynamisch profilierten Rotorblätter Auftrieb. Ein Teil dieser Kraft treibt den Rotor an. Die Luft gibt Energie ab und fließt hinter den Blättern langsamer weiter. Bei Starkwind dreht die Pitch-Regelung die Blätter aus dem Wind.',
    anchor: [0.0, 5.2, 4.1],
    cameraPos: [14.5, 5.5, 16.5],
    cameraTarget: [0, 2.0, 3.5]
  },
  {
    id: 'hub',
    number: '02',
    name: 'Rotornabe & Pitch-Antrieb',
    shortLabel: 'Nabe & Pitch',
    category: 'Aerodynamik',
    energyStage: 'Blattverstellung & Drehmoment-Übertragung',
    spec: 'Sphäroguss · 3× elektrischer Pitch-Motor',
    description:
      'Die Rotornabe verbindet alle drei Blätter mit der Hauptwelle. Im Inneren sitzen drei unabhängige Pitch-Motoren, die jedes Blatt stufenlos zwischen 0° (Volllast) und 86° (Sturm-Fahnenstellung) verdrehen.',
    anchor: [0.0, 0.3, 4.7],
    cameraPos: [7.2, 2.0, 9.2],
    cameraTarget: [0, 0.2, 4.0]
  },
  {
    id: 'mainShaft',
    number: '03',
    name: 'Hauptwelle & Hauptlager',
    shortLabel: 'Hauptwelle',
    category: 'Triebstrang',
    energyStage: 'Hohes Drehmoment · 6–15 U/min',
    spec: 'Geschmiedeter Vergütungsstahl · Pendelrollenlager',
    description:
      'Die massive Langsamläufer-Welle überträgt das gewaltige Drehmoment des Rotors (über 2 MNm) auf das Getriebe und leitet Windlasten über das Hauptlager sicher in den Maschinenträger ab.',
    anchor: [0.0, 0.25, 2.25],
    cameraPos: [6.4, 2.2, 5.4],
    cameraTarget: [0, 0.2, 2.1]
  },
  {
    id: 'gearbox',
    number: '04',
    name: 'Planetenstufe & zwei Stirnradstufen',
    shortLabel: 'Getriebe 1:92',
    category: 'Triebstrang',
    energyStage: 'Drehzahl-Übersetzung 15 → 1.360 U/min',
    spec: 'Übersetzung 1 : 92 · Zwangsumlaufschmierung',
    description:
      'Die Rotorwelle treibt den Planetenträger an. Vier Planeten wälzen sich im festen Hohlrad ab und treiben das Sonnenrad. Zwei schrägverzahnte Stirnradpaare erhöhen die Drehzahl weiter.',
    anchor: [0.0, 0.35, 0.45],
    cameraPos: [5.8, 2.4, 3.2],
    cameraTarget: [0, 0.25, 0.4]
  },
  {
    id: 'brake',
    number: '05',
    name: 'Hydraulische Scheibenbremse',
    shortLabel: 'Scheibenbremse',
    category: 'Sicherheit',
    energyStage: 'Not- & Wartungsstopp bei Sturm',
    spec: 'Bremsscheibe auf schneller Welle · Fail-Safe',
    description:
      'Auf der schnellen Getriebe-Ausgangswelle sitzt eine hydraulische Scheibenbremse. Bei Sturm über 25 m/s oder Wartungsarbeiten arretiert sie den Triebstrang zuverlässig, nachdem die Blätter aus dem Wind gedreht wurden.',
    anchor: [0.0, 0.35, -0.75],
    cameraPos: [5.4, 2.0, 0.8],
    cameraTarget: [0, 0.25, -0.8]
  },
  {
    id: 'highSpeedShaft',
    number: '06',
    name: 'Schnelle Generatorwelle',
    shortLabel: 'Schnelle Welle',
    category: 'Triebstrang',
    energyStage: 'Hochdrehzahl-Kopplung',
    spec: 'Bis 1.380 U/min · Elastische Sicherheitskupplung',
    description:
      'Die schnelle Welle verbindet Getriebe, Bremse und Generator über eine elastische Kupplung, die Schwingungen dämpft und vor Drehmomentspitzen bei Böen schützt.',
    anchor: [0.0, 0.25, -1.25],
    cameraPos: [5.6, 1.8, -0.4],
    cameraTarget: [0, 0.25, -1.3]
  },
  {
    id: 'generator',
    number: '07',
    name: 'Generator (Stator & Rotor)',
    shortLabel: 'Generator',
    category: 'Elektrotechnik',
    energyStage: 'Mechanische → Elektrische Energie',
    spec: '3,6 MW · Kupfer-Statorwicklungen · Luftkühlung',
    description:
      'Das Herzstück der Stromerzeugung: Im Generator rotiert ein Magnetfeld innerhalb von Kupferwicklungen (Stator) und induziert nach dem Faradayschen Gesetz dreiphasigen Wechselstrom.',
    anchor: [0.0, 0.35, -2.35],
    cameraPos: [6.4, 2.3, -1.2],
    cameraTarget: [0, 0.3, -2.2]
  },
  {
    id: 'nacelle',
    number: '08',
    name: 'Gondelgehäuse (Maschinenhaus)',
    shortLabel: 'Gondelgehäuse',
    category: 'Struktur',
    energyStage: 'Wetterschutz & Schalldämmung',
    spec: 'GFK-Verkleidung · Wärmetauscher · Warnfeuer',
    description:
      'Die aerodynamische Gondel schützt Getriebe, Generator und Steuerungselektronik vor Regen, Eis und UV-Strahlung. Auf dem Heck sitzt das Kühlsystem sowie das rote Hindernisfeuer für den Flugverkehr.',
    anchor: [0.0, 1.65, -0.8],
    cameraPos: [9.5, 4.2, 6.2],
    cameraTarget: [0, 0.6, -0.2]
  },
  {
    id: 'anemometer',
    number: '09',
    name: 'Anemometer & Windfahne',
    shortLabel: 'Windsensorik',
    category: 'Steuerung',
    energyStage: 'Echtzeit-Windmessung (m/s & Richtung)',
    spec: 'Schalenstern-Anemometer + Richtungssensor',
    description:
      'Auf dem hinteren Messmast dreht der Wind drei halbkugelige Schalen. Daneben richtet sich die Spitze der Windfahne gegen den Wind aus. Die Steuerung nutzt diese Daten für Pitch-Regelung, Windnachführung und automatische Sturmabschaltung.',
    anchor: [0.0, 2.3, -3.2],
    cameraPos: [5.5, 4.0, -0.6],
    cameraTarget: [0, 2.0, -3.0]
  },
  {
    id: 'yawDrive',
    number: '10',
    name: 'Azimutantrieb (Windnachführung)',
    shortLabel: 'Azimutantrieb',
    category: 'Steuerung',
    energyStage: '360°-Ausrichtung in den Wind',
    spec: 'Verzahnter Großwälzlager-Kranz · 4× E-Motoren',
    description:
      'Dreht der Wind, führen vier Getriebemotoren die Gondel nach. Ihre Ritzel greifen von außen in den festen Zahnkranz am Turmkopf. Im gezeigten Betrieb bleibt die Windrichtung konstant.',
    anchor: [0.0, -1.35, 0.0],
    cameraPos: [6.8, -0.3, 5.5],
    cameraTarget: [0, -1.3, 0]
  },
  {
    id: 'tower',
    number: '11',
    name: 'Stahlrohrturm & Stromschienen',
    shortLabel: 'Turm & Leitungen',
    category: 'Struktur',
    energyStage: 'Höhengewinn & Stromableitung',
    spec: 'Konischer Stahlrohrturm · 112 m Nabenhöhe',
    description:
      'In größerer Höhe weht der Wind stärker und gleichmäßiger. Im hohlen Turminneren verlaufen isolierte 3-Phasen-Leistungskabel, die den erzeugten Strom hinunter zum Umrichter führen.',
    anchor: [0.0, -5.8, 0.0],
    cameraPos: [13.0, -4.5, 11.5],
    cameraTarget: [0, -5.5, 0]
  },
  {
    id: 'transformer',
    number: '12',
    name: 'Umrichter & Transformator',
    shortLabel: 'Trafo & Netz',
    category: 'Elektrotechnik',
    energyStage: '50-Hz-Synchronisation & Mittelspannung',
    spec: 'Frequenzumrichter + 20-kV-Transformator',
    description:
      'Der Vollumrichter wandelt den frequenzvariablen Generatorstrom in sauberen 50-Hz-Wechselstrom um. Der Transformator hebt die Spannung auf 20 kV an, um ihn verlustarm ins Stromnetz einzuspeisen.',
    anchor: [2.2, -9.8, 0.2],
    cameraPos: [10.0, -7.8, 9.2],
    cameraTarget: [1.4, -9.6, 0.2]
  },
  {
    id: 'serviceAccess', number: '13', name: 'Aufstieg im Turm', shortLabel: 'Leiter & Service-Lift',
    category: 'Wartung', energyStage: 'Zugang zum Maschinenhaus',
    spec: 'Befahranlage · Steigschutzschiene · Ruhepodeste',
    description: 'Hinter der Turmtür liegt das Eingangspodest. Der Service-Lift bringt Personen und Werkzeug nach oben. Zusätzlich führt eine feste Leiter mit Steigschutzschiene an den Ruhepodesten vorbei.',
    anchor: [0.23,-7.2,-0.26], cameraPos: [4.4,-6.7,4.3], cameraTarget: [0,-7.1,0]
  }
];

export const TURBINE_TOUR_STEPS = [
  {
    step: 1,
    title: 'Wind trifft auf die Rotorblätter',
    badge: 'Aerodynamik · Auftrieb',
    viewMode: 'normal',
    focusPart: 'blades',
    demoWind: 10.5,
    cameraPos: [32, 5.5, 14],
    cameraTarget: [0, 0.9, 3.4],
    body:
      'Die blauen Kugeln füllen den anströmenden Luftquerschnitt. Vor dem Rotor bremst die Luft ab. Dahinter weitet sich der Luftstrom und dreht sich leicht entgegen dem Rotor. Nach Betz kann ein idealer Rotor höchstens 59,3 % der Windleistung nutzen.'
  },
  {
    step: 2,
    title: 'Nabe & aktive Pitch-Regelung',
    badge: 'Leistungsregelung · 0°–86°',
    viewMode: 'cutaway',
    focusPart: 'hub',
    demoWind: 17.5,
    cameraPos: [8.4, 2.3, 10.2],
    cameraTarget: [0, 0.2, 3.6],
    body:
      'Ab 12 m/s erreicht die Anlage ihre Nennleistung von 3,6 MW. Damit Rotor und Generator nicht überlasten, drehen elektrische Pitch-Motoren in der Nabe die Blätter schrittweise aus dem Wind. Beobachte, wie sich der Anstellwinkel der Blätter verstellt!'
  },
  {
    step: 3,
    title: 'Hauptwelle & 3-Stufen-Getriebe',
    badge: 'Mechanik · Übersetzung 1 : 92',
    viewMode: 'cutaway',
    focusPart: 'gearbox',
    demoWind: 11.0,
    cameraPos: [3.9, 1.5, 3.0],
    cameraTarget: [0, 0.25, 0.6],
    body:
      'Folge der Hauptwelle zum goldenen Planetenträger. Seine vier Planeten umlaufen das Sonnenrad und treiben es an. Dahinter kämmen zwei Stirnradpaare. Zusammen machen sie aus einer Rotorumdrehung 92 Umdrehungen der Generatorwelle.'
  },
  {
    step: 4,
    title: 'Elektromagnetische Induktion im Generator',
    badge: 'Elektrotechnik · 3,6 MW',
    viewMode: 'xray',
    focusPart: 'generator',
    demoWind: 12.5,
    cameraPos: [6.8, 2.1, -0.8],
    cameraTarget: [0, 0.25, -2.0],
    body:
      'Im Röntgenblick siehst du das Herz der Stromerzeugung: Die schnelle Welle treibt den Generator-Rotor im Inneren der kupfernen Statorwicklungen an. Das rotierende Magnetfeld induziert elektrischen Strom – je stärker der Wind, desto intensiver der Energiefluss.'
  },
  {
    step: 5,
    title: 'Azimutantrieb & Sicherheitsbremse',
    badge: 'Steuerung · Windnachführung',
    viewMode: 'cutaway',
    focusPart: 'yawDrive',
    demoWind: 26.2,
    cameraPos: [7.6, 0.8, 5.2],
    cameraTarget: [0, -0.6, -0.5],
    body:
      'Der Schalenstern misst die Windgeschwindigkeit, die Fahne zeigt die Richtung. Vier Azimutmotoren drehen die Gondel über den Zahnkranz in den Wind. Übersteigt der Sturm 25 m/s (wie jetzt eingestellt!), gehen die Blätter in Fahnenstellung und die rote Scheibenbremse greift ein.'
  },
  {
    step: 6,
    title: 'Aufstieg für Techniker',
    badge: 'Wartung · Zugang zum Maschinenhaus',
    viewMode: 'cutaway', focusPart: 'serviceAccess', demoWind: 9,
    cameraPos: [9.3,-5.9,9.4], cameraTarget: [0,-6.1,0],
    body: 'Hinter der Turmtür beginnt der Aufstieg. Der Service-Lift fährt Personen und Werkzeug nach oben. Als Rückfallebene dient die Leiter mit Steigschutzschiene, in die sich Techniker mit dem Läufer am Auffanggurt einklinken. An den Segmentflanschen liegen Ruhepodeste.'
  },
  {
    step: 7,
    title: 'Vom Turm ins Stromnetz',
    badge: 'Stromschienen · Transformator',
    viewMode: 'cutaway',
    focusPart: 'transformer',
    demoWind: 12.0,
    cameraPos: [11.5, -4.0, 10.2],
    cameraTarget: [0.8, -6.6, 0.2],
    body:
      'Im geöffneten Turm zeigen die Lichtimpulse den Weg des Stroms. Drei Leitungen führen zum Umrichter am Turmfuß. Der Transformator hebt die Spannung für die Einspeisung ins Netz auf 20 kV.'
  }
];
