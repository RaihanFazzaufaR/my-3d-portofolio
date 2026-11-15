# Cosmic 3D Portfolio // Interactive Keplerian Space Simulation

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r183-black?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-v9-black?style=flat-square&logo=three.js&logoColor=white)](https://docs.pmnd.rs/react-three-fiber/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-v8.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

An interactive, scientific 3D WebGL solar system portfolio designed and engineered by **Raihan Fazzaufa Rasendriya**. The application transforms technical portfolio sections into an interactive Keplerian planetary system featuring real-time orbital physics, multi-moon subsystems, deep-space distant galaxies, and a sci-fi cockpit telemetry interface.

---

## Celestial System Mapping

The portfolio is architected across celestial sectors, where each celestial body represents a core pillar of technical expertise:

| Celestial Body | Name | Sector | Focus & Description |
| :--- | :--- | :--- | :--- |
| **Star (Center)** | **Creator Core** | `SYSTEM CORE // CREATOR` | Executive bio, core engineering philosophies, academic degree, and career stats. |
| **Planet 1** | **Tech Stack** | `SEC-01 // FRONT-LINE` | Languages, web & backend frameworks, databases, and verified certifications. |
| **Planet 2** | **Journey** | `SEC-02 // TRAJECTORY` | Timeline milestones: PT Sthira Teknik Indonesia, SIRAWA, Booking Room Polinema, and Polinema. |
| **Planet 3** | **Lab & R&D** | `SEC-03 // SKUNKWORKS` | Flagship prototypes: Story-Based Algorithmic Thinking Thesis Platform, MoodSync AI Player, and enterprise CMS. |
| **Planet 4** | **Comms** | `SEC-04 // RELAY` | Direct transmission channels: Email (one-click clipboard copy), LinkedIn, GitHub, and WhatsApp. |

---

## Key Features

### 1. Real-Time Keplerian Celestial Physics
- **Dual Dynamic Orbits**: Each planet calculates real-time trigonometric orbital paths with independent orbital radii and angular velocities.
- **Multi-Moon Orbiters**: Distinct moons with inclined orbital planes orbiting outside planet radii and ring bounds without geometric collisions.
- **Luminous Sun Core**: Central star with procedural solar surface turbulence, corona glow, and point-light radiance.
- **Dynamic Asteroid Belt**: Deterministically generated belt particles distributed between inner and outer planetary sectors.

### 2. Deep Space Universe & Distant Galaxies
- **4 Distinct Deep-Space Galaxies**: Precomputed distant galaxies orbiting far outside the solar system (~250 AU):
  - **Andromeda Spiral** (`[-170, 80, -180]`): Luminous golden nucleus with violet/cyan arms.
  - **Whirlpool Spiral / M51** (`[185, 90, -170]`): Ultra-bright azure core with electric cyan and emerald starburst arms.
  - **Sombrero Barred Galaxy / NGC 4594** (`[-190, -75, 160]`): Solar amber core with a ruby dust ring.
  - **Triangulum Pinwheel / M33** (`[175, -85, 185]`): Lavender core transitioning to deep violet and sky-blue clusters.
- **Cosmic Milky Way Dust**: Single draw-call spiral arms with 1,400 multi-spectral particles.
- **Twinkling Starfield**: 2,400 depth-attenuated stars providing cosmic parallax.

### 3. Camera Telemetry & Navigation Modes
- **Dual Camera Systems**:
  - **3D Deep Space View**: Full 6-DOF orbital exploration with smooth damping.
  - **2D Top-Down Radar Mode**: Tactical mini-map perspective that **preserves the camera's azimuth rotation angle**, ensuring planets never spin unexpectedly during mode switches.
- **Seamless Glide Camera Controller**: Smooth lerp transitions when tracking moving planets, framing targets with anti-clipping margins.
- **Intuitive Click-Outside Deselect**: Click on empty space to return to free-roam orbit mode, while camera drags (`> 6px`) are protected for uninterrupted inspection.
- **Direct Target Switching**: Click another planet or the Sun while locked to fly straight to the new target.

### 4. Cockpit HUD & Sci-Fi Interface
- **Fixed/Sticky Drawer Footers**: `← Prev Planet`, `Orbit Free Roam [Esc]`, and `Next Planet →` are permanently pinned at the bottom of the drawer.
- **Custom-Made Option Selector**: Custom sci-fi dropdown for filtering technical instruments by category, complete with item counts and active highlights.
- **Synthesized Web Audio Engine**: Procedurally synthesized sound effects via Web Audio API (hover, select, target lock, close) without external audio files.
- **Real-Time Telemetry Card**: Live HUD tracking target coordinates, orbital velocity in AU/s, and sensor lock status.
- **Cinematic Mode (`[C]`)**: Completely hides all UI overlays for a clean, full-screen space simulation.

---

## Keyboard Controls & Shortcuts

| Key | Action | Description |
| :---: | :--- | :--- |
| **`Esc`** | Free Roam / Close | Deselects active celestial body, closes detail drawer, and resets to orbit free roam. |
| **`C`** | Cinema Mode | Toggles Cinematic Mode (hides all UI overlays). |
| **`I`** | Mission Briefing | Opens / closes the mission briefing terminal modal. |
| **`Mouse Drag`** | Orbit / Rotate | Rotates the camera around the solar system or selected planet. |
| **`Scroll Wheel`** | Zoom In / Out | Smoothly zooms camera distance with safety boundaries. |
| **`Mouse Click`** | Select / Inspect | Locks onto any planet, the Sun, or clicks empty space to exit. |

---

## Technology Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **3D Graphics Engine**: [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/)
- **3D Utilities**: [@react-three/drei](https://github.com/pmndrs/drei)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Typography**: Orbitron (Sci-Fi Display), JetBrains Mono (Telemetry/Metrics), Inter (Content Body)
- **Audio**: Web Audio API (zero-latency procedural synthesis)

---

## Performance Optimizations

- **Locked 60 FPS Target**: Designed for high performance parity between standard and cinematic modes.
- **Zero Runtime GC Allocations**: All camera vectors, matrix transforms, and coordinate math reuse static `THREE.Vector3` instances (`_worldPos`, `_camTarget`, `_deltaMove`).
- **Single Draw-Call Particle Clusters**: Distant galaxies, asteroid belts, and galaxy arms utilize precomputed `Float32Array` buffer attributes.
- **Hardware-Accelerated CSS HUD**: DOM overlays utilize `.hud-layer` CSS containment (`contain: layout style; transform: translateZ(0)`) to decouple UI repaints from the WebGL canvas.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RaihanFazzaufaR/my-3d-portofolio.git
   cd my-3d-portofolio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

### Production Build

To produce an optimized production bundle:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

To run lint checks:
```bash
npm run lint
```

---

## Project Structure

```text
my-3d-portofolio/
├── public/                     # Static icons and assets
│   ├── favicon.svg
│   └── planets/                # Procedural and pre-baked textures
├── src/
│   ├── components/
│   │   └── SolarSystem.tsx     # Three.js / R3F Canvas, celestial bodies, camera controller
│   ├── data/
│   │   └── portfolioData.tsx   # Verified career milestones, skills, and project data
│   ├── utils/
│   │   ├── audio.ts            # Web Audio API procedural sound synthesizer
│   │   └── planetTextures.ts   # Dynamic high-resolution canvas texture generators
│   ├── App.tsx                 # HUD Cockpit overlays, drawers, telemetry sensors
│   ├── index.css               # Tailwind CSS v4 setup and GPU containment rules
│   └── main.tsx                # Application bootstrap
├── index.html                  # HTML entry point with Google Fonts
├── vite.config.ts              # Vite bundling configuration
└── package.json
```

---

## Author & Contact

**Raihan Fazzaufa Rasendriya**  
*Informatics Engineering Scholar & Full-Stack Developer*  
Politeknik Negeri Malang (POLINEMA)

- **Email**: [fazzaufa94raihan@gmail.com](mailto:fazzaufa94raihan@gmail.com)
- **LinkedIn**: [linkedin.com/in/raihan-fazzaufa-rasendriya-4740a1251](https://www.linkedin.com/in/raihan-fazzaufa-rasendriya-4740a1251)
- **GitHub**: [github.com/RaihanFazzaufaR](https://github.com/RaihanFazzaufaR)
- **Location**: Batu City, East Java, Indonesia
