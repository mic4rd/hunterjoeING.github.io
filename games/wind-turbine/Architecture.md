# Windkraftanlage 3D – Interaktiver Explainer (`games/wind-turbine/`)

## Überblick

Interaktiver Three.js-3D-Explainer einer 3,6-MW-Horizontalachsen-Windkraftanlage (HAWT) für HunterJoe Arcade. Zeigt anschaulich, wie Windenergie über Aerodynamik, Pitch-Regelung, 3-Stufen-Getriebe, Generator, Turmleitungen und Transformator in Netzstrom umgewandelt wird.

## Modulübersicht

| Datei | Aufgabe |
| :--- | :--- |
| `index.html` | Einstiegsseite, SEO/JSON-LD, Three.js-Importmap (`0.170.0`), Topbar, 3D-Viewport, Seitenpanel, Grafikmenü, Schadensbanner mit Reparaturknopf und Tour-Container |
| `styles.css` | Responsives Studio-Layout (Desktop-Sidebar, kompakte Werkzeugleiste, Grafik-Popover und mobiler Drawer), Dark-/Light-Mode, 3D-Label-Pins, SVG-Diagramm |
| `wt-data.js` | Betriebspunkt `computeTurbineTelemetry(v)` mit Leistung, Drehzahl, Blattwinkel und Blattspitzengeschwindigkeit, 12 Baugruppen (`TURBINE_PARTS`), 6-Schritte-Tour (`TURBINE_TOUR_STEPS`) |
| `wt-model.js` | Prozedurales 3D-Modell (verwundene NACA-Rotorblätter mit Pitch-Lagerung, Halbschalen-Gondel, verzahntes 3-Stufen-Getriebe, Scheibenbremse, Kupferstator-Generator, Azimutkranz, Turm mit 3-Phasen-Leitungen, Trafo und Stromimpulse). Liefert aktuellen Rotorwinkel, interpolierten Pitch und Bauteilpositionen an das Strömungsmodell |
| `wt-main.js` | Verknüpft Telemetrie, Modell, Wind und Rendering. OrbitControls, Kameraflüge, Label-Projektion, Raycasting, SVG-Leistungskurve und Tour |
| `wt-studio.js` | Studiolicht, weiche Schlagschatten, PMREM aus RoomEnvironment, ACES-Tonemapping, sRGB-Ausgabe und Theme-Synchronisierung |
| `wt-ao.js` | Renderpfad und Qualitätswahl für Kontaktschatten, Layer, Tiefenpuffer, Größenwechsel und FPS-Abschaltung |
| `wt-settings.js` | Validiert und speichert Grafikoptionen, verbindet Menü, Tastaturfokus, Regler und FPS-Anzeige |
| `wt-rotor.js` | Gemeinsame Maße für Rotor, Spinner und verwundene Blattprofilringe. Das Blatt-Mesh und die Kollisionshülle lesen dieselben Profilpunkte |
| `wt-blade-contact.js` | Vorberechnete Stützebenen der Profilringe und gleitender Kontakt im bewegten Blattkoordinatensystem |
| `wt-airflow.js` | WebGL-freies Geschwindigkeitsfeld, Integration, Hindernisse, Wiederverwendung, Blattkontakt und Anzahl der Partikel |
| `wt-streams.js` | Einlassspeichen und pro Saatring vorberechnete Laufzeiten für getaktete Kugelgruppen. Dieselbe Feldfunktion bestimmt Startpositionen und spätere Integration |
| `wt-wind-particles.js` | Zeichnet Köpfe und zurückgelegte Wege als ein InstancedMesh mit gemeinsamem Material. Der Ringpuffer liefert frühere Positionen ohne neue Puffer pro Bild |
| `wt-explosion.js` | Überdrehzahl, rotierende Trümmer aus den vorhandenen Baugruppen, Bodenkontakt, instanzierter Rauch und Staub, stummschaltbarer Ton und Wiederherstellung des Modellzustands |
| `wt-accident-controls.js` | Koordiniert Drehzahlanzeige, Schadensbanner, Auswahlsperre und Rückkehr zur vorherigen Kameraposition und Ansicht |
| `vendor/three-0.170.0-addons/` | Spielinterne r170-Abhängigkeit mit `postprocessing/{GTAOPass,Pass}.js`, `shaders/{GTAOShader,PoissonDenoiseShader,CopyShader}.js`, `math/SimplexNoise.js` und `LICENSE`. Die Importmap löst GTAOPass exakt auf. Three.js und übrige Addons kommen aus `shared/vendor/three-0.170.0/` |
| `tests/index.js`, `tests/importmap.mjs` | Verzeichniseinstieg für Node und Auflösung der Module über die Importmap der Seite |
| `tests/wind-airflow.test.mjs`, `tests/wind-geometry.test.mjs` | Feld, Saatbereich, Takt und Abstände der Kugeln, Recycling, Kontakt mit dem animierten Mesh, Spurpuffer, Materialwechsel und Kabelimpulse |
| `tests/model-fixture.mjs`, `tests/wind-explosion.test.mjs` | Echtes Turbinenmodell für Geometrie- und Schadenstests. Prüft Phasen, Bodenaufprall, exakte Reparatur, Tour, Bedienelemente und Audio |
| `tests/wind-ao.test.mjs`, `tests/wind-settings.test.mjs` | Passfolge, Puffer, Automatik, URL-Vorrang, Menübedienung, Speicherung, FPS und Asset-Versionen |

## Stellschrauben & Kennwerte

| Parameter | Wert | Bedeutung |
| :--- | :--- | :--- |
| `ratedPowerMW` | `3.6 MW` | Nennleistung |
| `rotorDiameterM` | `126 m` | Rotordurchmesser |
| `cutInSpeed` | `3.0 m/s` | Einschaltwindgeschwindigkeit |
| `ratedSpeed` | `12.0 m/s` | Nennwindgeschwindigkeit (Beginn aktiver Pitch-Regelung) |
| `cutOutSpeed` | `25.0 m/s` | Sturmabschaltung (Fahnenstellung 86° + Scheibenbremse) |
| `gearRatio` | `1 : 92` | Übersetzung Rotorwelle → Generatorwelle |
| Rotor und Windachse | `R = 0,82 + 8,6 = 9,42` Szeneneinheiten, Rotorachse auf `y = 0,25` | Der Wind kommt aus +Z. Der Rotor dreht um −Z. Die Lage der Rotorebene folgt der Blattgruppe |
| Anströmung | `U∞ = 0,68 · v`, Einlass bei `3,5 R` vor der Ebene, Auslass bei `3 R` dahinter, Saatringe bei `0,23 / 0,53 / 0,76 / 1,31 R` | In voller Besetzung je 4/6/4/2 Bahnen pro Ring. Die beiden äußeren zeigen den vorbeiströmenden Wind. Unter 160 Köpfen bleiben acht, unter 64 vier Bahnen |
| Sichtbarer Bereich | Volle Größe bis `1,80 R` vor und hinter der Rotorebene, Ausblenden bis `2,65 R`. Ausdünnung auf den untersten `2,4` Szeneneinheiten | An der Anlage sind Abstand und Richtung am besten lesbar. Der Boden begrenzt auch die Simulation |
| Axiale Induktion `a` | Anlauf über die ersten 2 m/s ab Einschaltwind weich auf `1/3`, danach Teillast konstant. Im Nennbetrieb `a = (v_nenn/v)³ / 3`, in Bereitschaft und bei Sturmabschaltung `a = 0` | Näherung anhand des Betriebspunkts und der Leistungsbegrenzung |
| Axialgeschwindigkeit und Aufweitung | `ξ = (z_Blatt − z) / R`, `g = 1 − a·(1 + ξ/√(1+ξ²))`, `U = U∞·g`, `Röhre = R·√((1−a)/g)` | Im Kern bleibt Querschnitt mal Axialgeschwindigkeit konstant. Die Radialgeschwindigkeit folgt der Ableitung des Röhrenradius. Am Rand gleitet die Verzögerung weich in die Freiströmung über |
| Tangentiale Induktion und Drall | `λr = (Blattspitzentempo/v) · r/Röhre`, `a′ = min(0,22, a·(1−a)/max(0,001, λr²))`. Umfangsgeschwindigkeit `2 a′ λr U∞`, über die ersten `0,35 R` eingeblendet, stromab mit `1/(1+0,35 ξ)` abgeschwächt | Nachlauf um +Z. Die Deckelung hält das Feld auch nahe der Achse endlich |
| Instanzbudget einschließlich Spuren | `N = min(B, rund(B·(0,13 + 0,58·v/28)·Dichte/100))`. Obergrenze `B = 4.000`, reduziert `1.500`, bei Windstille null | Reduktion bei Fensterbreite ≤ 768 px, ≤ 4 logischen Kernen, ≤ 4 GB gemeldetem Speicher oder reduzierter Bewegung. Der Regler reicht von 25 bis 200 % in 5-%-Schritten, Standard 100 % |
| Partikelschritt und -größe | Höchstens 50 ms Simulationszeit pro Bild, Teilschritte ≤ 1/60 s. Maximal sichtbarer Radius `min(0,085, 0,0026 · Kameraabstand)` | Die Kollisionshülle der Köpfe berücksichtigt den maximalen Kugelradius auch in der Nahansicht |
| Bewegungsspur und Kontakt | Spurpositionen vor `45/90 ms` mit `55/30 %` Kopfradius, reduziert nur die erste. Kontaktlicht klingt über `0,20 s` ab | Drei feste Momentaufnahmen liefern die interpolierten Positionen. Bei Neueintritt beginnt jede Spur am Kopf. Von Bauteilen verdeckte oder inzwischen durch ein Blatt belegte Wege werden gekürzt |
| AO-Stufen | Aus · Niedrig `0,38 / 0,16 / 0,35` · Mittel `0,52 / 0,22 / 0,72` · Stark `0,66 / 0,28 / 0,95` | Jeweils Radius, Dicke und Mischintensität wie beim Motor. Kontaktradius und Dicke beziehen sich auf die Modellgeometrie |
| AO-Automatik und `?ao=` | Mittel bei Fenster- **und** Viewportbreite > 768 px, sonst Aus. Bei ≤ 4 logischen Kernen oder ≤ 4 GB ebenfalls Aus | Zwei aufeinanderfolgende Sekunden unter 40 FPS schalten die automatische Wahl für die Sitzung ab. Manuelle Wahl hat Vorrang, darüber steht die URL (`0` Aus, `1` Mittel). AO benötigt `EXT_color_buffer_float` |
| Speicherung und Anzeige | `wind_turbine_settings` mit `aoLevel`, `shadows`, `density`. Standard sind automatische AO und eingeschaltete Schatten | Ungültige Felder fallen einzeln auf ihre Vorgaben zurück. Die FPS-Anzeige mittelt bei geöffnetem Menü über eine halbe Sekunde |
| Schadenssequenz | In `2,4 s` auf `88 U/min`, Schwerkraft `13,5` Szeneneinheiten/s², vertikaler Rückprallfaktor `0,24`, maximal `32` Rauch-/Staubinstanzen | Der tiefste Punkt der gedrehten Bauteil-Hüllbox begrenzt den Fall auf Fundamenthöhe. Nach dem ersten Aufprall entsteht dort Staub |

## Ansichtsmodi & Funktionen

1. **Außenansicht (`normal`)** – Vollständige Anlage mit blauen Windkügelchen, Rotor-Pitch und Schatten auf dem Studioboden.
2. **01 Cutaway (`cutaway`)** – Öffnet Gondel, Spinner, Getriebe, Generator und Turmfenster mit Schnittkanten.
3. **02 X-Ray (`xray`)** – Halbtransparente rauchgraue Matcap-Hülle mit neutralen Konturen. Die ausgewählte Hülle erscheint heller.
4. **03 Explosionsansicht (`exploded`)** – Easter Egg, gemäß Regel 10 nicht im öffentlichen Changelog. Bremse und Pitch fallen aus, Rotor und Warnanzeige drehen hoch, Turm und Gondel vibrieren. Währenddessen pausieren Windanzeige, Labels und Bauteilauswahl. Beim Bruch fliegen unter anderem drei einzelne Blätter, Spinner, Haube, Getriebe, Wellen und Generator. Das Banner zeigt einen zufälligen Schadensspruch. Heulen und Knall folgen der Arcade-Stummschaltung. **Anlage reparieren**, Escape, Ansichtswechsel, Reset, Tour oder Änderung des Windes beenden die Sequenz. Die Reparatur stellt Bauteilpositionen, Ausrichtungen, Materialien, Sichtbarkeiten und Kamera aus dem gespeicherten Zustand wieder her.
5. **04 Wind-Regler & 05 Leistungskurve** – Gekoppelter Regler + direkt per Klick/Drag bedienbares SVG-Diagramm `P(v)`.
6. **06 Schritt-für-Schritt-Tour** – 6 geführte Stationen mit synchronisierter Kamera, Ansichtsmodus, Wind-Preset und Bauteil-Fokus. Die Aerodynamikstation aktiviert den Fluss und blickt schräg von der Seite auf Anströmung und Nachlauf. Die letzte Station zeigt den Transformator und die Stromimpulse im Schnitt. Alle Stationen verwenden reguläre Ansichten.

## Strömung und Darstellung

Die Speichen jedes Rings geben gleichzeitig Kugeln ab. Der Takt einer Gruppe folgt der Laufzeit ihrer Bahn vom Einlass bis zum Auslass. Eine Tabelle aus dem stationären Feld füllt die Bahnen bereits beim ersten Bild und beim Verstellen des Windes mit zeitlich gleich weit auseinanderliegenden Köpfen. Wo der Wind langsamer wird, rücken die Köpfe räumlich zusammen. Weitung und gegenläufiger Drall lassen sich an denselben Kugelreihen weiterverfolgen.

Bei jedem Bild aktualisiert das mechanische Modell zuerst den sichtbaren Rotor. Der Integrator übernimmt die tatsächliche Blattstellung einschließlich des laufenden Pitch-Übergangs. Er prüft den Weg eines Kügelchens zwischen alter und neuer Blattstellung gegen die aufgeweitete Profilhülle. Beim Kontakt entfernt er die Bewegung in die Eintrittsfläche und führt den Rest entlang der Fläche mit einer kleinen Ablenkung zur Hinterkante. Vor dem Spinner weichen die Bahnen radial aus. Am konischen Turm lenkt eine angenäherte Zylinderumströmung die Luft seitlich ab und hinterlässt einen schmalen langsameren Nachlauf. Außenluft bleibt auch im Schnitt außerhalb der Gondel. Die Stromimpulse in den Turmleitungen haben ihre eigene Animation.

Die Farbe reicht von tiefblauem Nachlauf bis zur cyanfarbenen freien Anströmung. Beim Gleiten am Blatt leuchtet der Kopf kurz auf. Kleinere, blassere Kugeln auf seinem zurückgelegten Weg zeigen Richtung und Tempo. Undurchsichtige Bauteile erhalten ihre Kontaktschatten im EffectComposer über RenderPass und GTAOPass. Anschließend zeichnet ein zweiter RenderPass Kügelchen, transparente Flächen und Leuchteffekte mit dem vorhandenen Tiefenpuffer. Der OutputPass übernimmt die Farbausgabe. Der direkte Renderpfad bei deaktivierter AO nutzt dasselbe Licht und Tonemapping.

## Prüfung und Grenzen

`node --test games/wind-turbine/tests/` prüft ohne WebGL unter anderem den freien Querschnitt an den **gezeichneten Dreiecken** sowie am Spinnerprofil und am Turmstumpf. Je Betriebspunkt (7, 12, 20 und 26,5 m/s) laufen 720 Kügelchen fünf Sekunden lang, mit gezielten Anflügen und Wechseln zwischen Außen-, Schnitt- und Röntgenansicht. Weitere Stichproben prüfen sichtbare Spurkugeln am aktuell gedrehten Blatt. Die Schadenstests prüfen am Modell Abbruch, Flug, Bodenkontakt und die vollständige Wiederherstellung aus Schnitt- und Röntgenansicht. Die Blattprüfung verlangt im Querschnitt mindestens einen Kugelradius Abstand, die Prüfung der Festkörper ein außen liegendes Zentrum. Die numerische Toleranz beträgt 0,00001 Szeneneinheiten.

Das stationäre Aktuatorscheibenfeld und die geglätteten Profilhüllen veranschaulichen mittlere Bahnen. Turbulenz, einzelne Blattspitzenwirbel und Ablösung werden nicht aufgelöst. Die Prüfung von Schattenkanten, Lesbarkeit und Bildrate auf realer Mobilhardware erfolgt im Browser.

## Changelog

- **2026-11-25** (`main`, `8c0fce8`) – Erstversion `v0.1.0`: Vollständiger 3D-Explainer einer 3,6-MW-Windkraftanlage mit Cutaway, X-Ray, Exploded View mit 12 Labels (später ersetzt: Überdrehzahl-Sequenz in v0.2.0), Wind-Regler, interaktiver Leistungskurve und 6-Schritte-Tour.
- **2026-11-25** (`main`) – Patch `v0.1.1`: Rotationsachse von Bremsscheibe, schneller Welle & Kupplung (`rotateX(Math.PI / 2)` in Geometrie vorgekippt), Getriebe-Achsabstände (24:13 / 22:11) und Blattausrichtung korrigiert; mobiles Steuerungsmenü mit festem „Zurück zu 3D“-Knopf & Backdrop-Tap-Close ergänzt.
- **2026-11-27** (`main`) – Patch `v0.1.2`: Bauteil-Highlight per geklontem Gruppenmaterial isoliert, Anemometer bei `0,0 m/s` gestoppt, Sturmschutz-Drehzahl (`> 25 m/s`) bei geschlossener Bremse auf `0 U/min` gesetzt sowie `pointercancel`/`lostpointercapture` am Diagramm-Scrubbing und Theme-Sync-Deduplizierung ergänzt.
- **2026-11-27** (`main`, `231d7c3`) – Patch `v0.1.3`: Three.js und Addons auf lokales Hosting umgestellt, CSP und Referrer-Schutz ergänzt.
- **2026-11-28** (`codex/wind-v0.2.0`, `101c281`, Fork, kein PR) – Feature `v0.2.0`: Getaktete Kugelspuren zeigen Anströmung, Blattkontakt und gegenläufigen Nachlauf. Studiolicht, Kontaktschatten, rauchgrauer Röntgenblick, Grafikmenü und reparierbare Überdrehzahl-Sequenz ergänzt.
