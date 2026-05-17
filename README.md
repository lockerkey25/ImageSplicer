# Cool Image Effects :)

A browser-based image effects tool for people who want Photoshop results without opening Photoshop.

The idea is simple: common filters and creative effects, right in the browser, with sliders for everything. No installs, no layers panel, no export dialogs.

---

## Modes

### Collage
Upload two images and interleave them into vertical strips — the classic lenticular / slit-scan effect (under **Lenticular Image Effect**). The strip width slider controls how fine or coarse the alternation is. Works great for portraits, landscapes, or anything with strong contrast between the two images.

### Effects
Upload one image and apply any combination of the effects below. Each effect is independently toggled and collapsible.

---

## Effects

**Glass Slices** — Divides the image into vertical panels that each refract the image behind them, simulating the look of thick glass or a prism. Control slice width, refraction offset, per-slice blur, edge highlight intensity, and opacity.

**Chromatic Aberration** — Splits the R, G, and B channels and offsets them independently, producing the color fringing you get from cheap lenses or analog video. Adjustable shift amount, angle, and green channel offset.

**Path Blur** — Draw a freehand path on the canvas. Pixels near the path get motion-blurred along the path's tangent direction — the same way Photoshop's Blur Gallery › Path Blur works. Blur length and falloff radius are adjustable. Ctrl/Cmd+Z undoes the last stroke.

**Noise & Grain** — Four types:
- *Film* — gaussian-distributed grain, like analog film
- *RGB* — independent per-channel noise for a digital glitch feel
- *Scanline* — horizontal CRT-style lines with adjustable spacing and width
- *Dust* — sparse bright/dark specks

Each type supports **Mono** (luminance noise) or **Color** (independent channel noise) modes.

**Gradient Map** — Maps image luminance to a color gradient, Photoshop-style. Dark pixels get the left-side color, bright pixels get the right-side color, and midtones interpolate across all stops in between. Six built-in presets (B&W, Sunset, Ocean, Neon, Duotone, Gold) plus full manual control: click any color stop swatch to change its color, add or remove stops, and dial in opacity and blend mode (Normal, Multiply, Screen, Overlay).

**Halftone** — Two types:
- *Dots* — classic circular halftone grid. Each cell's dot radius scales with local brightness. Rotate the grid with the Angle slider (the image stays upright, only the dot pattern rotates), flip the relationship with Invert, and set ink and paper colors independently.
- *Lines* — contour/wave lines. Horizontal lines are displaced vertically by local brightness, creating the fingerprint or topographic map look. Line spacing is controlled by Cell Size.

**ASCII** — Converts the image to ASCII art rendered on canvas. Choose cell size, color mode (mono or full color sampled from the image), background (black, white, or transparent), and charset (Standard `@#S%?*+;:,.`, Blocks `█▓▒░`, or Minimal `#+-.`).

---

## Download

The Download button exports the main canvas as a PNG. The path blur overlay is display-only and never included in the export.
