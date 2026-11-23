# Bauplanvisualisierung

Ein Grundriss, der beim Scrollen zum Haus wird. Die Seite zeigt „Haus Eiche“, ein eingeschossiges Hofhaus mit 355 m², als Rundgang für ein Architekturbüro.

## Was die Seite macht

- Sie startet als Blaupause: Grundriss Erdgeschoss mit Achsen, Maßketten und Raumnamen.
- Beim Scrollen wachsen die Wände aus dem Plan, die Kamera kommt zur Haustür herunter und geht durch sieben Stationen: Eingang, Wohnen, Kochen und Essen, Hof, Galerie, Schlafen, Terrasse.
- Jeder Raum bleibt Strichzeichnung, bis die Kamera ankommt. Dann wischen die Materialien darüber.
- Zu jedem Raum gibt es einen Marker mit aufklappbarer Akte.
- Am Ende steigt die Kamera in die Vogelperspektive, die Wände sinken zurück, und die Planrolle fährt wieder über das Haus.

Grundriss und Haus stammen aus denselben Zahlen (`js/house.js`). Was im Plan steht, steht auch im Modell.

## Technik

- three.js r160 von jsDelivr, sonst keine Bibliothek
- kein Build-Schritt, einfache Dateien
- keine Bilddateien: Backstein, Putz, Eiche, Travertin, Zink, Himmel und Gelände entstehen im Shader
- eigener Scroll-Ablauf mit Kamerafahrt über Stützpunkte

| Datei | Inhalt |
| --- | --- |
| `index.html` | Seite, Texte, Styles |
| `js/engine.js` | Renderer, Shader für Blaupause und Materialien, Geometrie-Sammler |
| `js/house.js` | Wände, Fenster, Böden, Dach, Haustür |
| `js/site.js` | Gelände, Hof, Terrasse, Bäume, Himmel, Licht, Feuer |
| `js/staging.js` | Möbel je Raum |
| `js/story.js` | Planblatt, Kamera, Ablauf, Oberfläche |

## Lokal ansehen

Die Seite braucht einen kleinen Webserver, zum Beispiel:

```
python -m http.server 8000
```

Danach `http://localhost:8000` öffnen. Mit `#direkt` am Ende der Adresse wird das Intro übersprungen.

## Hinweise

- Konzeptstudie. Das Büro „Nordlot Architekten“, das Haus und die Adresse sind erfunden.
- Die Idee „Grundriss wird beim Scrollen zum Haus“ folgt dem Vorbild [Casa Serra](https://github.com/sam1983aing/casa-serra) von Sam Aing. Code, Haus, Texte und Gestaltung sind neu.
- Am besten auf dem Laptop. Die Seite braucht WebGL 2.
