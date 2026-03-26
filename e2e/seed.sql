-- =============================================================================
-- Playwright Test-Seed
-- Idempotent: kann mehrfach ausgeführt werden.
-- Aktualisiert Passwort für User "abi85" (ID egal, muss existieren)
-- und legt Story 1801 + feste Bild-/Text-IDs an.
-- =============================================================================

-- Test-User abi85: Passwort auf Testwert setzen (egal welche ID er hat).
-- Falls er noch nicht existiert, wird er mit ID 100 angelegt.
INSERT INTO users (id, name, email, password, created, version)
VALUES (100, 'abi85', 'abi85@test.local',
        '$2a$10$//3FG/Z9sns3/EKEbP4yM.vA/EkU.lvUfxQtDa1h.flq2Oh4VYO9a',
        NOW(), 0)
ON CONFLICT (name) DO UPDATE
    SET password = EXCLUDED.password;

INSERT INTO user_roles (id, role)
SELECT id, 'user' FROM users WHERE name = 'abi85'
ON CONFLICT DO NOTHING;

-- Story 1801 (3-Spalten-Layout), owned by abi85
INSERT INTO stories (id, name, description, user_id, created, version, layout)
SELECT 1801, 'DnD-Testalbum', 'Playwright-Testdaten', id, NOW(), 0, '3col'
FROM users WHERE name = 'abi85'
ON CONFLICT (id) DO UPDATE
    SET layout = '3col';

-- Bilder — Col 0
INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 211, 'Einer war schon immer gern Polizist !', '/20250818_135428_6d60d04b-94d3-4036-9c06-9c11316abe40.jpg',
       1801, id, 0, 0, NOW(), 0, 0, false
FROM users WHERE name = 'abi85'
ON CONFLICT (id) DO UPDATE
    SET pfad=EXCLUDED.pfad, story_id=1801, story_column=0, story_position=0, deleted=false;

-- Bilder — Col 1
INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 4027, '7k zusammen auf 40 Jahre Party', '/20250818_135510_f7b0be4e-1bbc-4ea0-81be-9d172acfa370.jpg',
       1801, id, 1, 0, NOW(), 0, 0, false
FROM users WHERE name = 'abi85'
ON CONFLICT (id) DO UPDATE
    SET pfad=EXCLUDED.pfad, story_id=1801, story_column=1, story_position=0, deleted=false;

INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 3160, '7k oder 8k - Herr Gottschalk mit Austausch-Schülerinnen', '/20250818_135703_61c3b02d-4fc0-4870-85b9-167ba70cae40.jpg',
       1801, id, 1, 1, NOW(), 0, 0, false
FROM users WHERE name = 'abi85'
ON CONFLICT (id) DO UPDATE
    SET pfad=EXCLUDED.pfad, story_id=1801, story_column=1, story_position=1, deleted=false;

INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 213, 'Ne Menge Unfug haben wir auch gemacht', '/20250818_135813_b7957ba8-9fdc-4054-928d-bcf086d7377c.jpg',
       1801, id, 1, 2, NOW(), 0, 0, false
FROM users WHERE name = 'abi85'
ON CONFLICT (id) DO UPDATE
    SET pfad=EXCLUDED.pfad, story_id=1801, story_column=1, story_position=2, deleted=false;

-- Bilder — Col 2
INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 214, '7k oder 8k', '/20250818_140105_a082e36a-4885-48bf-8945-d63fbe15b4ca.jpg',
       1801, id, 2, 0, NOW(), 0, 0, false
FROM users WHERE name = 'abi85'
ON CONFLICT (id) DO UPDATE
    SET pfad=EXCLUDED.pfad, story_id=1801, story_column=2, story_position=0, deleted=false;

-- Texte — Col 0
INSERT INTO texte (id, title, description, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 110, 'Die 7 K - 46 Jahre nach ihrer Gründung - gefeiert wird dann wieder 2029',
       'Es war im Sommer 1979, als sich sieben Schüler der Klasse 7k der Gesamtschule zusammenfanden und beschlossen, ihre Freundschaft über die Schulzeit hinaus zu pflegen. Was damals niemand ahnte: Diese Gruppe würde über Jahrzehnte zusammenbleiben, durch Höhen und Tiefen, durch Umzüge und Berufswechsel, durch Hochzeiten und Geburten. 46 Jahre später treffen sie sich noch immer, mittlerweile mit Kindern und sogar Enkeln im Schlepptau. Die nächste große Feier ist bereits geplant: 2029, wenn die 7k auf 50 Jahre zurückblicken kann, soll es ein Fest geben, das alle bisherigen in den Schatten stellt. Damals waren sie zwischen 12 und 13 Jahre alt, voller Energie und Ideen, ohne eine Ahnung davon, was das Leben für sie bereithalten würde. Einer wurde Arzt, eine andere Lehrerin, wieder ein anderer zog ins Ausland und kehrte erst nach zwanzig Jahren zurück. Und doch: Wenn sie sich treffen, fällt all das weg. Sie sind wieder die 7k, die Clique vom Schulhof, die zusammen Hausaufgaben schwänzte und gemeinsam die ersten Partys feierte. Freundschaften, die in der Jugend geschlossen werden, haben eine eigene Qualität — sie sind geprägt von einer Zeit, in der alles noch möglich schien, in der die Welt noch kein Hindernis kannte. Die 7k hat bewiesen, dass solche Bande ein Leben lang halten können, wenn man sie nur pflegt.',
       1801, id, 0, 1, NOW(), 0, 0, false
FROM users WHERE name = 'abi85'
ON CONFLICT (id) DO UPDATE
    SET story_id=1801, story_column=0, story_position=1, deleted=false;

-- Texte — Col 2
INSERT INTO texte (id, title, description, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 310, 'Namen von LehrerInnen und von SchülerInnen steigen auf wie Seifenblasen',
       'Wer erinnert sich noch an Frau Hoffmann, die Mathematiklehrerin mit der unfehlbaren Gabe, selbst die unmotiviertesten Schüler für Gleichungen zu begeistern? Oder an Herrn Brandt, der im Sportunterricht stets die unmöglichsten Übungen vorführte und dabei nie ins Schwitzen kam? Die Namen kommen und gehen, steigen auf wie Seifenblasen und platzen irgendwann in der Erinnerung. Aber manche bleiben haften: die Mitschülerin, die immer die besten Spickzettel schrieb; der Klassensprecher, der bei jeder Gelegenheit das Wort ergriff; der stille Junge am Fenster, der heute Bestsellerautor ist. Das Abitur 1985 war mehr als ein Abschluss — es war der Beginn des echten Lebens. Und doch, so viele Namen verblassen mit den Jahren. Man versucht, sich an Gesichter zu erinnern, an Stimmen, an kleine Gesten — und findet nur noch Fragmente. War es nicht Herr Müller, der immer die Kreide in die Luft warf und wieder auffing? Oder war das Herr Schäfer? Die Lehrerin, die in der Pause heimlich rauchte und es für ein gut gehütetes Geheimnis hielt — dabei wusste es die ganze Schule. Die Mitschüler aus der Parallelklasse, deren Namen man nie wirklich kannte, aber deren Gesichter man auf alten Fotos sofort wiedererkennt. Schulzeit ist eine eigene Welt, eine Blase aus Pflichterfüllung und Rebellion, aus ersten Gefühlen und großen Träumen. Wer diese Zeit mit anderen geteilt hat, trägt ein gemeinsames Gedächtnis in sich — auch wenn die einzelnen Erinnerungen längst auseinanderdriften.',
       1801, id, 2, 1, NOW(), 0, 0, false
FROM users WHERE name = 'abi85'
ON CONFLICT (id) DO UPDATE
    SET story_id=1801, story_column=2, story_position=1, deleted=false;

-- Sequenzen auf sicheren Wert setzen
SELECT setval('bilder_seq',  GREATEST((SELECT MAX(id) FROM bilder)  + 1, 5000), false);
SELECT setval('texte_seq',   GREATEST((SELECT MAX(id) FROM texte)   + 1, 1000), false);
SELECT setval('stories_seq', GREATEST((SELECT MAX(id) FROM stories) + 1, 2000), false);
SELECT setval('users_seq',   GREATEST((SELECT MAX(id) FROM users)   + 1, 200),  false);
