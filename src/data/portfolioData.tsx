export interface SkillCategory {
  title: string;
  skills: { name: string; icon?: string }[];
}

export interface TimelineItem {
  year: string;
  role: string;
  institution: string;
  description: string;
  badges: string[];
}

export interface ProjectItem {
  title: string;
  type: string;
  status: 'In Development' | 'Completed' | 'Research' | 'Prototype';
  description: string;
  tech: string[];
  features?: string[];
  link?: string;
}

export interface SocialLink {
  platform: string;
  handle: string;
  url: string;
  type: 'link' | 'copy';
}

export interface MoonData {
  name: string;
  size: number;
  distance: number;
  speed: number;
  color?: string;
  inclination?: number;
}

export interface PlanetData {
  id: string;
  name: string;
  subtitle: string;
  sector: string;
  color: string;
  size: number;
  distance: number;
  speed: number;
  hasRing?: boolean;
  hasMoon?: boolean;
  moons?: MoonData[];
  content?: string[];
  skillsData?: SkillCategory[];
  timelineData?: TimelineItem[];
  projectsData?: ProjectItem[];
  socialsData?: SocialLink[];
}

export interface SunData {
  name: string;
  title: string;
  callsign: string;
  bio: string;
  philosophies: string[];
  stats: { label: string; value: string }[];
}

export const SUN_DATA: SunData = {
  name: "Raihan Fazzaufa Rasendriya",
  title: "Informatics Engineering Scholar & Full-Stack Developer",
  callsign: "SYSTEM CORE // CREATOR",
  bio: "Informatics Engineering undergraduate at Politeknik Negeri Malang specializing in backend architecture, responsive frontend systems, and normalized relational database design. Currently developing an interactive Story-Based Algorithmic Thinking web platform for elementary education as a capstone thesis research project.",
  philosophies: [
    "Clean architecture, database normalization, and high data integrity over quick hacks",
    "Seamless integration between robust backend microservices and intuitive responsive frontends",
    "Continuous engineering excellence across full-stack systems, educational technology, and interactive media"
  ],
  stats: [
    { label: "Focus", value: "Full-Stack, Database, & AI" },
    { label: "Degree", value: "D4 Informatics Eng" },
    { label: "Institution", value: "Politeknik Negeri Malang" },
    { label: "Location", value: "Batu / Malang, Indonesia" }
  ]
};

export const PLANETS: PlanetData[] = [
  {
    id: 'skills',
    name: 'Tech Stack',
    subtitle: 'Core Systems & Instruments',
    sector: 'SEC-01 // FRONT-LINE',
    color: '#38bdf8', // Cyan
    size: 0.85,
    distance: 8.0,
    speed: 0.45,
    moons: [
      {
        name: 'Stack-I',
        size: 0.18,
        distance: 1.75,
        speed: 2.4,
        color: '#94a3b8',
        inclination: 0.12,
      },
    ],
    skillsData: [
      {
        title: 'Programming Languages',
        skills: [
          { name: 'PHP' },
          { name: 'Python' },
          { name: 'JavaScript' },
          { name: 'TypeScript' },
          { name: 'Java' },
          { name: 'Dart' }
        ]
      },
      {
        title: 'Web & Backend Architecture',
        skills: [
          { name: 'Laravel (PHP)' },
          { name: 'Inertia.js' },
          { name: 'React.js / Next.js' },
          { name: 'Phaser 3 (Game Engine)' },
          { name: 'FastAPI (Python)' },
          { name: 'Express.js' },
          { name: 'Tailwind CSS' },
          { name: 'RESTful APIs' }
        ]
      },
      {
        title: 'Databases & Mobile',
        skills: [
          { name: 'MySQL' },
          { name: 'PostgreSQL' },
          { name: 'MS SQL Server' },
          { name: 'SQLite' },
          { name: 'Flutter (Mobile)' },
          { name: 'Database Normalization' }
        ]
      },
      {
        title: 'Certifications & Credentials',
        skills: [
          { name: 'Basic JavaScript Programming (Dicoding)' },
          { name: 'Structured Query Language / SQL (Dicoding)' },
          { name: 'Data Science Fundamentals (DQLab)' }
        ]
      }
    ]
  },
  {
    id: 'experience',
    name: 'Journey',
    subtitle: 'Chronicles & Milestones',
    sector: 'SEC-02 // TRAJECTORY',
    color: '#fbbf24', // Amber
    size: 1.15,
    distance: 14.5,
    speed: 0.32,
    moons: [
      {
        name: 'Chronos-I',
        size: 0.22,
        distance: 2.1,
        speed: 1.8,
        color: '#fde68a',
        inclination: 0.1,
      },
      {
        name: 'Chronos-II',
        size: 0.16,
        distance: 3.1,
        speed: 1.25,
        color: '#cbd5e1',
        inclination: -0.22,
      },
    ],
    timelineData: [
      {
        year: '2025 — Present',
        role: 'Undergraduate Thesis Researcher & Developer',
        institution: 'Politeknik Negeri Malang (POLINEMA)',
        description: 'Developing "Media Pembelajaran Algorithmic Thinking Berbasis Web Untuk Siswa SD Menggunakan Ilustrasi dan Story-Based Learning". Engineering an interactive gamified web application combining React, Inertia, Laravel, and Phaser 3 to strengthen computational thinking (sequences, loops, conditionals) without syntax complexity.',
        badges: ['Undergraduate Thesis', 'React.js', 'Inertia.js', 'Phaser 3', 'Laravel', 'ADDIE Model']
      },
      {
        year: 'July 2025 — December 2025',
        role: 'Web Developer Intern',
        institution: 'PT STHIRA TEKNIK INDONESIA',
        description: 'Engineered a robust Content Management System (CMS), dynamic backend services, responsive frontend components, and normalized relational database schemas with zero data redundancy.',
        badges: ['Enterprise CMS', 'PHP / Laravel', 'Database Normalization', 'RESTful APIs']
      },
      {
        year: 'February 2024 — June 2024',
        role: '(Academic Project) Full-Stack Developer',
        institution: 'SIRAWA (Sistem Informasi Rukun Warga)',
        description: 'Architected and built an integrated neighborhood information platform for RW 03 Bumiayu, Malang. Developed administrative letter generation, Bansos social assistance distribution monitoring, and an interactive UMKM directory.',
        badges: ['Laravel', 'MySQL', 'Tailwind CSS', 'Full-Stack', 'GovTech']
      },
      {
        year: 'November 2023 — December 2023',
        role: '(Academic Project) Backend Developer',
        institution: 'Classroom Booking System (Booking Room Polinema)',
        description: 'Engineered native PHP Object-Oriented backend logic and normalized MySQL relational database schemas for high-traffic campus classroom and lab scheduling, preventing double-booking conflicts.',
        badges: ['PHP OOP', 'MySQL', 'Relational Schemas', 'Conflict Resolution']
      },
      {
        year: '2022 — Present',
        role: 'Informatics Engineering Scholar (D4)',
        institution: 'Politeknik Negeri Malang (POLINEMA)',
        description: 'Pursuing Bachelor of Applied Science with a cumulative GPA of 3.87 / 4.00. Specializing in advanced database design, software architecture, object-oriented systems, and web/mobile engineering.',
        badges: ['GPA: 3.87/4.00', 'Software Architecture', 'Data Structures', 'OOP']
      },
    ]
  },
  {
    id: 'building',
    name: 'Lab & R&D',
    subtitle: 'Active Experiments & Prototypes',
    sector: 'SEC-03 // SKUNKWORKS',
    color: '#34d399', // Emerald
    size: 1.35,
    distance: 28.5,
    speed: 0.22,
    hasRing: true,
    moons: [
      {
        name: 'Nova-Alpha',
        size: 0.25,
        distance: 4.1,
        speed: 1.5,
        color: '#a7f3d0',
        inclination: 0.14,
      },
      {
        name: 'Nova-Beta',
        size: 0.19,
        distance: 5.2,
        speed: 1.1,
        color: '#6ee7b7',
        inclination: -0.2,
      },
      {
        name: 'Nova-Gamma',
        size: 0.15,
        distance: 6.3,
        speed: 0.85,
        color: '#cbd5e1',
        inclination: 0.32,
      },
    ],
    projectsData: [
      {
        title: 'Story-Based Algorithmic Thinking Platform — Undergraduate Thesis',
        type: 'Undergraduate Thesis & Educational Game',
        status: 'In Development',
        description: 'Web-based computational thinking learning platform designed for elementary students, combining digital storytelling with interactive 2D game mechanics to master sequences, loops, and conditional logic without syntax friction.',
        tech: ['React.js', 'Inertia.js', 'Phaser 3', 'Laravel', 'Tailwind CSS', 'MySQL'],
        features: [
          'Interactive 2D game levels (Maze, Potion, and Conditionals) powered by Phaser 3',
          'Syntax-free visual block sequencing engine for concrete operational logic learning',
          'Automated student progress tracking, pre-test & post-test assessment, and teacher portal',
          'Lightweight cross-platform client optimized for school Chromebooks and lower-spec hardware'
        ]
      },
      {
        title: 'MoodSync — AI Facial Expression Music Player (Academic Project)',
        type: 'Mobile & Computer Vision App',
        status: 'Prototype',
        description: 'Cross-platform mobile application utilizing computer vision to detect user facial emotions and dynamically curate mood-matched Spotify playlists in real time.',
        tech: ['Flutter', 'FastAPI', 'Python', 'Dart', 'Computer Vision', 'Spotify API'],
        features: [
          'Real-time facial expression capture and emotion scoring',
          'Automated mood-to-tempo playlist synchronization via Spotify API',
          'High-throughput asynchronous FastAPI backend microservice'
        ]
      },
      {
        title: 'SIRAWA — Neighborhood Information System (Academic Project)',
        type: 'Full-Stack Web Platform',
        status: 'Completed',
        description: 'Comprehensive civic administrative portal built for RW 03 Bumiayu, Malang to digitize citizen demographics, welfare assistance tracking, and community business promotion.',
        tech: ['Laravel', 'JavaScript', 'Tailwind CSS', 'MySQL', 'Blade'],
        features: [
          'Digital administrative letter generator with automated formatting',
          'Social assistance (Bansos) quota and distribution monitoring',
          'Integrated local UMKM marketplace and citizen directory'
        ]
      },
      {
        title: 'Polinema Booking Room — Classroom Reservation System (Academic Project)',
        type: 'Web Application & Scheduling Engine',
        status: 'Completed',
        description: 'Centralized room and laboratory reservation engine designed for the Department of Information Technology at Politeknik Negeri Malang.',
        tech: ['PHP (OOP)', 'JavaScript', 'Tailwind CSS', 'MySQL'],
        features: [
          'Dynamic room schedule grid with automated slot validation',
          'Strict anti-collision booking logic to prevent duplicate reservations',
          'Multi-level Role-Based Access Control for students, lecturers, and room admins'
        ]
      },
      {
        title: 'Enterprise CMS — PT Sthira Teknik Indonesia',
        type: 'Enterprise Content Management System',
        status: 'Completed',
        description: 'Scalable corporate content management system streamlining internal workflows, media asset management, and client inquiry handling.',
        tech: ['PHP / Laravel', 'Relational Database', 'Tailwind CSS', 'REST APIs'],
        features: [
          'Modular content publisher with custom publishing workflows',
          'Normalized relational architecture eliminating data redundancy',
          'Responsive administrative dashboard with granular access permissions'
        ]
      },
    ]
  },
  {
    id: 'contact',
    name: 'Comms',
    subtitle: 'Sub-space Transmission & Links',
    sector: 'SEC-04 // RELAY',
    color: '#f43f5e', // Rose/Red
    size: 0.75,
    distance: 39.5,
    speed: 0.14,
    moons: [
      {
        name: 'Relay-I',
        size: 0.18,
        distance: 1.8,
        speed: 1.9,
        color: '#fda4af',
        inclination: -0.12,
      },
    ],
    socialsData: [
      {
        platform: 'Direct Email',
        handle: 'fazzaufa94raihan@gmail.com',
        url: 'mailto:fazzaufa94raihan@gmail.com',
        type: 'copy'
      },
      {
        platform: 'LinkedIn Profile',
        handle: 'raihan-fazzaufa-rasendriya-4740a1251',
        url: 'https://www.linkedin.com/in/raihan-fazzaufa-rasendriya-4740a1251',
        type: 'link'
      },
      {
        platform: 'GitHub Workspace',
        handle: 'RaihanFazzaufaR',
        url: 'https://github.com/RaihanFazzaufaR',
        type: 'link'
      },
      {
        platform: 'Direct Phone / WhatsApp',
        handle: '+62 822 4451 8877',
        url: 'tel:+6282244518877',
        type: 'copy'
      },
      {
        platform: 'Location Coordinates',
        handle: 'Batu City, East Java, Indonesia',
        url: 'https://maps.google.com/?q=Batu+City+East+Java+Indonesia',
        type: 'link'
      }
    ]
  }
];
