# Showcase Images

A 3D cylindrical image gallery built with Next.js, Three.js, and React Three Fiber.
Images are displayed on a scroll-driven spiral cylinder with custom GLSL shaders, dithering effects, and post-processing.

![Next.js](https://img.shields.io/badge/Next.js-13.5-black?style=flat-square&logo=next.js)
![Three.js](https://img.shields.io/badge/Three.js-0.169-black?style=flat-square&logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

---

https://github.com/user-attachments/assets/789b7dad-dc6a-4b27-aa8b-fd7bede6dc26

## Features

- **Cylindrical Spiral Gallery** — Images arranged in a helix around a 3D cylinder, driven by scroll input
- **Custom GLSL Shaders** — Per-instance rendering with dithering, chromatic aberration, scan lines, flicker, and distance fade
- **Scroll Physics** — Momentum-based scrolling with configurable friction, velocity, and rotation smoothing
- **Post-Processing** — Bloom with adjustable intensity, threshold, smoothing, and radius
- **Wireframe Shape** — Decorative 3D wireframe shape (Torus, TorusKnot, Cube) centered in the gallery, reacting to scroll
- **Visual Presets** — Switchable presets (Default, Green SCIFI) that update bloom, border, and dither settings via Leva
- **Live Controls** — Full Leva GUI for tweaking all parameters in real time (gallery, motion, effects, border, corners, dither, torus, bloom)
- **Texture Atlas** — Images packed into a single atlas texture for efficient GPU rendering

---

## Tech Stack

- **Framework:** Next.js 13.5 (App Router)
- **3D/WebGL:** Three.js, React Three Fiber, React Three Drei
- **Post-Processing:** React Three Postprocessing
- **Animation:** GSAP
- **Controls:** Leva (GUI controls)
- **Styling:** Tailwind CSS, SCSS Modules

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/cortiz2894/showcase-images.git

# Navigate to the project
cd showcase-images

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the gallery.

---

## Project Structure

```
components/
  CylindricalGallery/    # Main gallery (instanced mesh, shaders, scroll, texture atlas)
  PostProcessing/         # Bloom and post-processing effects
  PresetSelector/         # Preset UI buttons and preset definitions
  WireframeTorus.tsx      # Decorative wireframe shape with scroll reaction
  CameraController.tsx    # Camera tilt driven by scroll velocity
  BackgroundGrid/         # Background grid effect
  Scene.tsx               # Root scene (Canvas, Leva, state management)
```

---

## Controls

The bottom-left UI provides:

- **Preset buttons** — Switch between Default and Green SCIFI visual presets
- **Shape** — Toggle the wireframe shape visibility
- **Config** — Toggle the Leva control panel

When the Leva panel is visible, all parameters (gallery layout, motion, effects, border, dither, torus, bloom) can be adjusted in real time.

---

## Author

**Christian Ortiz** - Creative Developer

## Connect

- **Portfolio:** [cortiz.dev](https://cortiz.dev)
- **YouTube:** [@cortizdev](https://youtube.com/@cortizdev)
- **X (Twitter):** [@cortiz2894](https://twitter.com/cortiz2894)
- **LinkedIn:** [Christian Daniel Ortiz](https://linkedin.com/in/christian-daniel-ortiz)

## Contact

For inquiries, collaborations or questions: **cortiz2894@gmail.com**
