-- =============================================================================
-- Playwright Test-Seed
-- Idempotent: kann mehrfach ausgeführt werden.
-- Aktualisiert Passwort für User "e2etestuser" (ID egal, muss existieren)
-- und legt Story 1801 + feste Bild-/Text-IDs an.
-- =============================================================================

-- Duplikate von 'DnD-Testalbum' bereinigen (entstehen durch restoreByName in "Mit Inhalt"-Tests).
-- Bilder/Texte zuerst auf NULL setzen, damit die FK-Constraint nicht verhindert.
UPDATE bilder SET story_id = NULL
    WHERE story_id IN (SELECT id FROM stories WHERE name = 'DnD-Testalbum' AND id != 1801);
UPDATE texte SET story_id = NULL
    WHERE story_id IN (SELECT id FROM stories WHERE name = 'DnD-Testalbum' AND id != 1801);
DELETE FROM stories WHERE name = 'DnD-Testalbum' AND id != 1801;

-- Test-User e2etestuser: Passwort auf Testwert setzen (egal welche ID er hat).
-- id-Spalte hat kein DEFAULT → INSERT ohne ID schlägt fehl.
-- Strategie: erst UPDATE (wenn vorhanden), dann INSERT mit MAX(id)+100 (wenn nicht vorhanden).
-- email_verified=TRUE und active=TRUE damit Login nach V12/V13-Migrationen funktioniert.
UPDATE users
    SET password      = '$2b$10$R0qDk4bSm1zEZt47IEFKrOf.51rb2phLHA5O71oYejvcEQoAtm7q2',
        email_verified = TRUE,
        active         = TRUE
    WHERE name = 'e2etestuser';

INSERT INTO users (id, name, email, password, created, version, email_verified, active)
SELECT (SELECT COALESCE(MAX(id), 0) + 100 FROM users),
       'e2etestuser', 'e2etestuser@test.local',
       '$2b$10$R0qDk4bSm1zEZt47IEFKrOf.51rb2phLHA5O71oYejvcEQoAtm7q2',
       NOW(), 0, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE name = 'e2etestuser');

INSERT INTO user_roles (id, role)
SELECT id, 'user' FROM users WHERE name = 'e2etestuser'
ON CONFLICT DO NOTHING;

-- Story 1801 (3-Spalten-Layout), owned by e2etestuser
INSERT INTO stories (id, name, description, user_id, created, version, layout)
SELECT 1801, 'DnD-Testalbum', 'Playwright-Testdaten', id, NOW(), 0, 'grid'
FROM users WHERE name = 'e2etestuser'
ON CONFLICT (id) DO UPDATE
    SET layout = 'grid';

-- Bilder — Col 0
INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 211, 'Einer war schon immer gern Polizist !', '/e2e-test-bild-1.jpg',
       1801, id, 0, 0, NOW(), 0, 0, false
FROM users WHERE name = 'e2etestuser'
ON CONFLICT (id) DO UPDATE
    SET pfad=EXCLUDED.pfad, story_id=1801, story_column=0, story_position=0, deleted=false;

-- Bilder — Col 1
INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 4027, '7k zusammen auf 40 Jahre Party', '/e2e-test-bild-2.jpg',
       1801, id, 1, 0, NOW(), 0, 0, false
FROM users WHERE name = 'e2etestuser'
ON CONFLICT (id) DO UPDATE
    SET pfad=EXCLUDED.pfad, story_id=1801, story_column=1, story_position=0, deleted=false;

INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 3160, '7k oder 8k - Herr Gottschalk mit Austausch-Schülerinnen', '/e2e-test-bild-3.jpg',
       1801, id, 1, 1, NOW(), 0, 0, false
FROM users WHERE name = 'e2etestuser'
ON CONFLICT (id) DO UPDATE
    SET pfad=EXCLUDED.pfad, story_id=1801, story_column=1, story_position=1, deleted=false;

INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 213, 'Ne Menge Unfug haben wir auch gemacht', '/e2e-test-bild-4.jpg',
       1801, id, 1, 2, NOW(), 0, 0, false
FROM users WHERE name = 'e2etestuser'
ON CONFLICT (id) DO UPDATE
    SET pfad=EXCLUDED.pfad, story_id=1801, story_column=1, story_position=2, deleted=false;

-- Bilder — Col 2
INSERT INTO bilder (id, title, pfad, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 214, '7k oder 8k', '/e2e-test-bild-5.jpg',
       1801, id, 2, 0, NOW(), 0, 0, false
FROM users WHERE name = 'e2etestuser'
ON CONFLICT (id) DO UPDATE
    SET pfad=EXCLUDED.pfad, story_id=1801, story_column=2, story_position=0, deleted=false;

-- Texte — Col 0
INSERT INTO texte (id, title, description, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 110, 'Die 7 K - 46 Jahre nach ihrer Gründung - gefeiert wird dann wieder 2029',
       'Es war im Sommer 1979, als sich sieben Schüler der Klasse 7k der Gesamtschule zusammenfanden und beschlossen, ihre Freundschaft über die Schulzeit hinaus zu pflegen. Was damals niemand ahnte: Diese Gruppe würde über Jahrzehnte zusammenbleiben, durch Höhen und Tiefen, durch Umzüge und Berufswechsel, durch Hochzeiten und Geburten. 46 Jahre später treffen sie sich noch immer, mittlerweile mit Kindern und sogar Enkeln im Schlepptau. Die nächste große Feier ist bereits geplant: 2029, wenn die 7k auf 50 Jahre zurückblicken kann, soll es ein Fest geben, das alle bisherigen in den Schatten stellt. Damals waren sie zwischen 12 und 13 Jahre alt, voller Energie und Ideen, ohne eine Ahnung davon, was das Leben für sie bereithalten würde. Einer wurde Arzt, eine andere Lehrerin, wieder ein anderer zog ins Ausland und kehrte erst nach zwanzig Jahren zurück. Und doch: Wenn sie sich treffen, fällt all das weg. Sie sind wieder die 7k, die Clique vom Schulhof, die zusammen Hausaufgaben schwänzte und gemeinsam die ersten Partys feierte. Freundschaften, die in der Jugend geschlossen werden, haben eine eigene Qualität — sie sind geprägt von einer Zeit, in der alles noch möglich schien, in der die Welt noch kein Hindernis kannte. Die 7k hat bewiesen, dass solche Bande ein Leben lang halten können, wenn man sie nur pflegt.',
       1801, id, 0, 1, NOW(), 0, 0, false
FROM users WHERE name = 'e2etestuser'
ON CONFLICT (id) DO UPDATE
    SET story_id=1801, story_column=0, story_position=1, deleted=false;

-- Texte — Col 2
INSERT INTO texte (id, title, description, story_id, user_id, story_column, story_position, created, version, priority, deleted)
SELECT 310, 'Namen von LehrerInnen und von SchülerInnen steigen auf wie Seifenblasen',
       'Wer erinnert sich noch an Frau Hoffmann, die Mathematiklehrerin mit der unfehlbaren Gabe, selbst die unmotiviertesten Schüler für Gleichungen zu begeistern? Oder an Herrn Brandt, der im Sportunterricht stets die unmöglichsten Übungen vorführte und dabei nie ins Schwitzen kam? Die Namen kommen und gehen, steigen auf wie Seifenblasen und platzen irgendwann in der Erinnerung. Aber manche bleiben haften: die Mitschülerin, die immer die besten Spickzettel schrieb; der Klassensprecher, der bei jeder Gelegenheit das Wort ergriff; der stille Junge am Fenster, der heute Bestsellerautor ist. Das Abitur 1985 war mehr als ein Abschluss — es war der Beginn des echten Lebens. Und doch, so viele Namen verblassen mit den Jahren. Man versucht, sich an Gesichter zu erinnern, an Stimmen, an kleine Gesten — und findet nur noch Fragmente. War es nicht Herr Müller, der immer die Kreide in die Luft warf und wieder auffing? Oder war das Herr Schäfer? Die Lehrerin, die in der Pause heimlich rauchte und es für ein gut gehütetes Geheimnis hielt — dabei wusste es die ganze Schule. Die Mitschüler aus der Parallelklasse, deren Namen man nie wirklich kannte, aber deren Gesichter man auf alten Fotos sofort wiedererkennt. Schulzeit ist eine eigene Welt, eine Blase aus Pflichterfüllung und Rebellion, aus ersten Gefühlen und großen Träumen. Wer diese Zeit mit anderen geteilt hat, trägt ein gemeinsames Gedächtnis in sich — auch wenn die einzelnen Erinnerungen längst auseinanderdriften.',
       1801, id, 2, 1, NOW(), 0, 0, false
FROM users WHERE name = 'e2etestuser'
ON CONFLICT (id) DO UPDATE
    SET story_id=1801, story_column=2, story_position=1, deleted=false;

-- Sequenzen auf sicheren Wert setzen
SELECT setval('bilder_seq',  GREATEST((SELECT MAX(id) FROM bilder)  + 1, 5000), false);
SELECT setval('texte_seq',   GREATEST((SELECT MAX(id) FROM texte)   + 1, 1000), false);
SELECT setval('stories_seq', GREATEST((SELECT MAX(id) FROM stories) + 1, 2000), false);
SELECT setval('users_seq',   GREATEST((SELECT MAX(id) FROM users)   + 1, 200),  false);

-- =============================================================================
-- Group-Admin Invitation Flow Test Data
-- =============================================================================

-- Gruppe "Hochzeitszeitung" (id=1) sicherstellen
INSERT INTO gruppen (id, name)
VALUES (1, 'Hochzeitszeitung')
ON CONFLICT (id) DO NOTHING;

-- User "admin" sicherstellen (Passwort: Admin1234!)
INSERT INTO users (id, name, email, password, created, version, email_verified, active)
VALUES (0, 'admin', 'admin@jamsintown.de',
        '$2a$10$geBz3tkQfSME.ZCPpbPZ4.45.JSNOdcpwbah6lsaZUz4oGf3Ca19K',
        NOW(), 0, TRUE, TRUE)
ON CONFLICT (name) DO UPDATE
    SET password = '$2a$10$geBz3tkQfSME.ZCPpbPZ4.45.JSNOdcpwbah6lsaZUz4oGf3Ca19K',
        email_verified = TRUE, active = TRUE;
INSERT INTO user_roles (id, role)
SELECT id, 'admin' FROM users WHERE name = 'admin' ON CONFLICT DO NOTHING;
INSERT INTO user_roles (id, role)
SELECT id, 'user' FROM users WHERE name = 'admin' ON CONFLICT DO NOTHING;

-- User "ddet" als group-admin für Hochzeitszeitung (Passwort: Ddet9999#)
-- active_group_id = 1 damit /invitations nicht nach /bilder weiterleitet
INSERT INTO users (id, name, email, password, created, version, email_verified, active,
                   managed_group_id, active_group_id)
VALUES (3, 'ddet', 'dboehm@arcor.de',
        '$2a$10$IPSNwwU5ehCTd4XBXARvkOqCXayHNfs5TFLUMs5xghl0GcuP5z2ou',
        NOW(), 0, TRUE, TRUE, 1, 1)
ON CONFLICT (name) DO UPDATE
    SET password         = '$2a$10$IPSNwwU5ehCTd4XBXARvkOqCXayHNfs5TFLUMs5xghl0GcuP5z2ou',
        email_verified   = TRUE,
        active           = TRUE,
        managed_group_id = 1,
        active_group_id  = 1;
INSERT INTO user_roles (id, role)
SELECT id, 'group-admin' FROM users WHERE name = 'ddet' ON CONFLICT DO NOTHING;
INSERT INTO user_roles (id, role)
SELECT id, 'user' FROM users WHERE name = 'ddet' ON CONFLICT DO NOTHING;
INSERT INTO user_groups (user_id, group_id)
SELECT id, 1 FROM users WHERE name = 'ddet' ON CONFLICT DO NOTHING;
INSERT INTO user_managed_groups (user_id, group_id)
SELECT id, 1 FROM users WHERE name = 'ddet' ON CONFLICT DO NOTHING;

-- Playwright-Einladungs-Testdaten aus Vorläufen bereinigen
DELETE FROM user_groups WHERE user_id IN (SELECT id FROM users WHERE name LIKE 'pwtest%');
DELETE FROM user_roles  WHERE id      IN (SELECT id FROM users WHERE name LIKE 'pwtest%');
UPDATE users SET managed_group_id = NULL WHERE name LIKE 'pwtest%';
DELETE FROM users WHERE name LIKE 'pwtest%';
DELETE FROM invitation_tokens
  WHERE created_by IN (SELECT id FROM users WHERE name IN ('ddet', 'admin'))
    AND label = 'Hochzeitszeitung';
