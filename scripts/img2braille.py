#!/usr/bin/env python3
"""Convert an image to braille-dot Unicode art (like ssh.moriliu.com style)."""

import sys
from PIL import Image, ImageEnhance

# Braille Unicode block: U+2800 to U+28FF
# Each braille character is a 2x4 dot matrix.
# Dot numbering:
#   0 3
#   1 4
#   2 5
#   6 7
BRAILLE_OFFSET = 0x2800
DOT_MAP = [
    (0, 0, 0x01), (1, 0, 0x08),
    (0, 1, 0x02), (1, 1, 0x10),
    (0, 2, 0x04), (1, 2, 0x20),
    (0, 3, 0x40), (1, 3, 0x80),
]


def image_to_braille(image_path, width=50, threshold=128, invert=False, contrast=1.5):
    img = Image.open(image_path).convert("L")

    # Enhance contrast
    img = ImageEnhance.Contrast(img).enhance(contrast)

    # Braille chars are 2 dots wide, 4 dots tall
    char_w = width
    char_h = int((img.height / img.width) * char_w * (2 / 4))

    pixel_w = char_w * 2
    pixel_h = char_h * 4

    img = img.resize((pixel_w, pixel_h), Image.LANCZOS)

    pixels = img.load()
    lines = []

    for cy in range(char_h):
        line = ""
        for cx in range(char_w):
            code = 0
            for dx, dy, bit in DOT_MAP:
                px = cx * 2 + dx
                py = cy * 4 + dy
                if px < pixel_w and py < pixel_h:
                    val = pixels[px, py]
                    if invert:
                        bright = val > threshold
                    else:
                        bright = val < threshold
                    if bright:
                        code |= bit
            line += chr(BRAILLE_OFFSET + code)
        lines.append(line)

    return "\n".join(lines)


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "image.jpg"
    width = int(sys.argv[2]) if len(sys.argv) > 2 else 45
    threshold = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    contrast = float(sys.argv[4]) if len(sys.argv) > 4 else 1.8

    result = image_to_braille(path, width=width, threshold=threshold, contrast=contrast)
    print(result)
