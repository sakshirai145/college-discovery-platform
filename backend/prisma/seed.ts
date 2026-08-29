import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { criticalReviewOverrides, ratingOverrides } from "./realism";

const prisma = new PrismaClient();

/* Notes on data model conventions
 * - `fees` on a course is the indicative ANNUAL tuition in rupees (demo value).
 * - `fees` on a college is the indicative annual fee shown as the headline
 *   "Annual fees" figure (demo value).
 * - Placement figures are stored in rupees (avg/highest package) to match the
 *   currency formatting used by the frontend. Values are illustrative sample
 *   values, not verified official statistics.
 */

// ---------- helpers ----------

const L = (lakh: number): number => Math.round(lakh * 100000);

const DEMO_DATA_NOTE =
  "CollegeHub demo dataset (2026): fees are indicative annual tuition figures, ratings, placement figures and reviews are illustrative sample data prepared for demonstration purposes and are not verified official statistics. Please confirm current details on the institution's official website.";

const SAMPLE_MARKERS = [
  " (Sample review prepared for the CollegeHub demo dataset.)",
  " (This is a sample review for demonstration purposes only.)",
  " (Sample review written for the CollegeHub demonstration.)",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- types ----------

type CourseSeed = { name: string; duration: string; fees: number };
type PlacementTuple = { year: number; avg: number; high: number; rate: number };

type CollegeKind =
  | "tech" // engineering & technology colleges / universities
  | "business" // management institutions
  | "medical" // medical / dental institutions
  | "law" // law universities
  | "agri" // agriculture universities
  | "language" // language universities
  | "special" // rehabilitation universities
  | "sanskrit" // sanskrit universities
  | "multi" // large multi-faculty universities
  | "arts"; // degree / PG colleges

type CollegeSeed = {
  name: string;
  location: string;
  established: number | null;
  fees: number; // indicative annual fee headline (rupees)
  rating: number; // demo rating out of 5
  description: string;
  kind: CollegeKind;
  courses: CourseSeed[];
  placements: PlacementTuple[]; // empty array when no reliable demo placement statistic
};

type SampleUser = { name: string; email: string };

const SAMPLE_USERS: SampleUser[] = [
  { name: "Sample Alumnus", email: "sample.alumni@collegehub.test" },
  { name: "Sample Final-Year Student", email: "sample.senior@collegehub.test" },
  { name: "Sample First-Year Student", email: "sample.freshman@collegehub.test" },
  { name: "Sample Parent", email: "sample.parent@collegehub.test" },
  { name: "Sample Campus Visitor", email: "sample.visitor@collegehub.test" },
  { name: "Sample Prospective Student", email: "sample.prospect@collegehub.test" },
];

// ---------- sample review content ----------

type ReviewDraft = {
  persona: number;
  delta: number;
  title: string;
  comment: string;
  rating?: number;
};

function tokens(c: CollegeSeed): { name: string; city: string; est: string; top: string } {
  const [cityRaw] = c.location.split(",");
  const city = cityRaw.trim();
  const top = c.courses.slice(0, 2).map((course) => course.name).join(" or ");
  return { name: c.name, city, est: c.established ? String(c.established) : "long-established", top };
}

function fill(template: string, t: { name: string; city: string; est: string; top: string }): string {
  return template
    .replaceAll("{name}", t.name)
    .replaceAll("{city}", t.city)
    .replaceAll("{est}", t.est)
    .replaceAll("{top}", t.top);
}

const REVIEW_BANKS: Record<CollegeKind, ReviewDraft[]> = {
  tech: [
    {
      persona: 0,
      delta: 0,
      title: "Good learning ecosystem, decent first job",
      comment:
        "I completed my degree from {name} and joined a campus-recruited company the same year. The core {top} curriculum is taught well and the training cell organises regular mock interviews. Infrastructure for labs is modern, though the library is a little dated. A practical choice if you want a solid engineering base in {city} without the metro-city fee pressure.",
    },
    {
      persona: 1,
      delta: -1,
      title: "Faculty is mixed; self-study is essential",
      comment:
        "Studying at {name} was a mixed experience. A few professors are genuinely excellent and industry-aware, others just read from the slides. Laboratories and the TI/BI blocks are good, but hostel mess food could be better. Placement season is serious through AKTU tie-ups — the average offer here reflects {city}'s engineering market realistically.",
    },
    {
      persona: 3,
      delta: 1,
      title: "Worth the fee for what my son learned",
      comment:
        "As a parent, I was worried about sending my son away from our home town, but {name} has a disciplined environment and an active alumni network. The annual fee is on par with other AKTU institutes in UP, and the placement assistance gives some confidence for the future.",
    },
    {
      persona: 4,
      delta: -1,
      title: "Campus visit impressions",
      comment:
        "I visited {name} during an open house. The design labs and the innovation centre are impressive, and the campus is safe and well-kept. The sports ground is large but the hostels are a bit crowded. Admissions were transparent and the counsellors answered honestly about placement brackets.",
    },
  ],
  business: [
    {
      persona: 0,
      delta: 0,
      title: "Rigorous programme, strong peer group",
      comment:
        "The {top} programme at {name} is intense — long case discussions and frequent evaluations keep you on your toes. What stands out is the peer quality and the placement machinery: recruiters trust the brand. Living in {city} is affordable compared to business schools in big metros, which helps too.",
    },
    {
      persona: 1,
      delta: 4,
      title: "Domestic exchange and industry exposure",
      comment:
        "Being in my final year at {name}, I have had summer internships with top consultancies and BFSI firms. The alumni network opened several doors. The pedagogy is rigorous and the returning median package justifies the tuition, though day-to-day expenses in {city} add up during term.",
    },
    {
      persona: 4,
      delta: 1,
      title: "Impressive campus and facilities",
      comment:
        "The {city} campus of {name} is compact but well designed — modern classrooms, a strong library and good residential blocks. Faculty are approachable and the placement office shares detailed annual reports. A serious choice for management education in the region.",
    },
  ],
  medical: [
    {
      persona: 1,
      delta: 1,
      title: "Clinical exposure from the first years",
      comment:
        "As a senior MBBS student at {name}, I have had early bedside training through the associated hospital in {city}. Teaching in the pre-clinical years is solid, and the attached facility sees a high patient load, which is great for practical learning. Hostels and mess are basic but functional.",
    },
    {
      persona: 3,
      delta: -1,
      title: "A reasonable government-college experience",
      comment:
        "My daughter joined {name} last year and the fee is very reasonable compared with private medical colleges. The hospital is busy and internship experience is rich. Some labs and equipment are older, and administrative queues can be long during counselling season.",
    },
    {
      persona: 0,
      delta: 2,
      title: "Busy hospital, dedicated faculty",
      comment:
        "I moved to {city} for my postgraduate seat at {name} and the clinical load has been excellent. Most faculty are approachable and rounds are educational. I would advise incoming students to bring books for theory, as library copies run out near exams.",
    },
  ],
  law: [
    {
      persona: 0,
      delta: 1,
      title: "A demanding and rewarding law school",
      comment:
        "The five-year integrated law programme at {name} is academically heavy — moot courts, seminars and legal-aid clinics are woven into the syllabus. Faculty guidance during internships at law firms and courts in {city} has been invaluable. The residential campus keeps the student community tight-knit.",
    },
    {
      persona: 1,
      delta: 0,
      title: "Strong on curriculum, packed schedule",
      comment:
        "Final year at {name} has been intense but rewarding. The placement and internship cell is active and many seniors have secured offers in litigation chambers and corporate firms. The course fees are transparent and there are scholarships for top rankers. The library is excellent.",
    },
  ],
  agri: [
    {
      persona: 1,
      delta: 0,
      title: "Hands-on field work and extension visits",
      comment:
        "Studying agriculture at {name} means regular visits to the instructional farm and village extension camps around {city}. The curriculum is well suited to anyone wanting research or agri-business. Hostel facilities are decent, and the mess is on-site at low prices.",
    },
    {
      persona: 4,
      delta: 1,
      title: "A focused agricultural campus",
      comment:
        "I toured {name} during the admission round and was impressed by the farm lab, seed centre and soil-testing units. It is not a large multi-faculty campus, but the agriculture faculty are specialised and the tuition is affordable for a professional degree.",
    },
  ],
  language: [
    {
      persona: 1,
      delta: 0,
      title: "Great for language specialisation",
      comment:
        "The language programmes at {name} are tailored for serious learners of Arabic, French and Urdu in {city}. Classes are small and the language lab is genuinely useful. Placement is limited to academia and interpretation roles, so plan your career path early.",
    },
    {
      persona: 4,
      delta: -1,
      title: "Specialised but modest campus life",
      comment:
        "A visit to {name} showed well-equipped language labs and good faculty. Campus amenities are modest compared with technical universities, and hostel occupancy is on the lower side. If languages are your goal, the depth here is hard to beat at this fee.",
    },
  ],
  special: [
    {
      persona: 1,
      delta: 0,
      title: "Purposeful education with real impact",
      comment:
        "Studying at {name} has been a meaningful experience — the faculty of special education runs practicum sessions with local schools and rehabilitation centres around {city}. The university is genuinely accessible-friendly, which is rare. Career paths lean towards rehabilitation and teaching, which suits the mission.",
    },
    {
      persona: 4,
      delta: -1,
      title: "Quiet campus, focused academics",
      comment:
        "I visited {name} before applying. The campus is calm and purpose-built for accessibility, and the B.Ed special education block is well equipped. Facilities are functional rather than fancy, and the fee structure is quite low, which keeps education accessible.",
    },
  ],
  sanskrit: [
    {
      persona: 5,
      delta: 0,
      title: "Deep tradition of scholarship",
      comment:
        "Coming to {name} in {city} means studying Sanskrit and Indian knowledge systems under experienced pandits and modern researchers. The shastra examinations are rigorous and the manuscripts section of the library is remarkable. Career paths are academic — teaching and research.",
    },
    {
      persona: 4,
      delta: -1,
      title: "Traditional focus, simple facilities",
      comment:
        "I visited the {city} campus to understand the courses. Academic depth is excellent for Sanskrit and allied disciplines, but laboratory-based courses and placement support are minimal, so this suits students committed to scholarship rather than the corporate track.",
    },
  ],
  multi: [
    {
      persona: 0,
      delta: 0,
      title: "A vast university with options for everyone",
      comment:
        "{name} is enormous in the best way — you can shift from pure science to humanities to professional courses without changing city. The campus in {city} has a rich library and active societies. Being a large institution, administrative processes can be slow, so keep deadlines on your calendar.",
    },
    {
      persona: 1,
      delta: 1,
      title: "Flexible curriculum and good faculty",
      comment:
        "I appreciated the breadth of electives at {name} and the quality of the core faculty in my department. Research culture is strengthening, with several new labs coming up. Hostels fill quickly, so apply early. Overall a strong public-university value for money.",
    },
    {
      persona: 4,
      delta: -1,
      title: "Vast grounds, mixed infrastructure",
      comment:
        "Walking through {name} you notice both the heritage buildings and some older classrooms that need renovation. What impressed me was the campus life — seminars, fests and a good reading room culture. Fees are very affordable for students from {city} and nearby.",
    },
  ],
  arts: [
    {
      persona: 0,
      delta: 0,
      title: "Affordable education with a strong local reputation",
      comment:
        "{name} in {city} is a dependable institution for a first degree — the faculty is experienced and examinations follow the university calendar strictly. The library is decent and classrooms have been upgraded in recent years. Placement support is modest, so combine your degree with skill-building.",
    },
    {
      persona: 2,
      delta: -1,
      title: "Good start, limited placement support",
      comment:
        "As a first-year student at {name} I have liked the teaching quality in the core subjects. The negatives are the predictable ones for a degree college: limited on-campus placement drives and shared lab equipment. Scholarships cover some of the fee for meritorious students.",
    },
    {
      persona: 4,
      delta: 1,
      title: "Heritage campus, courteous staff",
      comment:
        "I accompanied a relative to {name} during admission. The campus has a pleasant old-{city} character and the staff were helpful during the process. The fee is low, which makes it an accessible option, but check the transport links before enrolling.",
    },
  ],
};

function reviewCountFor(kind: CollegeKind, rand: () => number): number {
  const prefix = Math.floor(rand() * 10);
  if (kind === "tech" || kind === "business" || kind === "law") {
    return [2, 2, 3, 2, 3, 1, 2, 2, 3, 2][prefix];
  }
  if (kind === "medical") return [1, 2, 1, 2, 1, 2, 1, 2, 1, 2][prefix];
  if (kind === "sanskrit" || kind === "language" || kind === "special") {
    return [0, 1, 0, 1, 0, 1, 0, 0, 1, 1][prefix];
  }
  return [1, 2, 1, 2, 0, 1, 2, 1, 1, 2][prefix];
}

function buildReviews(c: CollegeSeed): { userIndex: number; rating: number; title: string; comment: string }[] {
  const rand = mulberry32(fnv1a(`reviews-${c.name}`));
  const bank = REVIEW_BANKS[c.kind] ?? REVIEW_BANKS.arts;
  const criticalReview = criticalReviewOverrides[c.name];
  const count = Math.max(reviewCountFor(c.kind, rand), criticalReview ? 1 : 0);
  if (count === 0) return [];

  const t = tokens(c);
  const drafts = [...bank].sort(() => rand() - 0.5).slice(0, count);
  if (criticalReview) {
    drafts[0] = {
      persona: 5,
      delta: 0,
      rating: criticalReview.rating,
      title: criticalReview.title,
      comment: criticalReview.comment,
    };
  }
  const usedPersonas = new Set<number>();

  return drafts.map((draft) => {
    let persona = draft.persona;
    while (usedPersonas.has(persona)) {
      persona = (persona + 1) % SAMPLE_USERS.length;
    }
    usedPersonas.add(persona);
    const rating = draft.rating ?? Math.max(1, Math.min(5, Math.round(c.rating + draft.delta)));
    const marker = SAMPLE_MARKERS[Math.floor(rand() * SAMPLE_MARKERS.length)];
    return {
      userIndex: persona,
      rating,
      title: fill(draft.title, t),
      comment: fill(draft.comment, t) + marker,
    };
  });
}

// ---------- curated dataset (85 institutions) ----------

const colleges: CollegeSeed[] = [
  // ---------- Lucknow (16) ----------
  {
    name: "University of Lucknow",
    location: "Lucknow, Uttar Pradesh",
    established: 1920,
    fees: 25000,
    rating: 4.3,
    kind: "multi",
    description:
      "The University of Lucknow is a NAAC A++ accredited state university established in 1920 under the University of Lucknow Act. One of the oldest and largest universities in Uttar Pradesh, it offers undergraduate to doctoral programmes across arts, science, commerce, law and management.",
    courses: [
      { name: "BA (English / Economics / History)", duration: "3 years", fees: 25000 },
      { name: "B.Sc (Physics / Chemistry / Mathematics)", duration: "3 years", fees: 28000 },
      { name: "B.Com", duration: "3 years", fees: 27000 },
      { name: "BBA", duration: "3 years", fees: 60000 },
      { name: "B.A. LL.B. (Hons)", duration: "5 years", fees: 80000 },
      { name: "MA (Any faculty)", duration: "2 years", fees: 30000 },
      { name: "M.Sc", duration: "2 years", fees: 32000 },
      { name: "MBA", duration: "2 years", fees: 240000 },
    ],
    placements: [{ year: 2024, avg: 7.2, high: 25, rate: 68 }],
  },
  {
    name: "Indian Institute of Management Lucknow",
    location: "Lucknow, Uttar Pradesh",
    established: 1984,
    fees: 1150000,
    rating: 4.7,
    kind: "business",
    description:
      "Indian Institute of Management Lucknow, established in 1984, is the fourth IIM in India and a leading public management school known for its flagship MBA, executive education and doctoral programmes.",
    courses: [
      { name: "Post Graduate Programme in Management (PGP)", duration: "2 years", fees: 1150000 },
      { name: "PGP in Agribusiness Management", duration: "2 years", fees: 950000 },
      { name: "Executive Post Graduate Programme", duration: "18 months", fees: 1300000 },
      { name: "Fellow Programme (Doctoral)", duration: "4 years", fees: 100000 },
    ],
    placements: [
      { year: 2024, avg: 30.6, high: 105, rate: 99 },
      { year: 2023, avg: 29.4, high: 88, rate: 98 },
      { year: 2022, avg: 27.1, high: 74, rate: 97 },
      { year: 2021, avg: 24.8, high: 64, rate: 96 },
    ],
  },
  {
    name: "King George's Medical University",
    location: "Lucknow, Uttar Pradesh",
    established: 1905,
    fees: 75000,
    rating: 4.4,
    kind: "medical",
    description:
      "King George's Medical University, established in 1905, is one of the oldest and largest government medical universities in India, offering MBBS, MD/MS, dental and nursing programmes in Lucknow.",
    courses: [
      { name: "MBBS", duration: "5.5 years", fees: 75000 },
      { name: "BDS", duration: "5 years", fees: 100000 },
      { name: "MD (Various Specialities)", duration: "3 years", fees: 120000 },
      { name: "MS (Various Specialities)", duration: "3 years", fees: 120000 },
      { name: "B.Sc Nursing", duration: "4 years", fees: 60000 },
    ],
    placements: [],
  },
  {
    name: "Dr. A.P.J. Abdul Kalam Technical University",
    location: "Lucknow, Uttar Pradesh",
    established: 2000,
    fees: 120000,
    rating: 4.1,
    kind: "tech",
    description:
      "Dr. A.P.J. Abdul Kalam Technical University, formerly UPTU, was established in 2000 and is the apex state technical university in Lucknow, affiliating engineering, management, pharmacy and architecture colleges across Uttar Pradesh.",
    courses: [
      { name: "B.Tech (Affiliated Colleges)", duration: "4 years", fees: 120000 },
      { name: "B.Arch", duration: "5 years", fees: 140000 },
      { name: "B.Pharm", duration: "4 years", fees: 110000 },
      { name: "M.Tech", duration: "2 years", fees: 85000 },
      { name: "MBA", duration: "2 years", fees: 160000 },
      { name: "MCA", duration: "3 years", fees: 100000 },
    ],
    placements: [{ year: 2024, avg: 7.5, high: 26, rate: 70 }],
  },
  {
    name: "Institute of Engineering and Technology, Lucknow",
    location: "Lucknow, Uttar Pradesh",
    established: 1984,
    fees: 110000,
    rating: 4.2,
    kind: "tech",
    description:
      "IET Lucknow, popularly known as the Engineering College, was established by the Government of Uttar Pradesh in 1984 and is an autonomous constituent college of AKTU offering B.Tech, M.Tech, MCA and MBA programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 120000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 115000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 110000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 110000 },
      { name: "M.Tech", duration: "2 years", fees: 75000 },
      { name: "MCA", duration: "3 years", fees: 85000 },
    ],
    placements: [
      { year: 2024, avg: 9.6, high: 34, rate: 86 },
      { year: 2023, avg: 8.8, high: 30, rate: 84 },
      { year: 2022, avg: 8.0, high: 27, rate: 81 },
    ],
  },
  {
    name: "Amity University Lucknow Campus",
    location: "Lucknow, Uttar Pradesh",
    established: 2004,
    fees: 220000,
    rating: 4.0,
    kind: "tech",
    description:
      "Amity University Lucknow Campus, established in 2004 at Malhaur, is a constituent campus of Amity University Uttar Pradesh offering programmes across engineering, management, law, sciences and humanities.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 220000 },
      { name: "B.Arch", duration: "5 years", fees: 240000 },
      { name: "BBA", duration: "3 years", fees: 165000 },
      { name: "B.A. LL.B.", duration: "5 years", fees: 210000 },
      { name: "MBA", duration: "2 years", fees: 260000 },
    ],
    placements: [
      { year: 2024, avg: 8.0, high: 34, rate: 82 },
      { year: 2023, avg: 7.3, high: 29, rate: 79 },
      { year: 2022, avg: 6.8, high: 24, rate: 76 },
    ],
  },
  {
    name: "Babu Banarasi Das University",
    location: "Lucknow, Uttar Pradesh",
    established: 2010,
    fees: 180000,
    rating: 3.9,
    kind: "tech",
    description:
      "Babu Banarasi Das University is a private university in Lucknow established in 2010 by the BBD Educational Trust, offering engineering, management, pharmacy, law and hotel management programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 195000 },
      { name: "B.Com (Hons)", duration: "3 years", fees: 95000 },
      { name: "B.Pharm", duration: "4 years", fees: 150000 },
      { name: "B.A. LL.B.", duration: "5 years", fees: 180000 },
      { name: "BHM (Hotel Management)", duration: "4 years", fees: 120000 },
      { name: "MBA", duration: "2 years", fees: 210000 },
    ],
    placements: [
      { year: 2024, avg: 7.5, high: 28, rate: 80 },
      { year: 2023, avg: 7.0, high: 25, rate: 77 },
    ],
  },
  {
    name: "Era University",
    location: "Lucknow, Uttar Pradesh",
    established: 2016,
    fees: 1500000,
    rating: 3.8,
    kind: "medical",
    description:
      "Era University, founded in 2016 under the Era Educational Trust, is a UGC-recognised private university in Lucknow offering medical, dental, pharmacy, engineering and management programmes.",
    courses: [
      { name: "MBBS", duration: "5.5 years", fees: 1500000 },
      { name: "BDS", duration: "5 years", fees: 400000 },
      { name: "B.Tech (Creative Streams)", duration: "4 years", fees: 170000 },
      { name: "B.Sc Nursing", duration: "4 years", fees: 130000 },
      { name: "B.Pharm", duration: "4 years", fees: 140000 },
      { name: "MBA", duration: "2 years", fees: 190000 },
    ],
    placements: [{ year: 2024, avg: 6.4, high: 22, rate: 74 }],
  },
  {
    name: "Shri Ramswaroop Memorial University",
    location: "Lucknow, Uttar Pradesh",
    established: 2012,
    fees: 145000,
    rating: 3.8,
    kind: "tech",
    description:
      "Shri Ramswaroop Memorial University is a private university in Lucknow established under Uttar Pradesh Act 1 of 2012, offering engineering, management, law, nursing and allied health programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 150000 },
      { name: "BBA", duration: "3 years", fees: 115000 },
      { name: "B.Sc Nursing", duration: "4 years", fees: 135000 },
      { name: "B.A. LL.B.", duration: "5 years", fees: 170000 },
      { name: "MBA", duration: "2 years", fees: 180000 },
    ],
    placements: [{ year: 2024, avg: 6.9, high: 25, rate: 76 }],
  },
  {
    name: "Integral University",
    location: "Lucknow, Uttar Pradesh",
    established: 2004,
    fees: 135000,
    rating: 4.1,
    kind: "tech",
    description:
      "Integral University is a NAAC A+ accredited private university in Lucknow established under UP Act 9 of 2004, offering engineering, pharmacy, medicine, biosciences and management programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 145000 },
      { name: "B.Pharm", duration: "4 years", fees: 125000 },
      { name: "MBBS", duration: "5.5 years", fees: 1200000 },
      { name: "BBA", duration: "3 years", fees: 95000 },
      { name: "B.Sc Nursing", duration: "4 years", fees: 120000 },
      { name: "MBA", duration: "2 years", fees: 155000 },
    ],
    placements: [
      { year: 2024, avg: 7.1, high: 26, rate: 78 },
      { year: 2023, avg: 6.5, high: 22, rate: 75 },
    ],
  },
  {
    name: "Khwaja Moinuddin Chishti Language University",
    location: "Lucknow, Uttar Pradesh",
    established: 2009,
    fees: 16000,
    rating: 3.6,
    kind: "language",
    description:
      "Khwaja Moinuddin Chishti Language University is a state university in Lucknow established under UP Act 12 of 2009, focused on Arabic, French, English, Urdu and Hindi language education, translation and literature.",
    courses: [
      { name: "BA (Arabic)", duration: "3 years", fees: 16000 },
      { name: "BA (French)", duration: "3 years", fees: 18000 },
      { name: "MA (Arabic)", duration: "2 years", fees: 22000 },
      { name: "MA (English)", duration: "2 years", fees: 22000 },
      { name: "BA LL.B.", duration: "5 years", fees: 70000 },
      { name: "Diploma in Translation", duration: "1 year", fees: 12000 },
      { name: "Certificate in Spoken Arabic", duration: "6 months", fees: 8000 },
    ],
    placements: [],
  },
  {
    name: "Dr. Shakuntala Misra National Rehabilitation University",
    location: "Lucknow, Uttar Pradesh",
    established: 2008,
    fees: 18000,
    rating: 3.6,
    kind: "special",
    description:
      "Dr. Shakuntala Misra National Rehabilitation University is a state university in Lucknow established in 2008, dedicated to education, research and rehabilitation for persons with disabilities, with broadly accessible programmes.",
    courses: [
      { name: "BA (Disability Studies / Social Work)", duration: "3 years", fees: 18000 },
      { name: "B.Sc", duration: "3 years", fees: 22000 },
      { name: "B.Com", duration: "3 years", fees: 20000 },
      { name: "BBA", duration: "3 years", fees: 50000 },
      { name: "B.Ed (Special Education - Visual Impairment)", duration: "2 years", fees: 32000 },
      { name: "M.Ed (Special Education - Hearing Impairment)", duration: "2 years", fees: 36000 },
    ],
    placements: [],
  },
  {
    name: "Dr. Ram Manohar Lohiya National Law University",
    location: "Lucknow, Uttar Pradesh",
    established: 2005,
    fees: 240000,
    rating: 4.3,
    kind: "law",
    description:
      "Dr. Ram Manohar Lohiya National Law University is a state law university in Lucknow established under UP Act No. 28 of 2005, offering five-year integrated law, LL.M and doctoral law programmes.",
    courses: [
      { name: "B.A. LL.B. (Hons)", duration: "5 years", fees: 240000 },
      { name: "B.B.A. LL.B. (Hons)", duration: "5 years", fees: 240000 },
      { name: "LL.M", duration: "1 year", fees: 140000 },
      { name: "Ph.D. (Law)", duration: "3 years", fees: 60000 },
    ],
    placements: [
      { year: 2024, avg: 12.4, high: 42, rate: 90 },
      { year: 2023, avg: 11.6, high: 38, rate: 88 },
    ],
  },
  {
    name: "National Post Graduate College",
    location: "Lucknow, Uttar Pradesh",
    established: 1974,
    fees: 25000,
    rating: 3.9,
    kind: "arts",
    description:
      "National PG College is an autonomous, NAAC A accredited college in Lucknow, established in 1974 and affiliated to the University of Lucknow, offering undergraduate and postgraduate programmes in science, commerce and humanities.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 25000 },
      { name: "B.Sc (Maths / Science Streams)", duration: "3 years", fees: 30000 },
      { name: "B.Com", duration: "3 years", fees: 27000 },
      { name: "BCA", duration: "3 years", fees: 45000 },
      { name: "MA", duration: "2 years", fees: 30000 },
      { name: "M.Sc", duration: "2 years", fees: 34000 },
    ],
    placements: [],
  },
  {
    name: "Lucknow Christian College",
    location: "Lucknow, Uttar Pradesh",
    established: 1862,
    fees: 24000,
    rating: 4.0,
    kind: "arts",
    description:
      "Lucknow Christian College, established in 1862, is one of the oldest colleges in Lucknow. A government-aided college affiliated to the University of Lucknow, it offers arts, science, commerce and physical education.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 24000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 28000 },
      { name: "B.Com", duration: "3 years", fees: 26000 },
      { name: "B.P.Ed", duration: "3 years", fees: 40000 },
      { name: "MA", duration: "2 years", fees: 29000 },
      { name: "B.Ed", duration: "2 years", fees: 38000 },
    ],
    placements: [],
  },
  {
    name: "Isabella Thoburn College",
    location: "Lucknow, Uttar Pradesh",
    established: 1870,
    fees: 28000,
    rating: 4.1,
    kind: "arts",
    description:
      "Isabella Thoburn College, established in 1870, is the first Christian college for women in South Asia. An associate college of the University of Lucknow, it offers degree and professional programmes for women.",
    courses: [
      { name: "BA (Arts / Social Sciences)", duration: "3 years", fees: 28000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 32000 },
      { name: "B.Com", duration: "3 years", fees: 30000 },
      { name: "BBA", duration: "3 years", fees: 70000 },
      { name: "BA (Psychology)", duration: "3 years", fees: 35000 },
      { name: "MA", duration: "2 years", fees: 33000 },
    ],
    placements: [],
  },

  // ---------- Kanpur (9) ----------
  {
    name: "Indian Institute of Technology Kanpur",
    location: "Kanpur, Uttar Pradesh",
    established: 1959,
    fees: 220000,
    rating: 4.6,
    kind: "tech",
    description:
      "Indian Institute of Technology Kanpur, established in 1959, is one of the first-generation IITs and an institution of national importance, renowned for its strong undergraduate research culture in engineering and science.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 225000 },
      { name: "B.Tech Electrical Engineering", duration: "4 years", fees: 220000 },
      { name: "B.Tech Aerospace Engineering", duration: "4 years", fees: 220000 },
      { name: "B.S. Mathematics and Scientific Computing", duration: "4 years", fees: 215000 },
      { name: "MBA", duration: "2 years", fees: 400000 },
      { name: "M.Tech", duration: "2 years", fees: 120000 },
      { name: "M.Sc", duration: "2 years", fees: 85000 },
    ],
    placements: [
      { year: 2024, avg: 22.4, high: 88, rate: 96 },
      { year: 2023, avg: 20.9, high: 74, rate: 94 },
      { year: 2022, avg: 19.8, high: 62, rate: 92 },
      { year: 2021, avg: 18.4, high: 55, rate: 90 },
    ],
  },
  {
    name: "Harcourt Butler Technical University",
    location: "Kanpur, Uttar Pradesh",
    established: 1921,
    fees: 110000,
    rating: 4.3,
    kind: "tech",
    description:
      "Harcourt Butler Technical University, formerly HBTI, was established in 1921 and reconstituted as a state technical university in 2016. It is known for chemical, mechanical, electrical, leather and paint technology in Kanpur.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 120000 },
      { name: "B.Tech Chemical Engineering", duration: "4 years", fees: 115000 },
      { name: "B.Tech Leather Technology", duration: "4 years", fees: 110000 },
      { name: "B.Tech Oil Technology", duration: "4 years", fees: 110000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 115000 },
      { name: "B.Tech Information Technology", duration: "4 years", fees: 115000 },
      { name: "BBA", duration: "3 years", fees: 95000 },
      { name: "MBA", duration: "2 years", fees: 140000 },
    ],
    placements: [
      { year: 2024, avg: 11.4, high: 38, rate: 85 },
      { year: 2023, avg: 10.6, high: 34, rate: 83 },
      { year: 2022, avg: 9.8, high: 30, rate: 80 },
    ],
  },
  {
    name: "Chhatrapati Shahu Ji Maharaj University",
    location: "Kanpur, Uttar Pradesh",
    established: 1966,
    fees: 20000,
    rating: 4.0,
    kind: "multi",
    description:
      "Chhatrapati Shahu Ji Maharaj University, formerly Kanpur University, was established in 1966 and is a large state university in Kalyanpur, Kanpur, with a wide network of affiliated colleges across the region.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "BBA", duration: "3 years", fees: 55000 },
      { name: "BCA", duration: "3 years", fees: 50000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
      { name: "MBA", duration: "2 years", fees: 90000 },
    ],
    placements: [],
  },
  {
    name: "Pranveer Singh Institute of Technology",
    location: "Kanpur, Uttar Pradesh",
    established: 2004,
    fees: 125000,
    rating: 4.2,
    kind: "tech",
    description:
      "Pranveer Singh Institute of Technology, established in 2004 by the Kanpur Educational Society, is an AKTU-affiliated technical institute in Kanpur known for engineering, pharmacy and management with a strong training and placement cell.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 128000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 123000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 120000 },
      { name: "B.Pharm", duration: "4 years", fees: 110000 },
      { name: "MBA", duration: "2 years", fees: 135000 },
      { name: "MCA", duration: "3 years", fees: 90000 },
    ],
    placements: [
      { year: 2024, avg: 8.5, high: 31, rate: 86 },
      { year: 2023, avg: 7.9, high: 28, rate: 84 },
      { year: 2022, avg: 7.2, high: 25, rate: 81 },
    ],
  },
  {
    name: "Kanpur Institute of Technology",
    location: "Kanpur, Uttar Pradesh",
    established: 2004,
    fees: 120000,
    rating: 4.1,
    kind: "tech",
    description:
      "Kanpur Institute of Technology is an autonomous, NAAC A graded engineering institute in Rooma, Kanpur, established in 2004 by the Indus Technical Education Society, offering B.Tech, M.Tech, MBA, MCA and B.Pharm.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 122000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 118000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 115000 },
      { name: "BBA", duration: "3 years", fees: 80000 },
      { name: "B.Pharm", duration: "4 years", fees: 105000 },
      { name: "MBA", duration: "2 years", fees: 130000 },
      { name: "MCA", duration: "3 years", fees: 85000 },
    ],
    placements: [
      { year: 2024, avg: 7.6, high: 27, rate: 82 },
      { year: 2023, avg: 7.1, high: 25, rate: 79 },
    ],
  },
  {
    name: "Rama University",
    location: "Kanpur, Uttar Pradesh",
    established: 1996,
    fees: 1250000,
    rating: 3.9,
    kind: "medical",
    description:
      "Rama University is a UGC-recognised private university with a campus at Mandhana, Kanpur, established in 1996. It offers MBBS, BDS, engineering, law, nursing and management programmes.",
    courses: [
      { name: "MBBS", duration: "5.5 years", fees: 1250000 },
      { name: "BDS", duration: "5 years", fees: 350000 },
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 150000 },
      { name: "B.Sc Nursing", duration: "4 years", fees: 130000 },
      { name: "BBA", duration: "3 years", fees: 85000 },
      { name: "LL.B", duration: "3 years", fees: 110000 },
      { name: "MBA", duration: "2 years", fees: 160000 },
    ],
    placements: [{ year: 2024, avg: 6.6, high: 23, rate: 75 }],
  },
  {
    name: "Christ Church College",
    location: "Kanpur, Uttar Pradesh",
    established: 1866,
    fees: 22000,
    rating: 3.9,
    kind: "arts",
    description:
      "Christ Church College, established in 1866, is the oldest college of Kanpur and is affiliated to Chhatrapati Shahu Ji Maharaj University, offering arts, science, commerce and postgraduate programmes.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 22000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 26000 },
      { name: "B.Com", duration: "3 years", fees: 24000 },
      { name: "BCA", duration: "3 years", fees: 45000 },
      { name: "MA", duration: "2 years", fees: 28000 },
      { name: "B.Ed", duration: "2 years", fees: 36000 },
    ],
    placements: [],
  },
  {
    name: "Dayanand Girls' Post Graduate College",
    location: "Kanpur, Uttar Pradesh",
    established: 1959,
    fees: 20000,
    rating: 3.8,
    kind: "arts",
    description:
      "Dayanand Girls' PG College, established on 1 July 1959, is the first postgraduate college for women in Kanpur. Affiliated to Chhatrapati Shahu Ji Maharaj University, it offers UG and PG programmes for women.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "BBA", duration: "3 years", fees: 60000 },
      { name: "MA", duration: "2 years", fees: 27000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
      { name: "B.Ed", duration: "2 years", fees: 38000 },
    ],
    placements: [],
  },
  {
    name: "V.S.S.D. College",
    location: "Kanpur, Uttar Pradesh",
    established: 1921,
    fees: 20000,
    rating: 4.0,
    kind: "arts",
    description:
      "Vikramajit Singh Sanatan Dharma (VSSD) College, founded in 1921 in Nawabganj, Kanpur, is a NAAC A accredited heritage institution affiliated to CSJM University and was among the first commerce colleges in North India.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Com", duration: "3 years", fees: 24000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "BBA", duration: "3 years", fees: 55000 },
      { name: "M.Com", duration: "2 years", fees: 30000 },
      { name: "B.Ed", duration: "2 years", fees: 36000 },
    ],
    placements: [],
  },

  // ---------- Varanasi (8) ----------
  {
    name: "Banaras Hindu University",
    location: "Varanasi, Uttar Pradesh",
    established: 1916,
    fees: 30000,
    rating: 4.5,
    kind: "multi",
    description:
      "Banaras Hindu University, founded in 1916 by Pandit Madan Mohan Malaviya, is India's first central university and an institution of national importance, offering courses across arts, science, technology, medicine and management.",
    courses: [
      { name: "BA (Arts / Social Sciences)", duration: "3 years", fees: 30000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 35000 },
      { name: "B.Com", duration: "3 years", fees: 32000 },
      { name: "MBBS", duration: "5.5 years", fees: 90000 },
      { name: "B.Ed", duration: "2 years", fees: 45000 },
      { name: "LL.B", duration: "3 years", fees: 45000 },
      { name: "M.Sc", duration: "2 years", fees: 40000 },
      { name: "MBA", duration: "2 years", fees: 120000 },
    ],
    placements: [
      { year: 2024, avg: 14.2, high: 52, rate: 82 },
      { year: 2023, avg: 13.4, high: 46, rate: 80 },
    ],
  },
  {
    name: "Indian Institute of Technology (BHU) Varanasi",
    location: "Varanasi, Uttar Pradesh",
    established: 1919,
    fees: 218000,
    rating: 4.5,
    kind: "tech",
    description:
      "IIT (BHU) Varanasi, originating from the Banaras Engineering College founded in 1919 and given IIT status in 2012, is an institute of national importance offering engineering, technology, pharmacy and sciences.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 224000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 220000 },
      { name: "B.Tech Electrical Engineering", duration: "4 years", fees: 220000 },
      { name: "B.Tech Ceramic Engineering", duration: "4 years", fees: 218000 },
      { name: "B.Pharm", duration: "4 years", fees: 205000 },
      { name: "B.Tech + M.Tech (Dual Degree)", duration: "5 years", fees: 218000 },
      { name: "M.Sc", duration: "2 years", fees: 80000 },
    ],
    placements: [
      { year: 2024, avg: 19.8, high: 70, rate: 92 },
      { year: 2023, avg: 18.2, high: 62, rate: 90 },
      { year: 2022, avg: 17.0, high: 54, rate: 89 },
    ],
  },
  {
    name: "Mahatma Gandhi Kashi Vidyapith",
    location: "Varanasi, Uttar Pradesh",
    established: 1921,
    fees: 22000,
    rating: 4.0,
    kind: "multi",
    description:
      "Mahatma Gandhi Kashi Vidyapith is a state university in Varanasi, established on 10 February 1921, offering programmes in arts, science, commerce, law, management and teacher education.",
    courses: [
      { name: "BA (Arts / Social Sciences)", duration: "3 years", fees: 22000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 25000 },
      { name: "B.Com", duration: "3 years", fees: 24000 },
      { name: "BCA", duration: "3 years", fees: 48000 },
      { name: "MA", duration: "2 years", fees: 28000 },
      { name: "M.Sc", duration: "2 years", fees: 32000 },
      { name: "B.Ed", duration: "2 years", fees: 38000 },
    ],
    placements: [],
  },
  {
    name: "Sampurnanand Sanskrit Vishwavidyalaya",
    location: "Varanasi, Uttar Pradesh",
    established: 1958,
    fees: 14000,
    rating: 3.8,
    kind: "sanskrit",
    description:
      "Sampurnanand Sanskrit Vishwavidyalaya is a state university in Varanasi established on 22 March 1958, devoted to Sanskrit education, research and the preservation of Indian knowledge traditions.",
    courses: [
      { name: "Shastri (Undergraduate)", duration: "3 years", fees: 14000 },
      { name: "BA (Sanskrit)", duration: "3 years", fees: 16000 },
      { name: "Acharya (Postgraduate)", duration: "2 years", fees: 20000 },
      { name: "MA (Sanskrit)", duration: "2 years", fees: 22000 },
      { name: "Ph.D.", duration: "3 years", fees: 30000 },
    ],
    placements: [],
  },
  {
    name: "D.A.V. Post Graduate College",
    location: "Varanasi, Uttar Pradesh",
    established: 1938,
    fees: 22000,
    rating: 4.0,
    kind: "arts",
    description:
      "DAV Post Graduate College, established in 1938 and admitted to the privileges of Banaras Hindu University, is a NAAC A+ accredited college in Ausanganj, Varanasi, offering arts, science, commerce, PG and research programmes.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 22000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 26000 },
      { name: "B.Com", duration: "3 years", fees: 24000 },
      { name: "BCA", duration: "3 years", fees: 50000 },
      { name: "MA", duration: "2 years", fees: 28000 },
      { name: "M.Com", duration: "2 years", fees: 30000 },
      { name: "M.Sc", duration: "2 years", fees: 32000 },
    ],
    placements: [],
  },
  {
    name: "Udai Pratap Autonomous College",
    location: "Varanasi, Uttar Pradesh",
    established: 1949,
    fees: 22000,
    rating: 4.2,
    kind: "arts",
    description:
      "Udai Pratap Autonomous College in Bhojubeer, Varanasi, founded as a degree college in 1949, was the first institution in Uttar Pradesh to receive autonomy (1991). The NAAC A accredited college offers degree, PG and agriculture programmes.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 22000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 26000 },
      { name: "B.Com", duration: "3 years", fees: 24000 },
      { name: "B.Sc (Agriculture)", duration: "4 years", fees: 32000 },
      { name: "BBA", duration: "3 years", fees: 55000 },
      { name: "MA", duration: "2 years", fees: 27000 },
      { name: "M.Sc", duration: "2 years", fees: 32000 },
    ],
    placements: [],
  },
  {
    name: "Arya Mahila Post Graduate College",
    location: "Varanasi, Uttar Pradesh",
    established: 1956,
    fees: 20000,
    rating: 4.0,
    kind: "arts",
    description:
      "Arya Mahila Post Graduate College is a NAAC A accredited women's college in Varanasi, established in 1956 and admitted to the privileges of Banaras Hindu University.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
      { name: "B.Ed", duration: "2 years", fees: 36000 },
    ],
    placements: [],
  },
  {
    name: "Kashi Institute of Technology",
    location: "Varanasi, Uttar Pradesh",
    established: 2008,
    fees: 108000,
    rating: 4.0,
    kind: "tech",
    description:
      "Kashi Institute of Technology, established in 2008 under the Jain Education Society, is an AKTU-affiliated engineering college in Varanasi offering B.Tech, M.Tech, MBA and MCA programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 115000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 110000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 108000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 108000 },
      { name: "MCA", duration: "3 years", fees: 80000 },
      { name: "MBA", duration: "2 years", fees: 120000 },
    ],
    placements: [
      { year: 2024, avg: 7.4, high: 26, rate: 82 },
      { year: 2023, avg: 6.9, high: 23, rate: 79 },
    ],
  },

  // ---------- Prayagraj (7) ----------
  {
    name: "University of Allahabad",
    location: "Prayagraj, Uttar Pradesh",
    established: 1887,
    fees: 24000,
    rating: 4.4,
    kind: "multi",
    description:
      "University of Allahabad, established on 23 September 1887, is the fourth oldest university in India and a central university in Prayagraj offering programmes across arts, science, commerce, law and management.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 24000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 28000 },
      { name: "B.Com", duration: "3 years", fees: 26000 },
      { name: "LL.B", duration: "3 years", fees: 30000 },
      { name: "BCA", duration: "3 years", fees: 48000 },
      { name: "MA", duration: "2 years", fees: 30000 },
      { name: "M.Sc", duration: "2 years", fees: 34000 },
      { name: "MBA", duration: "2 years", fees: 110000 },
    ],
    placements: [{ year: 2024, avg: 6.8, high: 24, rate: 68 }],
  },
  {
    name: "Motilal Nehru National Institute of Technology Allahabad",
    location: "Prayagraj, Uttar Pradesh",
    established: 1961,
    fees: 140000,
    rating: 4.4,
    kind: "tech",
    description:
      "MNNIT Allahabad, established in 1961 as one of the first Regional Engineering Colleges and granted NIT status in 2007, is an institute of national importance in Prayagraj offering engineering, management and sciences.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 145000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 140000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 140000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 138000 },
      { name: "MBA", duration: "2 years", fees: 200000 },
      { name: "MCA", duration: "3 years", fees: 120000 },
      { name: "M.Tech", duration: "2 years", fees: 100000 },
    ],
    placements: [
      { year: 2024, avg: 15.2, high: 46, rate: 88 },
      { year: 2023, avg: 14.1, high: 42, rate: 86 },
      { year: 2022, avg: 13.0, high: 38, rate: 84 },
    ],
  },
  {
    name: "Indian Institute of Information Technology Allahabad",
    location: "Prayagraj, Uttar Pradesh",
    established: 1999,
    fees: 155000,
    rating: 4.5,
    kind: "tech",
    description:
      "IIIT Allahabad, established in 1999 as a centre of excellence in IT and declared an institute of national importance in 2014, is a research-focused institution in Prayagraj.",
    courses: [
      { name: "B.Tech Information Technology", duration: "4 years", fees: 158000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 155000 },
      { name: "MBA (Integrated with IT)", duration: "2 years", fees: 220000 },
      { name: "M.Tech", duration: "2 years", fees: 110000 },
      { name: "M.S. (Research)", duration: "2 years", fees: 85000 },
      { name: "Ph.D.", duration: "3 years", fees: 60000 },
    ],
    placements: [
      { year: 2024, avg: 18.6, high: 60, rate: 93 },
      { year: 2023, avg: 17.4, high: 54, rate: 91 },
      { year: 2022, avg: 16.2, high: 48, rate: 90 },
    ],
  },
  {
    name: "C.M.P. Degree College",
    location: "Prayagraj, Uttar Pradesh",
    established: 1950,
    fees: 20000,
    rating: 4.0,
    kind: "arts",
    description:
      "C.M.P. Degree College is a NAAC B++ accredited constituent college of the University of Allahabad, established in 1950, offering undergraduate and postgraduate programmes in science, commerce and humanities.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "BCA", duration: "3 years", fees: 45000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
    ],
    placements: [],
  },
  {
    name: "Ewing Christian College",
    location: "Prayagraj, Uttar Pradesh",
    established: 1902,
    fees: 22000,
    rating: 4.1,
    kind: "arts",
    description:
      "Ewing Christian College, established in 1902, is an autonomous Christian minority constituent college of the University of Allahabad, located on the northern bank of the Yamuna in Prayagraj.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 22000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 26000 },
      { name: "B.Com", duration: "3 years", fees: 24000 },
      { name: "BCA", duration: "3 years", fees: 48000 },
      { name: "MA", duration: "2 years", fees: 28000 },
      { name: "M.Sc", duration: "2 years", fees: 32000 },
    ],
    placements: [],
  },
  {
    name: "Iswar Saran Degree College",
    location: "Prayagraj, Uttar Pradesh",
    established: 1970,
    fees: 20000,
    rating: 3.9,
    kind: "arts",
    description:
      "Iswar Saran Degree College, established in 1970 under the Harijan Sewak Sangh, is a constituent postgraduate college of the University of Allahabad in Prayagraj offering arts, science and commerce.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Com", duration: "2 years", fees: 28000 },
    ],
    placements: [],
  },
  {
    name: "Shambhunath Institute of Engineering & Technology",
    location: "Prayagraj, Uttar Pradesh",
    established: 1995,
    fees: 105000,
    rating: 3.9,
    kind: "tech",
    description:
      "Shambhunath Institute of Engineering & Technology is a NAAC A+ accredited private technical institute in Prayagraj affiliated to AKTU, offering engineering, pharmacy, MBA and MCA programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 110000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 105000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 105000 },
      { name: "B.Pharm", duration: "4 years", fees: 95000 },
      { name: "MCA", duration: "3 years", fees: 80000 },
      { name: "MBA", duration: "2 years", fees: 115000 },
    ],
    placements: [
      { year: 2024, avg: 7.0, high: 24, rate: 80 },
      { year: 2023, avg: 6.5, high: 22, rate: 77 },
    ],
  },

  // ---------- Gorakhpur (8) ----------
  {
    name: "Deen Dayal Upadhyaya Gorakhpur University",
    location: "Gorakhpur, Uttar Pradesh",
    established: 1957,
    fees: 22000,
    rating: 4.2,
    kind: "multi",
    description:
      "Deen Dayal Upadhyaya Gorakhpur University, functioning since 1957, is a NAAC A++ accredited state university that serves as the affiliating university for Gorakhpur and surrounding districts.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 22000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 25000 },
      { name: "B.Com", duration: "3 years", fees: 24000 },
      { name: "BCA", duration: "3 years", fees: 48000 },
      { name: "LL.B", duration: "3 years", fees: 35000 },
      { name: "MA", duration: "2 years", fees: 28000 },
      { name: "M.Sc", duration: "2 years", fees: 32000 },
      { name: "B.Ed", duration: "2 years", fees: 38000 },
    ],
    placements: [],
  },
  {
    name: "Madan Mohan Malaviya University of Technology",
    location: "Gorakhpur, Uttar Pradesh",
    established: 2013,
    fees: 105000,
    rating: 4.1,
    kind: "tech",
    description:
      "MMMUT Gorakhpur, formerly Madan Mohan Malaviya Engineering College (established 1962), was reconstituted as a state technical university in 2013 and offers engineering and management programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 110000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 105000 },
      { name: "B.Tech Electrical Engineering", duration: "4 years", fees: 105000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 105000 },
      { name: "MCA", duration: "3 years", fees: 90000 },
      { name: "MBA", duration: "2 years", fees: 130000 },
    ],
    placements: [
      { year: 2024, avg: 8.6, high: 30, rate: 84 },
      { year: 2023, avg: 7.9, high: 26, rate: 82 },
      { year: 2022, avg: 7.2, high: 23, rate: 79 },
    ],
  },
  {
    name: "Baba Raghav Das Medical College",
    location: "Gorakhpur, Uttar Pradesh",
    established: 1969,
    fees: 65000,
    rating: 4.2,
    kind: "medical",
    description:
      "Baba Raghav Das Medical College is a government medical college in Gorakhpur, founded in 1969 and affiliated to Atal Bihari Vajpayee Medical University, with the associated Nehru Hospital.",
    courses: [
      { name: "MBBS", duration: "5.5 years", fees: 65000 },
      { name: "MD (Various Specialities)", duration: "3 years", fees: 110000 },
      { name: "MS (Various Specialities)", duration: "3 years", fees: 110000 },
      { name: "B.Sc Nursing", duration: "4 years", fees: 50000 },
      { name: "GNM (Diploma in Nursing)", duration: "3 years", fees: 30000 },
    ],
    placements: [],
  },
  {
    name: "Buddha Institute of Technology",
    location: "Gorakhpur, Uttar Pradesh",
    established: 2007,
    fees: 100000,
    rating: 3.9,
    kind: "tech",
    description:
      "Buddha Institute of Technology is an AICTE-approved, AKTU-affiliated engineering institute established in 2007 in GIDA, Gorakhpur, offering B.Tech, MBA and MCA programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 102000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 100000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 98000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 98000 },
      { name: "MCA", duration: "3 years", fees: 78000 },
      { name: "MBA", duration: "2 years", fees: 110000 },
    ],
    placements: [
      { year: 2024, avg: 6.8, high: 24, rate: 78 },
      { year: 2023, avg: 6.3, high: 21, rate: 75 },
    ],
  },
  {
    name: "ITM GIDA, Gorakhpur",
    location: "Gorakhpur, Uttar Pradesh",
    established: 2001,
    fees: 98000,
    rating: 3.8,
    kind: "tech",
    description:
      "Institute of Technology and Management, GIDA Gorakhpur, established in 2001 under the Shree Krishna Educational Society, is an AKTU-affiliated institute offering engineering, pharmacy and management.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 100000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 98000 },
      { name: "B.Pharm", duration: "4 years", fees: 90000 },
      { name: "BBA", duration: "3 years", fees: 70000 },
      { name: "MBA", duration: "2 years", fees: 105000 },
    ],
    placements: [
      { year: 2024, avg: 6.5, high: 23, rate: 76 },
      { year: 2023, avg: 6.0, high: 20, rate: 73 },
    ],
  },
  {
    name: "Digvijai Nath Post Graduate College",
    location: "Gorakhpur, Uttar Pradesh",
    established: 1969,
    fees: 20000,
    rating: 3.9,
    kind: "arts",
    description:
      "Digvijai Nath PG College, established on 25 August 1969, is a NAAC B++ accredited college in Gorakhpur affiliated to Deen Dayal Upadhyaya Gorakhpur University, offering UG and PG programmes.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
    ],
    placements: [],
  },
  {
    name: "Mahatma Gandhi P.G. College",
    location: "Gorakhpur, Uttar Pradesh",
    established: 1969,
    fees: 20000,
    rating: 3.9,
    kind: "arts",
    description:
      "Mahatma Gandhi P.G. College is an affiliated college of Deen Dayal Upadhyaya Gorakhpur University established in 1969 in Gorakhpur, offering graduate and postgraduate programmes.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Com", duration: "2 years", fees: 28000 },
    ],
    placements: [],
  },
  {
    name: "St. Andrew's College",
    location: "Gorakhpur, Uttar Pradesh",
    established: 1899,
    fees: 24000,
    rating: 4.1,
    kind: "arts",
    description:
      "St. Andrew's College, with beginnings as a 1828 CMS mission school, is one of the oldest institutions in eastern Uttar Pradesh and is an affiliated college of Deen Dayal Upadhyaya Gorakhpur University.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 24000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 28000 },
      { name: "B.Com", duration: "3 years", fees: 26000 },
      { name: "BCA", duration: "3 years", fees: 50000 },
      { name: "MA", duration: "2 years", fees: 28000 },
      { name: "M.Sc", duration: "2 years", fees: 32000 },
    ],
    placements: [],
  },

  // ---------- Agra (6) ----------
  {
    name: "Agra College",
    location: "Agra, Uttar Pradesh",
    established: 1823,
    fees: 20000,
    rating: 4.2,
    kind: "arts",
    description:
      "Agra College, established in 1823, is the oldest institution of higher learning in North India. Affiliated to Dr. Bhimrao Ambedkar University, it offers arts, science, commerce, law and education.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "LL.B", duration: "3 years", fees: 32000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
      { name: "B.Ed", duration: "2 years", fees: 36000 },
    ],
    placements: [],
  },
  {
    name: "Dr. Bhimrao Ambedkar University",
    location: "Agra, Uttar Pradesh",
    established: 1927,
    fees: 22000,
    rating: 4.0,
    kind: "multi",
    description:
      "Dr. Bhimrao Ambedkar University, formerly Agra University, was founded on 1 July 1927. It is a NAAC A+ accredited state university in Agra with a large network of affiliated colleges.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 22000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 26000 },
      { name: "B.Com", duration: "3 years", fees: 24000 },
      { name: "MA", duration: "2 years", fees: 28000 },
      { name: "M.Sc", duration: "2 years", fees: 32000 },
      { name: "MBA", duration: "2 years", fees: 95000 },
      { name: "B.Ed", duration: "2 years", fees: 36000 },
    ],
    placements: [],
  },
  {
    name: "Dayalbagh Educational Institute",
    location: "Agra, Uttar Pradesh",
    established: 1973,
    fees: 28000,
    rating: 4.2,
    kind: "arts",
    description:
      "Dayalbagh Educational Institute, registered in 1973 and declared a deemed-to-be university in 1981, is a UGC-recognised institution in Dayalbagh, Agra, offering engineering, commerce, education and sciences.",
    courses: [
      { name: "B.Tech (Gandhian / Systems Streams)", duration: "4 years", fees: 120000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 30000 },
      { name: "B.Com", duration: "3 years", fees: 32000 },
      { name: "BA (Any faculty)", duration: "3 years", fees: 28000 },
      { name: "B.Ed", duration: "2 years", fees: 40000 },
      { name: "MBA", duration: "2 years", fees: 100000 },
    ],
    placements: [],
  },
  {
    name: "St. John's College",
    location: "Agra, Uttar Pradesh",
    established: 1850,
    fees: 24000,
    rating: 4.1,
    kind: "arts",
    description:
      "St. John's College, established in 1850 by the Church Missionary Society and affiliated to Dr. Bhimrao Ambedkar University, is a constituent Christian college in Agra offering arts, science and commerce.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 24000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 28000 },
      { name: "B.Com", duration: "3 years", fees: 26000 },
      { name: "BBA", duration: "3 years", fees: 65000 },
      { name: "MA", duration: "2 years", fees: 28000 },
      { name: "M.Sc", duration: "2 years", fees: 32000 },
    ],
    placements: [],
  },
  {
    name: "Raja Balwant Singh Engineering Technical Campus",
    location: "Agra, Uttar Pradesh",
    established: null,
    fees: 98000,
    rating: 3.8,
    kind: "tech",
    description:
      "Raja Balwant Singh Engineering Technical Campus at Bichpuri, Agra, run by the Balwant Educational Society, is an AKTU-affiliated engineering campus offering B.Tech, MBA and MCA. The campus's founding year is not officially confirmed and is therefore not listed.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 100000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 98000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 98000 },
      { name: "B.Pharm", duration: "4 years", fees: 88000 },
      { name: "MCA", duration: "3 years", fees: 75000 },
      { name: "MBA", duration: "2 years", fees: 105000 },
    ],
    placements: [
      { year: 2024, avg: 6.2, high: 22, rate: 75 },
      { year: 2023, avg: 5.8, high: 19, rate: 72 },
    ],
  },
  {
    name: "Anand Engineering College",
    location: "Agra, Uttar Pradesh",
    established: 1998,
    fees: 105000,
    rating: 3.8,
    kind: "tech",
    description:
      "Anand Engineering College, established in 1998 at Keetham near Agra, is an AICTE-approved, AKTU-affiliated institute offering engineering and management programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 108000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 105000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 105000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 103000 },
      { name: "MCA", duration: "3 years", fees: 80000 },
      { name: "MBA", duration: "2 years", fees: 110000 },
    ],
    placements: [
      { year: 2024, avg: 6.3, high: 22, rate: 75 },
      { year: 2023, avg: 5.9, high: 19, rate: 72 },
    ],
  },

  // ---------- Bareilly (5) ----------
  {
    name: "Mahatma Jyotiba Phule Rohilkhand University",
    location: "Bareilly, Uttar Pradesh",
    established: 1975,
    fees: 20000,
    rating: 4.0,
    kind: "multi",
    description:
      "Mahatma Jyotiba Phule Rohilkhand University, established in 1975, is the affiliating state university for the Rohilkhand region in Bareilly, offering campus programmes in arts, science, commerce and management.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
      { name: "MBA", duration: "2 years", fees: 95000 },
      { name: "B.Ed", duration: "2 years", fees: 36000 },
    ],
    placements: [],
  },
  {
    name: "Bareilly College",
    location: "Bareilly, Uttar Pradesh",
    established: 1837,
    fees: 20000,
    rating: 4.0,
    kind: "arts",
    description:
      "Bareilly College, established in 1837, is a NAAC A accredited premier institution of M.J.P. Rohilkhand University offering undergraduate, postgraduate and doctoral programmes.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "BCA", duration: "3 years", fees: 46000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Com", duration: "2 years", fees: 28000 },
      { name: "M.Sc", duration: "2 years", fees: 31000 },
    ],
    placements: [],
  },
  {
    name: "Invertis University",
    location: "Bareilly, Uttar Pradesh",
    established: 2010,
    fees: 130000,
    rating: 3.9,
    kind: "tech",
    description:
      "Invertis University is a UGC-recognised private university in Bareilly established in 2010, offering engineering, management, law, pharmacy, science and journalism programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 135000 },
      { name: "BBA", duration: "3 years", fees: 100000 },
      { name: "B.Tech (Artificial Intelligence)", duration: "4 years", fees: 140000 },
      { name: "BBA LL.B.", duration: "5 years", fees: 140000 },
      { name: "B.Pharm", duration: "4 years", fees: 120000 },
      { name: "BCA", duration: "3 years", fees: 90000 },
      { name: "BA (Journalism and Mass Communication)", duration: "3 years", fees: 80000 },
    ],
    placements: [
      { year: 2024, avg: 6.9, high: 26, rate: 78 },
      { year: 2023, avg: 6.4, high: 23, rate: 75 },
    ],
  },
  {
    name: "Rohilkhand Medical College & Hospital",
    location: "Bareilly, Uttar Pradesh",
    established: 2006,
    fees: 1400000,
    rating: 4.0,
    kind: "medical",
    description:
      "Rohilkhand Medical College & Hospital, established in 2006, is a constituent college of Bareilly International University and an NMC-recognised private medical college in Bareilly offering MBBS and postgraduate medical programmes.",
    courses: [
      { name: "MBBS", duration: "5.5 years", fees: 1400000 },
      { name: "MD (Various Specialities)", duration: "3 years", fees: 1600000 },
      { name: "MS (Various Specialities)", duration: "3 years", fees: 1600000 },
      { name: "B.Sc Nursing", duration: "4 years", fees: 120000 },
    ],
    placements: [],
  },
  {
    name: "SRMS College of Engineering & Technology",
    location: "Bareilly, Uttar Pradesh",
    established: 1996,
    fees: 115000,
    rating: 3.9,
    kind: "tech",
    description:
      "SRMS College of Engineering & Technology, run by the Shri Ram Murti Smarak Trust and chartered in 1996, is an AKTU-affiliated engineering college in Bareilly offering engineering, pharmacy and management.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 118000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 115000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 115000 },
      { name: "B.Pharm", duration: "4 years", fees: 100000 },
      { name: "MCA", duration: "3 years", fees: 85000 },
      { name: "MBA", duration: "2 years", fees: 125000 },
    ],
    placements: [
      { year: 2024, avg: 7.0, high: 25, rate: 78 },
      { year: 2023, avg: 6.4, high: 21, rate: 74 },
    ],
  },

  // ---------- Noida / Greater Noida (6) ----------
  {
    name: "Jaypee Institute of Information Technology",
    location: "Noida, Uttar Pradesh",
    established: 2001,
    fees: 260000,
    rating: 4.2,
    kind: "tech",
    description:
      "Jaypee Institute of Information Technology, established in 2001 and declared a deemed-to-be university in 2004, is a technology-focused institute in Noida known for B.Tech, M.Tech and research programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 265000 },
      { name: "B.Tech Information Technology", duration: "4 years", fees: 260000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 255000 },
      { name: "BBA", duration: "3 years", fees: 160000 },
      { name: "M.Tech", duration: "2 years", fees: 130000 },
      { name: "MBA", duration: "2 years", fees: 240000 },
    ],
    placements: [
      { year: 2024, avg: 12.6, high: 44, rate: 90 },
      { year: 2023, avg: 11.8, high: 40, rate: 88 },
      { year: 2022, avg: 11.0, high: 36, rate: 86 },
    ],
  },
  {
    name: "JSS Academy of Technical Education",
    location: "Noida, Uttar Pradesh",
    established: 1998,
    fees: 120000,
    rating: 4.1,
    kind: "tech",
    description:
      "JSS Academy of Technical Education, Noida, established in 1998 under JSS Mahavidyapeetha, is an AKTU-affiliated engineering college in central Noida with NBA-accredited programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 125000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 122000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 120000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 120000 },
      { name: "MCA", duration: "3 years", fees: 90000 },
      { name: "MBA", duration: "2 years", fees: 120000 },
    ],
    placements: [
      { year: 2024, avg: 8.4, high: 30, rate: 85 },
      { year: 2023, avg: 7.8, high: 27, rate: 83 },
      { year: 2022, avg: 7.2, high: 24, rate: 80 },
    ],
  },
  {
    name: "Galgotias University",
    location: "Greater Noida, Uttar Pradesh",
    established: 2011,
    fees: 195000,
    rating: 4.0,
    kind: "tech",
    description:
      "Galgotias University, established under the Galgotias University Uttar Pradesh Act 14 of 2011, is a private university in Greater Noida offering engineering, law, management, pharmacy and humanities.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 210000 },
      { name: "B.Tech (Artificial Intelligence and Data Science)", duration: "4 years", fees: 220000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 195000 },
      { name: "B.Com (Hons)", duration: "3 years", fees: 120000 },
      { name: "B.Pharm", duration: "4 years", fees: 130000 },
      { name: "BBA LL.B.", duration: "5 years", fees: 160000 },
      { name: "MBA", duration: "2 years", fees: 220000 },
    ],
    placements: [
      { year: 2024, avg: 8.4, high: 32, rate: 84 },
      { year: 2023, avg: 7.7, high: 28, rate: 81 },
    ],
  },
  {
    name: "ITS Engineering College",
    location: "Greater Noida, Uttar Pradesh",
    established: 2006,
    fees: 110000,
    rating: 3.9,
    kind: "tech",
    description:
      "ITS Engineering College, established in 2006, is an AKTU-affiliated, NBA-accredited engineering institute in Greater Noida offering B.Tech and MBA programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 113000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 110000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 110000 },
      { name: "MCA", duration: "3 years", fees: 80000 },
      { name: "MBA", duration: "2 years", fees: 115000 },
    ],
    placements: [
      { year: 2024, avg: 7.5, high: 28, rate: 81 },
      { year: 2023, avg: 7.0, high: 26, rate: 78 },
    ],
  },
  {
    name: "GL Bajaj Institute of Technology and Management",
    location: "Greater Noida, Uttar Pradesh",
    established: 2005,
    fees: 115000,
    rating: 3.9,
    kind: "tech",
    description:
      "GL Bajaj Institute of Technology and Management, established in 2005, is an AKTU-affiliated, NBA and NAAC accredited engineering college in Greater Noida.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 118000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 115000 },
      { name: "B.Tech (Artificial Intelligence)", duration: "4 years", fees: 122000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 115000 },
      { name: "BBA", duration: "3 years", fees: 85000 },
      { name: "MBA", duration: "2 years", fees: 120000 },
    ],
    placements: [
      { year: 2024, avg: 7.6, high: 28, rate: 82 },
      { year: 2023, avg: 7.1, high: 24, rate: 79 },
    ],
  },
  {
    name: "Galgotias College of Engineering and Technology",
    location: "Greater Noida, Uttar Pradesh",
    established: 2000,
    fees: 108000,
    rating: 3.8,
    kind: "tech",
    description:
      "Galgotias College of Engineering and Technology, established in 2000 by Smt. Shakuntla Educational and Welfare Society, is an AKTU-affiliated engineering college on the Greater Noida expressway.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 112000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 108000 },
      { name: "B.Tech Electrical Engineering", duration: "4 years", fees: 108000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 108000 },
      { name: "MCA", duration: "3 years", fees: 80000 },
      { name: "MBA", duration: "2 years", fees: 115000 },
    ],
    placements: [
      { year: 2024, avg: 7.2, high: 27, rate: 80 },
      { year: 2023, avg: 6.7, high: 24, rate: 77 },
    ],
  },

  // ---------- Ghaziabad (4) ----------
  {
    name: "KIET Group of Institutions",
    location: "Ghaziabad, Uttar Pradesh",
    established: 1998,
    fees: 160000,
    rating: 4.2,
    kind: "tech",
    description:
      "KIET, established in 1998 under the Krishna Charitable Society and conferred deemed university status in 2025, is a NAAC A+ accredited institution in Ghaziabad (Delhi NCR) offering engineering, pharmacy, management and computer applications.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 165000 },
      { name: "B.Tech (Artificial Intelligence and Data Science)", duration: "4 years", fees: 175000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 160000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 155000 },
      { name: "B.Pharm", duration: "4 years", fees: 135000 },
      { name: "BBA", duration: "3 years", fees: 120000 },
      { name: "MCA", duration: "3 years", fees: 100000 },
      { name: "MBA", duration: "2 years", fees: 160000 },
    ],
    placements: [
      { year: 2024, avg: 9.4, high: 34, rate: 90 },
      { year: 2023, avg: 8.8, high: 30, rate: 87 },
      { year: 2022, avg: 8.0, high: 27, rate: 84 },
    ],
  },
  {
    name: "ABES Engineering College",
    location: "Ghaziabad, Uttar Pradesh",
    established: 2000,
    fees: 130000,
    rating: 4.0,
    kind: "tech",
    description:
      "ABES Engineering College, established in 2000 under the Society for Educational Excellence, is an autonomous, NAAC A accredited engineering college in Ghaziabad on NH-09.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 134000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 130000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 130000 },
      { name: "BCA", duration: "3 years", fees: 95000 },
      { name: "MCA", duration: "3 years", fees: 90000 },
      { name: "MBA", duration: "2 years", fees: 120000 },
    ],
    placements: [
      { year: 2024, avg: 8.2, high: 30, rate: 86 },
      { year: 2023, avg: 7.7, high: 27, rate: 83 },
    ],
  },
  {
    name: "IMS Engineering College",
    location: "Ghaziabad, Uttar Pradesh",
    established: 2002,
    fees: 115000,
    rating: 3.9,
    kind: "tech",
    description:
      "IMS Engineering College, established in 2002 by the Institute of Management Studies Society, is a NAAC and NBA (IT) accredited AKTU-affiliated engineering college near Dasna, Ghaziabad.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 118000 },
      { name: "B.Tech Information Technology", duration: "4 years", fees: 116000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 115000 },
      { name: "MCA", duration: "3 years", fees: 82000 },
      { name: "MBA", duration: "2 years", fees: 118000 },
    ],
    placements: [
      { year: 2024, avg: 7.2, high: 26, rate: 80 },
      { year: 2023, avg: 6.7, high: 23, rate: 77 },
    ],
  },
  {
    name: "Institute of Management Technology Ghaziabad",
    location: "Ghaziabad, Uttar Pradesh",
    established: 1980,
    fees: 550000,
    rating: 4.4,
    kind: "business",
    description:
      "Institute of Management Technology (IMT) Ghaziabad, established in 1980 under the Lajpat Rai Educational Society, is an AACSB-accredited business school in Delhi NCR offering PGDM, FPM and executive programmes.",
    courses: [
      { name: "Post Graduate Diploma in Management (PGDM)", duration: "2 years", fees: 1100000 },
      { name: "PGDM (Executive)", duration: "15 months", fees: 1200000 },
      { name: "Fellow Programme in Management", duration: "4 years", fees: 120000 },
    ],
    placements: [
      { year: 2024, avg: 21.4, high: 72, rate: 97 },
      { year: 2023, avg: 20.2, high: 65, rate: 96 },
      { year: 2022, avg: 19.1, high: 58, rate: 95 },
      { year: 2021, avg: 18.0, high: 52, rate: 94 },
    ],
  },

  // ---------- Meerut (6) ----------
  {
    name: "Chaudhary Charan Singh University",
    location: "Meerut, Uttar Pradesh",
    established: 1965,
    fees: 20000,
    rating: 4.1,
    kind: "multi",
    description:
      "Chaudhary Charan Singh University, formerly Meerut University, was established in 1965 and is a major NAAC A++ accredited state university with a large affiliate network in western Uttar Pradesh.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "BCA", duration: "3 years", fees: 48000 },
      { name: "BBA", duration: "3 years", fees: 55000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 31000 },
      { name: "MBA", duration: "2 years", fees: 95000 },
    ],
    placements: [],
  },
  {
    name: "Meerut College",
    location: "Meerut, Uttar Pradesh",
    established: 1892,
    fees: 20000,
    rating: 4.1,
    kind: "arts",
    description:
      "Meerut College, established in 1892 and affiliated to Chaudhary Charan Singh University, is one of the largest and most historic government-aided colleges in western Uttar Pradesh.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
      { name: "B.Ed", duration: "2 years", fees: 36000 },
    ],
    placements: [],
  },
  {
    name: "Sardar Vallabhbhai Patel University of Agriculture and Technology",
    location: "Meerut, Uttar Pradesh",
    established: 2000,
    fees: 30000,
    rating: 3.9,
    kind: "agri",
    description:
      "SVPUAT, established on 2 October 2000 at Modipuram, Meerut, is a state agriculture university offering programmes in agriculture, horticulture, biotechnology and allied sciences.",
    courses: [
      { name: "B.Sc (Hons) Agriculture", duration: "4 years", fees: 32000 },
      { name: "B.Sc (Hons) Horticulture", duration: "4 years", fees: 32000 },
      { name: "B.Tech Agricultural Engineering", duration: "4 years", fees: 60000 },
      { name: "M.Sc Agriculture", duration: "2 years", fees: 40000 },
      { name: "Ph.D.", duration: "3 years", fees: 45000 },
    ],
    placements: [],
  },
  {
    name: "Swami Vivekanand Subharti University",
    location: "Meerut, Uttar Pradesh",
    established: 2008,
    fees: 1350000,
    rating: 4.0,
    kind: "medical",
    description:
      "Swami Vivekanand Subharti University, established in Meerut under UP Act No. 29 of 2008, is a UGC-recognised private university offering medical, dental, nursing, engineering, law and management programmes.",
    courses: [
      { name: "MBBS", duration: "5.5 years", fees: 1350000 },
      { name: "BDS", duration: "5 years", fees: 380000 },
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 140000 },
      { name: "B.Sc Nursing", duration: "4 years", fees: 135000 },
      { name: "BBA", duration: "3 years", fees: 90000 },
      { name: "LL.B", duration: "3 years", fees: 110000 },
      { name: "MBA", duration: "2 years", fees: 160000 },
    ],
    placements: [
      { year: 2024, avg: 7.4, high: 28, rate: 79 },
      { year: 2023, avg: 6.8, high: 25, rate: 76 },
    ],
  },
  {
    name: "IIMT Group of Colleges",
    location: "Meerut, Uttar Pradesh",
    established: 1994,
    fees: 110000,
    rating: 3.8,
    kind: "tech",
    description:
      "IIMT Group of Colleges, established in 1994, is a private college group with campuses in Meerut and Greater Noida offering engineering, management, pharmacy, law and education.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 112000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 110000 },
      { name: "B.Pharm", duration: "4 years", fees: 95000 },
      { name: "BBA", duration: "3 years", fees: 80000 },
      { name: "LL.B", duration: "3 years", fees: 105000 },
      { name: "MCA", duration: "3 years", fees: 78000 },
      { name: "MBA", duration: "2 years", fees: 120000 },
    ],
    placements: [
      { year: 2024, avg: 6.6, high: 24, rate: 78 },
      { year: 2023, avg: 6.1, high: 21, rate: 74 },
    ],
  },
  {
    name: "Meerut Institute of Engineering & Technology",
    location: "Meerut, Uttar Pradesh",
    established: 1997,
    fees: 120000,
    rating: 3.9,
    kind: "tech",
    description:
      "MIET is an AKTU-affiliated, NBA-accredited engineering college in Meerut established in 1997 by the City Educational & Social Welfare Society.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 123000 },
      { name: "B.Tech Electronics and Communication", duration: "4 years", fees: 120000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 120000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 118000 },
      { name: "MCA", duration: "3 years", fees: 85000 },
      { name: "MBA", duration: "2 years", fees: 125000 },
    ],
    placements: [
      { year: 2024, avg: 7.3, high: 27, rate: 81 },
      { year: 2023, avg: 6.7, high: 23, rate: 78 },
    ],
  },

  // ---------- Other Uttar Pradesh cities (10) ----------
  {
    name: "Aligarh Muslim University",
    location: "Aligarh, Uttar Pradesh",
    established: 1920,
    fees: 30000,
    rating: 4.4,
    kind: "multi",
    description:
      "Aligarh Muslim University, founded as MAO College in 1875 and established as a university in 1920, is a central university in Aligarh offering engineering, medicine, law, science and humanities.",
    courses: [
      { name: "BA (Arts / Social Sciences)", duration: "3 years", fees: 30000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 34000 },
      { name: "B.Com", duration: "3 years", fees: 32000 },
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 110000 },
      { name: "MBBS", duration: "5.5 years", fees: 95000 },
      { name: "LL.B", duration: "3 years", fees: 38000 },
      { name: "M.Sc", duration: "2 years", fees: 38000 },
      { name: "MBA", duration: "2 years", fees: 120000 },
    ],
    placements: [
      { year: 2024, avg: 10.8, high: 40, rate: 80 },
      { year: 2023, avg: 10.1, high: 36, rate: 78 },
    ],
  },
  {
    name: "Rajkiya Engineering College Azamgarh",
    location: "Azamgarh, Uttar Pradesh",
    established: 2010,
    fees: 100000,
    rating: 3.9,
    kind: "tech",
    description:
      "Rajkiya Engineering College Azamgarh is a government engineering college established by the Government of Uttar Pradesh in 2010, AICTE-approved and AKTU-affiliated, offering B.Tech in Information Technology, Mechanical and Civil Engineering at Deogaon, Azamgarh.",
    courses: [
      { name: "B.Tech Information Technology", duration: "4 years", fees: 105000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 100000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 100000 },
    ],
    placements: [
      { year: 2024, avg: 7.4, high: 26, rate: 78 },
      { year: 2023, avg: 6.9, high: 23, rate: 75 },
    ],
  },
  {
    name: "Rajkiya Engineering College Sonbhadra",
    location: "Sonbhadra, Uttar Pradesh",
    established: 2015,
    fees: 100000,
    rating: 3.9,
    kind: "tech",
    description:
      "Rajkiya Engineering College Sonbhadra is a government engineering college established in 2015 by the Government of Uttar Pradesh at Churk, Robertsganj, Sonbhadra, offering B.Tech in Computer Science, Electrical, Electronics and Mining Engineering.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 105000 },
      { name: "B.Tech Electrical Engineering", duration: "4 years", fees: 100000 },
      { name: "B.Tech Electronics Engineering", duration: "4 years", fees: 100000 },
      { name: "B.Tech Mining Engineering", duration: "4 years", fees: 100000 },
    ],
    placements: [
      { year: 2024, avg: 7.0, high: 25, rate: 76 },
      { year: 2023, avg: 6.5, high: 22, rate: 73 },
    ],
  },
  {
    name: "GLA University",
    location: "Mathura, Uttar Pradesh",
    established: 2010,
    fees: 185000,
    rating: 4.1,
    kind: "tech",
    description:
      "GLA University is a NAAC A+ accredited private university in Mathura established under UP Act 21 of 2010, offering engineering, management, pharmacy, education and sciences.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 190000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 185000 },
      { name: "B.Pharm", duration: "4 years", fees: 150000 },
      { name: "BBA", duration: "3 years", fees: 120000 },
      { name: "B.Ed", duration: "2 years", fees: 80000 },
      { name: "MBA", duration: "2 years", fees: 195000 },
    ],
    placements: [
      { year: 2024, avg: 8.4, high: 32, rate: 85 },
      { year: 2023, avg: 7.8, high: 28, rate: 82 },
    ],
  },
  {
    name: "Bundelkhand University",
    location: "Jhansi, Uttar Pradesh",
    established: 1975,
    fees: 20000,
    rating: 3.9,
    kind: "multi",
    description:
      "Bundelkhand University is a state university in Jhansi established on 26 August 1975, serving the Bundelkhand region and offering programmes in arts, science, engineering, law and management.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "BBA", duration: "3 years", fees: 55000 },
      { name: "LL.B", duration: "3 years", fees: 32000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
      { name: "MBA", duration: "2 years", fees: 90000 },
    ],
    placements: [],
  },
  {
    name: "Rani Lakshmi Bai Central Agricultural University",
    location: "Jhansi, Uttar Pradesh",
    established: 2014,
    fees: 35000,
    rating: 3.9,
    kind: "agri",
    description:
      "Rani Lakshmi Bai Central Agricultural University, established by an Act of Parliament in 2014, is a central agricultural university in Jhansi serving the Bundelkhand region with education, research and extension.",
    courses: [
      { name: "B.Sc (Hons) Agriculture", duration: "4 years", fees: 40000 },
      { name: "B.Tech Agricultural Engineering", duration: "4 years", fees: 60000 },
      { name: "M.Sc Agriculture", duration: "2 years", fees: 50000 },
      { name: "Ph.D.", duration: "3 years", fees: 55000 },
    ],
    placements: [],
  },
  {
    name: "Teerthanker Mahaveer University",
    location: "Moradabad, Uttar Pradesh",
    established: 2008,
    fees: 1300000,
    rating: 3.9,
    kind: "medical",
    description:
      "Teerthanker Mahaveer University, established under UP Act No. 30 of 2008, is a Jain minority private university in Moradabad offering medical, dental, engineering, law and management programmes.",
    courses: [
      { name: "MBBS", duration: "5.5 years", fees: 1300000 },
      { name: "BDS", duration: "5 years", fees: 360000 },
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 145000 },
      { name: "BBA", duration: "3 years", fees: 95000 },
      { name: "BBA LL.B.", duration: "5 years", fees: 120000 },
      { name: "B.Pharm", duration: "4 years", fees: 120000 },
      { name: "MBA", duration: "2 years", fees: 155000 },
    ],
    placements: [
      { year: 2024, avg: 7.1, high: 27, rate: 79 },
      { year: 2023, avg: 6.6, high: 23, rate: 76 },
    ],
  },
  {
    name: "Kamla Nehru Institute of Technology",
    location: "Sultanpur, Uttar Pradesh",
    established: 1976,
    fees: 90000,
    rating: 4.2,
    kind: "tech",
    description:
      "KNIT Sultanpur is a state government, autonomous engineering institute in Sultanpur established in 1976, affiliated to AKTU and known for B.Tech, M.Tech and MCA programmes.",
    courses: [
      { name: "B.Tech Computer Science and Engineering", duration: "4 years", fees: 95000 },
      { name: "B.Tech Information Technology", duration: "4 years", fees: 90000 },
      { name: "B.Tech Electronics Engineering", duration: "4 years", fees: 90000 },
      { name: "B.Tech Electrical Engineering", duration: "4 years", fees: 90000 },
      { name: "B.Tech Mechanical Engineering", duration: "4 years", fees: 90000 },
      { name: "B.Tech Civil Engineering", duration: "4 years", fees: 90000 },
      { name: "MCA", duration: "3 years", fees: 65000 },
    ],
    placements: [
      { year: 2024, avg: 9.2, high: 33, rate: 86 },
      { year: 2023, avg: 8.7, high: 30, rate: 84 },
      { year: 2022, avg: 8.1, high: 27, rate: 82 },
    ],
  },
  {
    name: "Dr. Ram Manohar Lohia Avadh University",
    location: "Ayodhya, Uttar Pradesh",
    established: 1975,
    fees: 20000,
    rating: 3.9,
    kind: "multi",
    description:
      "Dr. Ram Manohar Lohia Avadh University, established on 4 March 1975, is a state affiliating-cum-residential university in Ayodhya serving the Awadh region.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
      { name: "B.Ed", duration: "2 years", fees: 36000 },
    ],
    placements: [],
  },
  {
    name: "Veer Bahadur Singh Purvanchal University",
    location: "Jaunpur, Uttar Pradesh",
    established: 1987,
    fees: 20000,
    rating: 3.9,
    kind: "multi",
    description:
      "Veer Bahadur Singh Purvanchal University, established on 2 October 1987, is a state university in Jaunpur serving eastern Uttar Pradesh with a large network of affiliated colleges.",
    courses: [
      { name: "BA (Any faculty)", duration: "3 years", fees: 20000 },
      { name: "B.Sc (Science Streams)", duration: "3 years", fees: 24000 },
      { name: "B.Com", duration: "3 years", fees: 22000 },
      { name: "MA", duration: "2 years", fees: 26000 },
      { name: "M.Sc", duration: "2 years", fees: 30000 },
      { name: "B.Ed", duration: "2 years", fees: 36000 },
    ],
    placements: [],
  },
];

const balancedColleges: CollegeSeed[] = colleges.map((college) => ({
  ...college,
  rating: ratingOverrides[college.name] ?? college.rating,
}));

// ---------- seed ----------

async function main() {
  // Seeds must never destroy an existing database. Schema changes belong in a
  // Prisma migration; re-running this demo loader against populated data is
  // intentionally rejected so colleges, users, and saved items stay intact.
  const existingRecords = await Promise.all([
    prisma.user.count(),
    prisma.college.count(),
    prisma.course.count(),
    prisma.placement.count(),
    prisma.review.count(),
    prisma.savedCollege.count(),
    prisma.savedComparison.count(),
    prisma.savedComparisonCollege.count(),
  ]);

  if (existingRecords.some((count) => count > 0)) {
    throw new Error(
      "Refusing to seed a non-empty database. Create a fresh database for demo data; do not use db:seed to update existing data."
    );
  }

  console.log("Seeding demo user...");
  const passwordHash = await bcrypt.hash("password123", 10);
  const demoUser = await prisma.user.create({
    data: { email: "demo@collegehub.test", name: "CollegeHub Demo User", passwordHash },
  });

  const sampleUsers = new Map<string, string>();
  for (const user of SAMPLE_USERS) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: { email: user.email, name: user.name, passwordHash },
    });
    sampleUsers.set(user.name, created.id);
  }
  void demoUser;

  console.log(`Seeding ${balancedColleges.length} colleges...`);
  const ratingMin = Math.round(Math.min(...balancedColleges.map((c) => c.rating)));
  const ratingMax = Math.round(Math.max(...balancedColleges.map((c) => c.rating)));
  console.log(`Ratings range: ${ratingMin}.0 - ${ratingMax}.0`);

  for (const c of balancedColleges) {
    const courseNames = new Set<string>();
    for (const course of c.courses) {
      if (courseNames.has(course.name)) {
        throw new Error(`Duplicate course "${course.name}" for ${c.name}`);
      }
      courseNames.add(course.name);
    }

    const placementYears = new Set<number>();
    for (const p of c.placements) {
      if (placementYears.has(p.year)) {
        throw new Error(`Duplicate placement year ${p.year} for ${c.name}`);
      }
      placementYears.add(p.year);
    }

    const college = await prisma.college.create({
      data: {
        slug: slugify(c.name),
        name: c.name,
        location: c.location,
        established: c.established,
        fees: c.fees,
        rating: c.rating,
        description: `${c.description} ${DEMO_DATA_NOTE}`,
        courses: {
          create: c.courses.map((course) => ({
            name: course.name,
            duration: course.duration,
            fees: course.fees,
          })),
        },
        placements: {
          create: c.placements.map((p) => ({
            year: p.year,
            avgPackage: L(p.avg),
            highestPackage: L(p.high),
            placementRate: p.rate,
          })),
        },
      },
    });

    for (const review of buildReviews(c)) {
      const userId = sampleUsers.get(SAMPLE_USERS[review.userIndex].name);
      if (!userId) continue;
      await prisma.review.create({
        data: {
          collegeId: college.id,
          userId,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
        },
      });
    }
  }

  const collegeCount = await prisma.college.count();
  const courseCount = await prisma.course.count();
  const placementCount = await prisma.placement.count();
  const reviewCount = await prisma.review.count();
  const userCount = await prisma.user.count();
  console.log(
    `Done: ${collegeCount} colleges, ${courseCount} courses, ${placementCount} placements, ${reviewCount} reviews, ${userCount} users.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
