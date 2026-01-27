import sys
import xml.etree.ElementTree as ET

def optimize_musicxml(input_file, output_file):
    ET.register_namespace('', "http://www.musicxml.org/xsd/MusicXML")
    tree = ET.parse(input_file)
    root = tree.getroot()

    # Helpers
    def create_text_direction(text, placement="above", font_style=None, relative_y=None):
        d = ET.Element('direction', placement=placement)
        dt = ET.SubElement(d, 'direction-type')
        words = ET.SubElement(dt, 'words')
        words.text = text
        if font_style:
            for k, v in font_style.items():
                words.set(k, v)
        if relative_y:
            words.set('relative-y', str(relative_y))
        return d

    def create_dynamic_text_direction(text_before, dynamic_tag, text_after, placement="below"):
        d = ET.Element('direction', placement=placement)
        dt = ET.SubElement(d, 'direction-type')
        
        if text_before:
            w1 = ET.SubElement(dt, 'words')
            w1.text = text_before
            w1.set('font-style', 'italic') 

        dyn = ET.SubElement(dt, 'dynamics')
        ET.SubElement(dyn, dynamic_tag)

        if text_after:
            w2 = ET.SubElement(dt, 'words')
            w2.text = text_after
            w2.set('font-style', 'italic')
            
        return d

    # 1. Add Part Group (Brace) & Barline Connection
    part_list = root.find('part-list')
    if part_list is not None:
        if part_list.find('part-group') is None:
            pg_start = ET.Element('part-group', type="start", number="1")
            group_symbol = ET.SubElement(pg_start, 'group-symbol')
            group_symbol.text = 'brace'
            group_barline = ET.SubElement(pg_start, 'group-barline')
            group_barline.text = 'yes'
            pg_stop = ET.Element('part-group', type="stop", number="1")
            part_list.insert(0, pg_start)
            part_list.append(pg_stop)
            
        # Clear Part Names
        for score_part in part_list.findall('score-part'):
            if score_part.find('part-name') is not None: score_part.find('part-name').text = ""
            if score_part.find('part-abbreviation') is not None: score_part.find('part-abbreviation').text = ""

    score_part_ids = [sp.get('id') for sp in part_list.findall('score-part')]
    first_part_id = score_part_ids[0] if score_part_ids else None
    second_part_id = score_part_ids[1] if len(score_part_ids) > 1 else None

    tuplet_count = 0

    for part in root.findall('part'):
        part_id = part.get('id')
        
        # Truncate after Measure 4
        measures_to_remove = [m for m in part.findall('measure') if int(m.get('number', 0)) > 4]
        for m in measures_to_remove: part.remove(m)

        measure1 = part.find("./measure[@number='1']")
        
        if measure1 is not None:
            # Cut Time
            time = measure1.find(".//time")
            if time is not None: time.set('symbol', 'cut')

            # Remove Metronome
            for d in list(measure1.findall('direction')):
                dt = d.find('direction-type')
                if dt is not None and dt.find('metronome') is not None:
                    measure1.remove(d)

            # Remove Dynamics from Right Hand Measure 1
            if part_id == first_part_id:
                for d in list(measure1.findall('direction')):
                    dt = d.find('direction-type')
                    if dt is not None and dt.find('dynamics') is not None:
                        measure1.remove(d)

            # Special additions for Top Staff (First Part)
            if part_id == first_part_id:
                # Directions
                
                # "sempre pp e senza sordino" (Below)
                dir_sempre = create_dynamic_text_direction("sempre ", "pp", " e senza sordino", placement="below")

                # "Si deve suonare..." (Above, Closer to staff) relative-y=15
                text_sideve = "Si deve suonare tutto questo pezzo delicatissimamente e senza sordino"
                dir_sideve = create_text_direction(text_sideve, placement="above", font_style={'font-size': '10', 'font-style': 'normal'}, relative_y=15) 

                # "Adagio sostenuto" (Above, Further from staff) relative-y=35, NORMAL font style
                # Added font-style='normal' to ensure it's not italic
                dir_adagio = create_text_direction("Adagio sostenuto", placement="above", font_style={'font-weight': 'bold', 'font-size': '12', 'font-style': 'normal'}, relative_y=35)

                # INSERTION ORDER (LIFO for insert(0))
                # We want XML order:
                # 1. Si deve (Closest)
                # 2. Adagio (Top)
                
                # So we must insert Adagio FIRST, then Si deve.
                
                measure1.insert(0, dir_sempre) # Insert this first or last? Doesn't matter much relative to 'above' ones, but let's do it first to be safe at bottom of list? 
                # Actually if we keep using insert(0), the last one called becomes the very first element in XML.
                
                # Let's be explicit and rigorous.
                # Logic:
                # XML Index 0: Si deve (Closest to staff)
                # XML Index 1: Adagio (Above Si deve)
                # ...
                
                # Step 1: Insert Adagio (It becomes Index 0)
                measure1.insert(0, dir_adagio)
                
                # Step 2: Insert Si deve (It becomes Index 0, Adagio becomes Index 1)
                measure1.insert(0, dir_sideve)
                
                # Step 3: Insert Sempre (It becomes Index 0, Si deve becomes 1, Adagio becomes 2)
                # Wait, Sempre is placement="below".
                # Usually XML order doesn't confuse Above vs Below stacking, but keeping them clustered is fine.
                measure1.insert(0, dir_sempre)

        # Process all measures 1-4
        for measure in part.findall('measure'):
            # Remove Dynamics from Left Hand
            if part_id == second_part_id:
                for d in list(measure.findall('direction')):
                    dt = d.find('direction-type')
                    if dt is not None and dt.find('dynamics') is not None:
                        measure.remove(d)

            # Tuplet Logic
            notations_list = measure.findall(".//notations")
            for note_notations in notations_list:
                tuplets = note_notations.findall("tuplet")
                for tuplet in tuplets:
                    if tuplet.get('type') == 'start':
                        tuplet.set('bracket', 'no')
                        if tuplet_count == 0:
                            tuplet.set('show-number', 'visible')
                        else:
                            tuplet.set('show-number', 'none')
                        tuplet_count += 1
            
            # Clean default positions
            for direction in measure.findall('direction'):
                 if 'default-x' in direction.attrib: del direction.attrib['default-x']
                 if 'default-y' in direction.attrib: del direction.attrib['default-y']
                 dt = direction.find('direction-type')
                 if dt and dt.find('dynamics'):
                     dyn = dt.find('dynamics')
                     if 'default-x' in dyn.attrib: del dyn.attrib['default-x']
                     if 'default-y' in dyn.attrib: del dyn.attrib['default-y']

    tree.write(output_file, encoding="UTF-8", xml_declaration=True)
    print(f"Optimized MusicXML saved to {output_file}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python optimize_musicxml.py <input_file> <output_file>")
        sys.exit(1)
    
    optimize_musicxml(sys.argv[1], sys.argv[2])
