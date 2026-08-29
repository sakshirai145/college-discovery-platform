export type CollegeListItem = {
  id: string;
  slug: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  imageUrl: string | null;
  description: string;
};

export type CollegeListMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CollegeListResult = {
  data: CollegeListItem[];
  meta: CollegeListMeta;
};

export type CollegeCourse = {
  id: string;
  name: string;
  duration: string;
  fees: number;
};

export type CollegePlacement = {
  id: string;
  year: number;
  avgPackage: number;
  highestPackage: number;
  placementRate: number;
};

export type CollegeReview = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
  user: { id: string; name: string };
};

export type CollegeDetail = {
  id: string;
  slug: string;
  name: string;
  location: string;
  established: number | null;
  fees: number;
  rating: number;
  description: string;
  imageUrl: string | null;
  courses: CollegeCourse[];
  placements: CollegePlacement[];
  reviews: CollegeReview[];
};

export type CompareCollege = {
  id: string;
  slug: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  established: number | null;
  imageUrl: string | null;
  placements: CollegePlacement[];
  courses: { name: string; duration: string; fees: number }[];
};

export type CollegeSortKey = "rating" | "fees" | "name";
export type SortOrder = "asc" | "desc";

export type SavedCollegeItem = {
  id: string;
  college: CollegeListItem;
  createdAt: Date;
};

export type SavedCollegesResult = {
  data: SavedCollegeItem[];
  meta: CollegeListMeta;
};

export type SavedComparisonCollege = {
  id: string;
  collegeId: string;
  position: number;
  college: CompareCollege;
};

export type SavedComparison = {
  id: string;
  title: string | null;
  createdAt: Date;
  colleges: SavedComparisonCollege[];
};

export type SavedComparisonsResult = {
  data: SavedComparison[];
};

