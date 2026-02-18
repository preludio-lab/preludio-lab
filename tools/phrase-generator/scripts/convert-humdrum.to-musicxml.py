import sys
from music21 import converter

if len(sys.argv) < 3:
    print("Usage: python convert_humdrum.py <input_file> <output_file>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

try:
    print(f"Converting {input_file} to {output_file}...")
    s = converter.parse(input_file)
    s.write('musicxml', fp=output_file)
    print("Conversion successful.")
except Exception as e:
    print(f"Error converting file: {e}")
    sys.exit(1)
