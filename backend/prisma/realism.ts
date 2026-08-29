export const ratingOverrides: Record<string, number> = {
  "Dr. Shakuntala Misra National Rehabilitation University": 3.1,
  "Khwaja Moinuddin Chishti Language University": 3.2,
  "Mahatma Gandhi P.G. College": 3.2,
  "ITM GIDA, Gorakhpur": 3.3,
  "Anand Engineering College": 3.3,
  "Buddha Institute of Technology": 3.4,
  "Raja Balwant Singh Engineering Technical Campus": 3.4,
  "Shambhunath Institute of Engineering & Technology": 3.4,
  "Galgotias College of Engineering and Technology": 3.5,
  "IIMT Group of Colleges": 3.5,
  "Rajkiya Engineering College Sonbhadra": 3.5,
  "Era University": 3.5,
  "Invertis University": 3.6,
  "Dayanand Girls' Post Graduate College": 3.6,
  "Digvijai Nath Post Graduate College": 3.6,
};

export type CriticalReview = {
  rating: number;
  title: string;
  comment: string;
};

// Balanced sample perspectives for existing demo colleges. They are not
// verified testimonials and introduce trade-offs without adding new records.
export const criticalReviewOverrides: Record<string, CriticalReview> = {
  "ITM GIDA, Gorakhpur": { rating: 2, title: "Placement support needs to be more consistent", comment: "The programme has some helpful faculty, but placement activity felt uneven across branches. Students should plan for self-study, off-campus applications and internships rather than relying only on the campus process." },
  "Buddha Institute of Technology": { rating: 2, title: "Teaching quality varies by department", comment: "A few teachers were very supportive, while some subjects depended heavily on notes and self-study. Lab access also varied by semester, so prospective students should ask about their specific branch before deciding." },
  "Mahatma Gandhi P.G. College": { rating: 3, title: "Affordable, but career support is limited", comment: "The fees and core teaching make it a workable local option, but there were limited structured placement opportunities. It suits students who are comfortable building skills and career connections independently." },
  "Anand Engineering College": { rating: 2, title: "Facilities need more regular upkeep", comment: "The course coverage is adequate, but some shared labs and common facilities felt overdue for maintenance. The experience can be better for students who actively use external learning resources." },
  "Raja Balwant Singh Engineering Technical Campus": { rating: 3, title: "Practical exposure differs across branches", comment: "There are committed faculty members, but industry exposure and lab availability did not feel equally strong in every department. Check the current branch-level facilities and placement activity during admission." },
  "Shambhunath Institute of Engineering & Technology": { rating: 2, title: "Administration can be slow during peak periods", comment: "Classes were manageable, but paperwork and timetable changes sometimes took longer than expected. It is an affordable option, though students should be prepared to follow up on administrative requests." },
  "Galgotias College of Engineering and Technology": { rating: 3, title: "Crowded classes can limit individual attention", comment: "The campus has opportunities, but larger class sizes meant that individual mentoring depended on the department and initiative of the student. Joining clubs and project groups helps make better use of the experience." },
  "IIMT Group of Colleges": { rating: 3, title: "A mixed value experience", comment: "Some courses and faculty are engaging, but the overall experience can vary by programme. Visit the relevant department and ask current students about lab schedules, internships and support for your branch." },
  "Dr. Shakuntala Misra National Rehabilitation University": { rating: 3, title: "Strong purpose, uneven day-to-day facilities", comment: "The university's accessibility-focused mission is meaningful, but some everyday services and facilities felt inconsistent. Students who value the specialised programmes may find it worthwhile with realistic expectations." },
  "Khwaja Moinuddin Chishti Language University": { rating: 3, title: "Specialised courses, modest campus services", comment: "The language-focused academic offering is useful for committed learners, but campus services and broader career support felt limited. It is best suited to students with a clear language or academic pathway." },
};
