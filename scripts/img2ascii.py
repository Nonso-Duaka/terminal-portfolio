#!/usr/bin/env python3
"""Convert an image to ASCII art using standard single-width characters."""

import sys
from PIL import Image, ImageEnhance

# Characters from dark to light
ASCII_CHARS = " .:-=+*#%@"


def image_to_ascii(image_path, width=60, contrast=1.5):
    img = Image.open(image_path).convert("L")
    img = ImageEnhance.Contrast(img).enhance(contrast)

    # ASCII chars are roughly 2:1 height:width ratio
    char_h = int((img.height / img.width) * width * 0.45)

    img = img.resize((width, char_h), Image.LANCZOS)
    pixels = img.load()

    lines = []
    for y in range(char_h):
        line = ""
        for x in range(width):
            val = pixels[x, y]
            # Map pixel value (0-255) to character index
            idx = int(val / 256 * len(ASCII_CHARS))
            idx = min(idx, len(ASCII_CHARS) - 1)
            line += ASCII_CHARS[idx]
        lines.append(line)

    return "\n".join(lines)


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "image.jpg"
    width = int(sys.argv[2]) if len(sys.argv) > 2 else 50
    contrast = float(sys.argv[3]) if len(sys.argv) > 3 else 1.8

    print(image_to_ascii(path, width=width, contrast=contrast))
