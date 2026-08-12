import React, { useState, useMemo } from "react";
import { Search, Filter, BookOpen, Star, RefreshCw, Bookmark } from "lucide-react";
import type { Course, CourseReview } from "../lib/types";
import { formatMoney } from "../lib/utils";

interface CoursesProps {
  courses: Course[];
  reviews?: CourseReview[];
  wishlist: string[];
  onToggleWishlist: (courseId: string) => void;
  onOpenCourse: (course: Course) => void;
  thematicAreas: string[];
}

export default function Courses({
  courses,
  reviews = [],
  wishlist,
  onToggleWishlist,
  onOpenCourse,
  thematicAreas,
}: CoursesProps) {
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("All Thematic Areas");
  const [selectedMode, setSelectedMode] = useState("All Delivery Modes");
  const [selectedLevel, setSelectedLevel] = useState("All Skill Levels");
  const [sortBy, setSortBy] = useState("featured");

  // Average rating + count per course id
  const ratingByCourse = useMemo(() => {
    const acc: Record<string, { sum: number; count: number }> = {};
    for (const r of reviews) {
      if (!acc[r.courseId]) acc[r.courseId] = { sum: 0, count: 0 };
      acc[r.courseId].sum += r.rating;
      acc[r.courseId].count += 1;
    }
    const out: Record<string, { avg: number; count: number }> = {};
    for (const id in acc) out[id] = { avg: acc[id].sum / acc[id].count, count: acc[id].count };
    return out;
  }, [reviews]);

  // Options list
  const deliveryModes = [
    "All Delivery Modes",
    "Self-paced",
    "Instructor-led",
    "Virtual",
    "Physical",
    "Hybrid",
    "In-plant",
  ];
  const skillLevels = ["All Skill Levels", "Foundation", "Intermediate", "Advanced", "Executive"];

  // Filtering Logic
  const filteredCourses = courses.filter((course) => {
    if (course.status === "Archived") return false;
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.code.toLowerCase().includes(search.toLowerCase()) ||
      course.shortDescription.toLowerCase().includes(search.toLowerCase());

    const matchesArea =
      selectedArea === "All Thematic Areas" || course.thematicArea === selectedArea;

    const matchesMode =
      selectedMode === "All Delivery Modes" || course.deliveryModes.includes(selectedMode as any);

    const matchesLevel =
      selectedLevel === "All Skill Levels" || course.level === selectedLevel;

    return matchesSearch && matchesArea && matchesMode && matchesLevel;
  });

  // Sorting
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating") return (ratingByCourse[b.id]?.avg || 0) - (ratingByCourse[a.id]?.avg || 0);
    // featured (default): featured first
    return Number(b.featured) - Number(a.featured);
  });

  const handleClearFilters = () => {
    setSearch("");
    setSelectedArea("All Thematic Areas");
    setSelectedMode("All Delivery Modes");
    setSelectedLevel("All Skill Levels");
    setSortBy("featured");
  };

  return (
    <div className="section bg-white text-left min-h-[50rem]">
      {/* Page Header */}
      <div className="mb-10 max-w-3xl">
        <span className="eyebrow">Academic Catalog</span>
        <h1 className="mt-3 text-3xl font-extrabold text-lani-navy tracking-tight sm:text-4xl">
          Explore LANI Programmes
        </h1>
        <p className="mt-2 text-slate-500 text-sm leading-6">
          Find intermediate bootcamps, executive workshops, and professional prep courses designed by verified academic facilitators.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {/* Search Bar */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keyword, code, or topic..."
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-lani-blue focus:ring-2 focus:ring-lani-blue/10"
            />
          </div>

          {/* Area Filter */}
          <div className="relative">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-lani-navy outline-none"
            >
              <option>All Thematic Areas</option>
              {thematicAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Filter */}
          <div className="relative">
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-lani-navy outline-none"
            >
              {deliveryModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Level and Reset Row */}
        <div className="mt-4 flex flex-col gap-4 border-t border-slate-200/50 pt-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Filter size={14} className="text-slate-400" />
              Skill Level:
            </label>
            <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
              {skillLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold transition-all sm:flex-none ${
                    selectedLevel === lvl
                      ? "bg-lani-green text-white"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {lvl.replace("All ", "")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Sort:
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-lani-navy outline-none"
              >
                <option value="featured">Featured</option>
                <option value="rating">Top rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </label>

            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-lani-blue transition-colors"
            >
              <RefreshCw size={13} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-6 flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
        <span>Found {filteredCourses.length} learning modules</span>
        {wishlist.length > 0 && (
          <span className="text-lani-gold">
            {wishlist.length} saved in wishlist
          </span>
        )}
      </div>

      {/* Courses Grid */}
      {sortedCourses.length > 0 ? (
        <div className="course-grid">
          {sortedCourses.map((course) => {
            const isWished = wishlist.includes(course.id);
            const seatsLeft = Math.max(0, course.seats - course.enrolled);
            const rating = ratingByCourse[course.id];

            return (
              <article key={course.id} className="course-card relative">
                {/* Course Image */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded bg-white/95 px-2.5 py-1 text-[10px] font-bold text-lani-navy shadow uppercase">
                    {course.status}
                  </span>
                  
                  {/* Bookmark Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(course.id);
                    }}
                    className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg shadow-sm border transition-all ${
                      isWished
                        ? "bg-lani-gold border-lani-gold text-white scale-105"
                        : "bg-white border-slate-200 text-lani-navy hover:scale-105"
                    }`}
                  >
                    <Bookmark size={14} className={isWished ? "fill-white" : ""} />
                  </button>
                </div>

                {/* Course Details */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>{course.code}</span>
                    {course.featured && (
                      <span className="flex items-center gap-0.5 text-lani-gold">
                        <Star size={10} className="fill-lani-gold" />
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <h3
                    onClick={() => onOpenCourse(course)}
                    className="mt-3 text-lg font-bold leading-snug text-lani-navy hover:text-lani-green transition-colors cursor-pointer"
                  >
                    {course.title}
                  </h3>

                  {rating && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <span className="flex items-center gap-0.5 text-lani-gold">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={12} className={n <= Math.round(rating.avg) ? "fill-lani-gold" : "text-slate-300"} />
                        ))}
                      </span>
                      <span className="font-bold text-slate-600">{rating.avg.toFixed(1)}</span>
                      <span className="text-slate-400">({rating.count})</span>
                    </div>
                  )}
                  
                  <p className="mt-2.5 flex-1 text-xs leading-6 text-slate-500">
                    {course.shortDescription}
                  </p>

                  <div className="mt-4 grid gap-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
                    <span className="flex items-center gap-1.5">
                      <Star size={13} className="text-lani-green shrink-0" />
                      Level: <strong className="text-slate-700">{course.level}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-lani-blue shrink-0" />
                      Modes: <strong className="text-slate-700">{course.deliveryModes.join(", ")}</strong>
                    </span>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between text-xs">
                    <div>
                      <strong className="block text-base text-lani-navy font-extrabold">
                        {formatMoney(course.price)}
                      </strong>
                      <span className="text-[10px] text-slate-400">
                        {course.seats ? `${seatsLeft} seats left` : "Quote required"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenCourse(course)}
                      className="btn-primary min-h-9 px-4 py-2 text-xs"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center border border-slate-200 rounded-2xl bg-slate-50/50">
          <BookOpen className="mx-auto text-slate-300" size={48} />
          <h3 className="mt-4 text-lg font-bold text-lani-navy">No Courses Match Filters</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try resetting search keywords or expanding your dropdown criteria.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-6 btn-secondary text-xs px-4"
          >
            Clear Search filters
          </button>
        </div>
      )}
    </div>
  );
}
