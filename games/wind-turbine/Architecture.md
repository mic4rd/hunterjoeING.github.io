# Windkraftanlage 3D – Interaktiver Explainer (`games/wind-turbine/`)

## Überblick

Interaktiver Three.js-3D-Explainer einer 3,6-MW-Horizontalachsen-Windkraftanlage (HAWT) für HunterJoe Arcade. Zeigt anschaulich, wie Windenergie über Aerodynamik, Pitch-Regelung, 3-Stufen-Getriebe, Generator, Turmleitungen und Transformator in Netzstrom umgewandelt wird.

## Modulübersicht

| Datei | Aufgabe |
| :--- | :--- |
| `index.html` | Einstiegsseite, SEO/JSON-LD, Three.js-Importmap (`0.170.0`), Topbar, 3D-Viewport, Seitenpanel, Grafikmenü, Schadensbanner mit Reparaturknopf und Tour-Container |
| `styles.css` | Responsives Studio-Layout (Desktop-Sidebar, kompakte Werkzeugleiste, Grafik-Popover und mobiler Drawer), Dark-/Light-Mode, 3D-Label-Pins, SVG-Diagramm |
| `wt-data.js` | Betriebspunkt `computeTurbineTelemetry(v)` mit Leistung, Drehzahl, Blattwinkel und Blattspitzengeschwindigkeit, 13 Baugruppen (`TURBINE_PARTS`), 8-Schritte-Tour (`TURBINE_TOUR_STEPS`) |
| `wt-model.js` | Prozedurales 3D-Modell (verwundene NACA-Rotorblätter mit Pitch-Lagerung, Halbschalen-Gondel, verzahntes 3-Stufen-Getriebe, Scheibenbremse, Kupferstator-Generator, Azimutkranz, Turm mit 3-Phasen-Leitungen, Trafo und Stromimpulse). Liefert aktuellen Rotorwinkel, interpolierten Pitch und Bauteilpositionen an das Strömungsmodell |
| `wt-gears.js` | Generiert die innen- und außenverzahnten Räder mit Bohrungen, Planetenträger, Stirnradstufen, Getriebegehäuse und Azimutantriebe. Die Rotation aller Wellen folgt dem Rotorwinkel |
| `wt-service.js` | Turmtür, Eingang, Steigschutzleiter, gelochte Podeste, bewegliche Liftkabine und Windsensorik auf dem hinteren Messmast |
| `wt-main.js` | Verknüpft Telemetrie, Modell, Wind und Rendering. OrbitControls, Kameraflüge, Label-Projektion, Raycasting, SVG-Leistungskurve und Tour |
| `wt-studio.js` | Studiolicht, weiche Schlagschatten, PMREM aus RoomEnvironment, ACES-Tonemapping, sRGB-Ausgabe und Theme-Synchronisierung |
| `wt-froude.js`, `wt-froude-panel.js` | Gemeinsame axiale Induktion für Feld und Rechnung, ideale und elektrische Leistungswerte, deutsch formatierte Live-Rechnung und aufklappbare Herleitung |
| `wt-measurements.js` | Wiederverwendete Ringe mit beschrifteten Messquerschnitten. Passt die Tourprojektion an den Platz zwischen Werkzeugleiste und Tourkarte an |
| `wt-weather.js`, `wt-landscape.js` | Wetterkennlinie und zeitliche Glättung, Küstenwiese mit Schattenempfang, bewegtes Wasser, Wolkenhimmel und atmosphärischer Dunst |
| `wt-terrain.js` | Gemeinsames Dreiecks-Höhenfeld für Hügel, Bauwerksauflager und Aufprall der Trümmer |
| `wt-ao.js` | Renderpfad und Qualitätswahl für Kontaktschatten, Layer, Tiefenpuffer, Größenwechsel und FPS-Abschaltung |
| `wt-settings.js` | Validiert und speichert Grafikoptionen, verbindet Menü, Tastaturfokus, Regler und FPS-Anzeige |
| `wt-rotor.js` | Gemeinsame Maße für Rotor, Spinner und verwundene Blattprofilringe. Das Blatt-Mesh und die Kollisionshülle lesen dieselben Profilpunkte |
| `wt-blade-contact.js` | Vorberechnete Stützebenen der Profilringe und gleitender Kontakt im bewegten Blattkoordinatensystem |
| `wt-airflow.js` | WebGL-freies Geschwindigkeitsfeld, Integration, Hindernisse, Wiederverwendung, Blattkontakt und Anzahl der Partikel |
| `wt-streams.js` | Kontinuierliche Saat über den Einlassquerschnitt. Eine Laufzeittabelle aus dem stationären Feld füllt das Startvolumen |
| `wt-wind-particles.js` | Zeichnet den Kugelstrom als ein InstancedMesh mit gemeinsamem Material. Helligkeit, Größe und Position stehen in wiederverwendeten Puffern |
| `wt-explosion.js` | Überdrehzahl, rotierende Trümmer aus den vorhandenen Baugruppen, Bodenkontakt, instanzierter Rauch und Staub, stummschaltbarer Ton und Wiederherstellung des Modellzustands |
| `wt-accident-controls.js` | Koordiniert Drehzahlanzeige, Schadensbanner, Auswahlsperre und Rückkehr zur vorherigen Kameraposition und Ansicht |
| `vendor/three-0.170.0-addons/` | Spielinterne r170-Abhängigkeit mit `postprocessing/{GTAOPass,Pass}.js`, `shaders/{GTAOShader,PoissonDenoiseShader,CopyShader}.js`, `math/SimplexNoise.js` und `LICENSE`. Die Importmap löst GTAOPass exakt auf. Three.js und übrige Addons kommen aus `shared/vendor/three-0.170.0/` |
| `tests/index.js`, `tests/importmap.mjs` | Verzeichniseinstieg für Node und Auflösung der Module über die Importmap der Seite |
| `tests/wind-airflow.test.mjs`, `tests/wind-geometry.test.mjs` | Feld, Flächenabdeckung, axiale Verdichtung, Recycling, Kontakt mit dem animierten Mesh, Pufferwiederverwendung, Materialwechsel und Kabelimpulse |
| `tests/wind-machinery.test.mjs` | Eingriff der Azimutritzel am gezeichneten Kranz, Wellenfluchten, Stufenübersetzungen, Bauraum, freier Liftweg und Bewegung der Windsensoren |
| `tests/wind-coast-froude.test.mjs` | Betz-Maximum, Live-Betriebspunkte, projizierte Ringe und Lift, Sichtlinien durch den Schnitt, Wetterübergänge, Auflager auf beiden Geländestufen und sichtbare Kontur des Kugelstroms |
| `tests/airflow-benchmark.mjs` | Direkter Node-Aufruf misst Integration und Befüllen des Instanzpuffers ohne WebGL. Gibt Median und 95. Perzentil aus |
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
| `gearRatio` und Zähnezahlen | Sonne / Planet / festes Hohlrad `16 / 30 / 76`, vier Planeten. Beide Stirnradpaare `68 / 17`. Gesamt `(1 + 76/16) · (68/17)² = 92` | Planetenträger auf der Hauptwelle. Relativ zum Träger drehen die Planeten mit `−76/30` seiner Drehzahl. Beide Außenpaarungen kehren den Drehsinn um. Bremsscheibe, Kupplung und Generator laufen gemeinsam mit der Ausgangswelle |
| Azimut | Außenverzahnung `56 / 12`, Modul `0,035`, Achsabstand `0,98 + 0,21 = 1,19` Szeneneinheiten | Vier Motoren sitzen auf dem durchbohrten Maschinenträger. Ihre koaxialen Ritzel greifen außen in den festen Kranz über dem Turmflansch. Bei der festen Windrichtung ruht der Azimutantrieb |
| Rotor und Windachse | `R = 0,82 + 8,6 = 9,42` Szeneneinheiten, Rotorachse auf `y = 0,25` | Der Wind kommt aus +Z. Der Rotor dreht um −Z. Die Lage der Rotorebene folgt der Blattgruppe |
| Anströmung | `U∞ = 0,68 · v`, Einlass `3,5 R` vor der Ebene, Auslass `3 R` dahinter, Einlassradius `1,30 R` | Eine Halton-Folge verteilt die Teilchen flächig im freien Querschnitt oberhalb des Bodens. Für das Startbild integriert die Tabelle 40 gleich große Ringflächen in je 96 axialen Schritten |
| Sichtbarer Bereich | Ausblenden über die letzten `0,42 R` bis `2,15 R` vor bzw. `2,35 R` hinter dem Rotor. Ausdünnung auf den untersten `2,4` Szeneneinheiten | Zwischen 0,80 und 1,08 lokalen Röhrenradien schrumpfen die Kugeln weich zur dünnen Bypasshülle. Der gesamte sichtbare Kugelquerschnitt bleibt innerhalb des Einlassradius |
| Axiale Induktion `a` | Anlauf über die ersten 2 m/s ab Einschaltwind weich auf `1/3`, danach Teillast konstant. Im Nennbetrieb `a = (v_nenn/v)³ / 3`, in Bereitschaft und bei Sturmabschaltung `a = 0` | Näherung anhand des Betriebspunkts und der Leistungsbegrenzung |
| Axialgeschwindigkeit und Aufweitung | `ξ = (z_Blatt − z) / R`, `g = 1 − a·(1 + ξ/√(1+ξ²))`, `U = U∞·g`, `Röhre = R·√((1−a)/g)` | Im Kern bleibt Querschnitt mal Axialgeschwindigkeit konstant. Die Radialgeschwindigkeit folgt der Ableitung des Röhrenradius. Am Rand gleitet die Verzögerung weich in die Freiströmung über |
| Tangentiale Induktion und Drall | `λr = (Blattspitzentempo/v) · r/Röhre`, `a′ = min(0,22, a·(1−a)/max(0,001, λr²))`. Umfangsgeschwindigkeit `2 a′ λr U∞`, über die ersten `0,35 R` eingeblendet, stromab mit `1/(1+0,35 ξ)` abgeschwächt | Nachlauf um +Z. Die Deckelung hält das Feld auch nahe der Achse endlich |
| Kugelbudget | `N = min(B, rund(B·(0,26 + 0,46·v/28)·Dichte/100))`. Obergrenze `B = 14.400`, reduziert `4.600`, bei Windstille null | Reduktion bei Fensterbreite ≤ 768 px, ≤ 4 logischen Kernen, ≤ 4 GB gemeldetem Speicher oder reduzierter Bewegung. Der Regler reicht von 25 bis 200 % in 5-%-Schritten, Standard 100 % |
| Partikelschritt und -größe | Höchstens 50 ms pro Bild, Teilschritte ≤ 1/60 s. Maximaler sichtbarer Radius `min(0,081, 0,0024 · Kameraabstand)`, Kollisionsradius `0,085` | Jede Instanz zeigt ein eigenständiges Luftteilchen. Kontaktleuchten klingt in `0,20 s` ab |
| AO-Stufen | Aus · Niedrig `0,38 / 0,16 / 0,70` · Mittel `0,52 / 0,22 / 1,44` · Stark `0,66 / 0,28 / 1,90` | Radius / Dicke / Mischintensität. Die Gewichtung des Abschattungsanteils ist gegenüber der Motorvorlage verdoppelt, an Schwarz begrenzt |
| AO-Automatik und `?ao=` | Mittel bei Fenster- **und** Viewportbreite > 768 px, sonst Aus. Bei ≤ 4 logischen Kernen oder ≤ 4 GB ebenfalls Aus | Zwei aufeinanderfolgende Sekunden unter 40 FPS schalten die automatische Wahl für die Sitzung ab. Manuelle Wahl hat Vorrang, darüber steht die URL (`0` Aus, `1` Mittel). AO benötigt `EXT_color_buffer_float` |
| Speicherung und Anzeige | `wind_turbine_settings` mit `aoLevel`, `shadows`, `density`. Standard sind automatische AO und eingeschaltete Schatten | Ungültige Felder fallen einzeln auf ihre Vorgaben zurück. Die FPS-Anzeige mittelt bei geöffnetem Menü über eine halbe Sekunde |
| Messquerschnitte | `ξ = −1,70 / 0 / +1,85` | Ringradius aus dem aktuellen Strömungsfeld. Die Außenringe veranschaulichen die Fernwerte in endlicher Sichtweite |
| Küste und Wetter | Wolkendecke gleitend von 5 bis 14 m/s, Sturmanteil von 15 bis 24 m/s. Zeitkonstante `1/2,2 s` | Wind verändert Wellenhöhe, Schaum, Himmelsfarbe und Licht. Gelände mit 96 × 96, Wasser mit 128 × 128 Zellen, reduziert 48 × 48 bzw. 56 × 56 mit vereinfachtem Wellendetail |
| Schadenssequenz | In `2,4 s` auf `88 U/min`, Schwerkraft `13,5` Szeneneinheiten/s², vertikaler Rückprallfaktor `0,24`, maximal `32` Rauch-/Staubinstanzen | Baugruppen stützen sich auf dem höchsten Geländepunkt unter ihrer gedrehten Hüllbox ab. Bei Blättern erfolgt die Prüfung streifenweise entlang der gezeichneten Profile. Am ersten Aufprallort steigt Staub auf |

## Ansichtsmodi & Funktionen

1. **Außenansicht (`normal`)** – Vollständige Anlage mit blauen Windkügelchen, Rotor-Pitch und Schatten auf dem Grashügel über der Küste.
2. **01 Cutaway (`cutaway`)** – Öffnet Gondel, Spinner, Getriebe, Generator und Turmfenster mit Schnittkanten.
3. **02 X-Ray (`xray`)** – Halbtransparente rauchgraue Matcap-Hülle mit neutralen Konturen. Die ausgewählte Hülle erscheint heller.
4. **03 Explosionsansicht (`exploded`)** – Easter Egg, gemäß Regel 10 nicht im öffentlichen Changelog. Bremse und Pitch fallen aus, Rotor und Warnanzeige drehen hoch, Turm und Gondel vibrieren. Währenddessen pausieren Windanzeige, Labels und Bauteilauswahl. Beim Bruch fliegen unter anderem drei einzelne Blätter, Spinner, Haube, Getriebe, Wellen und Generator. Das Banner zeigt einen zufälligen Schadensspruch. Heulen und Knall folgen der Arcade-Stummschaltung. **Anlage reparieren**, Escape, Ansichtswechsel, Reset, Tour oder Änderung des Windes beenden die Sequenz. Die Reparatur stellt Bauteilpositionen, Ausrichtungen, Materialien, Sichtbarkeiten und Kamera aus dem gespeicherten Zustand wieder her.
5. **04 Wind-Regler & 05 Leistungskurve** – Gekoppelter Regler + direkt per Klick/Drag bedienbares SVG-Diagramm `P(v)`.
6. **Tour in acht Schritten** – Auf den Anflug am Rotor folgt die Froude-Rankine-Station. Danach führen Pitch, Getriebe, Generator und Azimut zum Turmaufstieg und schließlich zum Transformator. In der Aufstiegsstation bleiben Tür, Leiter und die kurze Demonstrationsfahrt bis zum ersten Ruhepodest gleichzeitig im Bild.

## Froude-Rankine und Betz

Die ideale, stationäre Aktuatorscheibe hat den Massenstrom ṁ = ρ A v<sub>R</sub>. Der Schub F = ṁ (v₁ − v₃) liefert über P = F v<sub>R</sub> = ½ ṁ (v₁² − v₃²) das Geschwindigkeitsmittel v<sub>R</sub> = (v₁ + v₃)/2. Mit x = v₃/v₁ folgt c<sub>P</sub> = ½ (1 + x)(1 − x²). Das Maximum bei x = ⅓ ergibt v<sub>R</sub> = ⅔ v₁ und c<sub>P,max</sub> = 16/27. Daraus lässt sich für gegebenen Wind und gewünschte Leistung eine ideale Mindestfläche abschätzen.

Die Station stellt dem Optimum die tatsächlich verwendete Induktion a gegenüber. Damit sind v<sub>R</sub> = (1 − a)v₁ und v₃ = (1 − 2a)v₁. Rotorfläche und Windleistung stammen aus derselben Telemetrie wie elektrische Leistung und elektrischer Leistungsbeiwert. Der Vergleich zur Betz-Leistung zeigt den Einfluss von Leistungskennlinie, Pitch und Sturmabschaltung. Bei Windstille entfällt der Prozentvergleich. Beide Windregler aktualisieren Rechnung und Ringradien. Beim Verlassen verschwinden die Messmarken.

## Mechanik und Wartungszugang

Die Sonne treibt das erste Stirnrad. Auf der Zwischenwelle sitzen dessen Gegenritzel und das zweite Stirnrad. Das letzte Ritzel treibt die schnelle Welle wieder auf der Rotorachse an. Die Schrägverzahnung hat in jedem Paar entgegengesetzte Neigungen. Jede Teilung hat trapezförmige Flanken mit getrennten Normalen für Zahn und Stirnfläche. Die Kopfbreite beträgt 35 % der Teilung. Große Stirnräder und Planeten haben einen Radkranz, eine gelochte Scheibe und eine Nabe. Die Module betragen 0,018 in der Planetenstufe und 0,014 in beiden Stirnradstufen. Die räumlich getrennten Ebenen, Hohlbohrungen und offenen Gehäusehälften geben den Blick auf die Kraftübertragung frei.

Hinter der gerahmten Tür liegen das Eingangspodest, die Leiter mit mittiger Steigschutzschiene und der Lift an zwei Führungsseilen. Die Segmentpodeste lassen Leiter, Kabine und Kabel durch. Im Schnitt und Röntgenblick startet die signalgelbe Gitterkabine auf mittlerer Turmhöhe und fährt zwischen Eingang und oberem Ausstieg. In der Tour beginnt sie am Eingang. Neben dem flachen Lamellenkühler auf dem Gondeldach drehen sich drei tangential offene Schalen proportional zum Wind. Die Fahne zeigt mit der Spitze nach +Z in die Anströmung und pendelt leicht um diese Richtung.

## Strömung und Darstellung

Beim Start und beim Ändern von Wind oder Dichte verteilt die Simulation die Kugeln nach der Verweilzeit im Feld. Langsamere Bahnen enthalten pro axialem Abschnitt mehr Kugeln. Danach durchläuft jedes Teilchen das Feld bis zum Auslass. Sein Platz im Puffer wird dort für einen neuen Eintritt auf der Einlassscheibe frei.

Bei jedem Bild aktualisiert das mechanische Modell zuerst den sichtbaren Rotor. Der Integrator übernimmt die tatsächliche Blattstellung einschließlich des laufenden Pitch-Übergangs. Er prüft den Weg eines Kügelchens zwischen alter und neuer Blattstellung gegen die aufgeweitete Profilhülle. Beim Kontakt entfernt er die Bewegung in die Eintrittsfläche und führt den Rest entlang der Fläche mit einer kleinen Ablenkung zur Hinterkante. Vor dem Spinner weichen die Bahnen radial aus. Am konischen Turm lenkt eine angenäherte Zylinderumströmung die Luft seitlich ab und hinterlässt einen schmalen langsameren Nachlauf. Außenluft bleibt auch im Schnitt außerhalb der Gondel. Die Stromimpulse in den Turmleitungen haben ihre eigene Animation.

Die seitliche Standardansicht zeigt den verengten Einlasskern und die breitere Kontur im Nachlauf. Eine sanfte Größenmodulation nach Eintrittszeit macht die Verdichtung auch beim Bewegen sichtbar. Die Farbe reicht von tiefblauem Nachlauf bis zur cyanfarbenen freien Anströmung. Beim Gleiten am Blatt leuchtet das Teilchen kurz auf. Undurchsichtige Bauteile erhalten ihre Kontaktschatten im EffectComposer über RenderPass und GTAOPass. Anschließend zeichnet ein zweiter RenderPass Kügelchen, transparente Flächen und Leuchteffekte mit dem vorhandenen Tiefenpuffer. Der OutputPass übernimmt die Farbausgabe. Der direkte Renderpfad bei deaktivierter AO nutzt dasselbe Licht und Tonemapping.

## Küstenlandschaft

Drei Meshes bilden die Umgebung. Das Gelände geht vom ebenen Baugrund über eine flache Wiese in die untergetauchte Küste über. Der Standardwerkstoff kombiniert zwei Rauschskalen für die Grasfarbe und empfängt die Schatten der Anlage. Die Schattenkamera bleibt eng um Turm und Rotor ausgerichtet. Die feinere Geländestufe unterteilt dieselben Höhenfelddreiecke wie die grobe. Trafosockel, Zugangsstufen und Fundament haben so auf beiden Stufen Kontakt zum Gras.

Das Meer kombiniert periodische Wellen, abgeleitete Oberflächennormalen und Schaum an den Kämmen. Eine Himmelskuppel mischt Höhenverlauf, Dunst und Wolken. Beide Themes haben eigene Licht- und Dunstfarben. In Schnitt, Röntgenblick und Messstation rücken Wellen und Wolken in den Dunst zurück, während das Bauteillicht seine Lesbarkeit behält. Wasser und Himmel liegen außerhalb der Kontaktschatten.

## Prüfung und Grenzen

`node --test games/wind-turbine/tests/` prüft ohne WebGL unter anderem den freien Querschnitt an den **gezeichneten Dreiecken** sowie am Spinnerprofil und am Turmstumpf. Je Betriebspunkt (7, 12, 20 und 26,5 m/s) laufen 720 Kügelchen fünf Sekunden lang, mit gezielten Anflügen und Wechseln zwischen Außen-, Schnitt- und Röntgenansicht. Weitere Stichproben prüfen die Instanzen bei hoher Dichte am aktuell gedrehten Blatt und die Sektorenbelegung der Einlassfläche. Die Schadenstests prüfen am Modell Abbruch, Flug, Bodenkontakt und die vollständige Wiederherstellung aus Schnitt- und Röntgenansicht. Die Blattprüfung verlangt im Querschnitt mindestens einen Kugelradius Abstand, die Prüfung der Festkörper ein außen liegendes Zentrum. Für Blattabstand, Achsabstand und bündige Kontaktflächen gilt eine numerische Toleranz von 0,00001 Szeneneinheiten. Beim Azimut werden zusätzlich die gezeichneten Ritzelflanken gegen das Zahnprofil des Kranzes geprüft.

Das stationäre Aktuatorscheibenfeld und die geglätteten Profilhüllen veranschaulichen mittlere Bahnen. Turbulenz, einzelne Blattspitzenwirbel und Ablösung werden nicht aufgelöst. Die Prüfung von Schattenkanten, Lesbarkeit und Bildrate auf realer Mobilhardware erfolgt im Browser.

## Changelog

- **2026-11-25** (`main`, `8c0fce8`) – Erstversion `v0.1.0`: Vollständiger 3D-Explainer einer 3,6-MW-Windkraftanlage mit Cutaway, X-Ray, Exploded View mit 12 Labels (später ersetzt: Überdrehzahl-Sequenz in v0.2.0), Wind-Regler, interaktiver Leistungskurve und 6-Schritte-Tour (später ersetzt: acht Stationen in v0.2.0).
- **2026-11-25** (`main`) – Patch `v0.1.1`: Rotationsachse von Bremsscheibe, schneller Welle & Kupplung (`rotateX(Math.PI / 2)` in Geometrie vorgekippt), Getriebe-Achsabstände (24:13 / 22:11, später ersetzt: Planetenstufe und zwei Stirnradpaare in v0.2.0) und Blattausrichtung korrigiert; mobiles Steuerungsmenü mit festem „Zurück zu 3D“-Knopf & Backdrop-Tap-Close ergänzt.
- **2026-11-27** (`main`) – Patch `v0.1.2`: Bauteil-Highlight per geklontem Gruppenmaterial isoliert, Anemometer bei `0,0 m/s` gestoppt, Sturmschutz-Drehzahl (`> 25 m/s`) bei geschlossener Bremse auf `0 U/min` gesetzt sowie `pointercancel`/`lostpointercapture` am Diagramm-Scrubbing und Theme-Sync-Deduplizierung ergänzt.
- **2026-11-27** (`main`, `231d7c3`) – Patch `v0.1.3`: Three.js und Addons auf lokales Hosting umgestellt, CSP und Referrer-Schutz ergänzt.
- **2026-11-28** (`codex/wind-v0.2.0`, `101c281`, `5eeca82`, `9c285bd`, Runde 3 SHA: (folgt), kein PR) – Feature `v0.2.0` mit Küstenwetter, Kugelstrom, Kontaktschatten, Röntgenblick, Grafikmenü und reparierbarer Überdrehzahl. Die erweiterte Tour zeigt arbeitende Zahnradstufen, Azimut, Messmast, Service-Lift und die Froude-Rankine-Rechnung mit drei Messquerschnitten.
