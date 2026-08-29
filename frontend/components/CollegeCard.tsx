import Link from "next/link";
import type { ReactNode } from "react";
import { formatCurrency, formatRating } from "@/lib/format";
import type { CollegeListItem } from "@collegehub/shared";

type CollegeCardProps = {
  college: CollegeListItem;
  action?: ReactNode;
};

export default function CollegeCard({ college, action }: CollegeCardProps) {
  return (
    <div className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
      <Link href={`/colleges/${college.id}`} className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight text-zinc-900 group-hover:text-indigo-600">
            {college.name}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-700">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                clipRule="evenodd"
              />
            </svg>
            {formatRating(college.rating)}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-zinc-400">
            <path
              fillRule="evenodd"
              d="m9.69 18.933.003.001a.75.75 0 0 0 .614 0l.003-.001.02-.009a2.69 2.69 0 0 0 .34-.198 8.97 8.97 0 0 0 1.011-.775c.43-.396 1.018-.99 1.594-1.76.578-.775 1.227-1.853 1.694-3.177C15.852 9.442 15 6.717 13.343 4.94 11.687 3.164 10.106 2.5 10 2.5c-.106 0-1.687.664-3.343 2.44-1.657 1.777-2.51 4.502-1.803 7.322.467 1.324 1.116 2.402 1.694 3.177.576.77 1.164 1.364 1.594 1.76a8.97 8.97 0 0 0 1.011.775 2.69 2.69 0 0 0 .36.198l.02.009Z"
              clipRule="evenodd"
            />
          </svg>
          {college.location}
        </p>
        <div className="mt-4 flex items-end justify-between border-t border-zinc-100 pt-3">
          <div>
            <p className="text-xs text-zinc-400">Annual fees</p>
            <p className="text-base font-semibold text-zinc-900">{formatCurrency(college.fees)}</p>
          </div>
          <span className="text-sm font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">
            View details →
          </span>
        </div>
      </Link>
      {action && <div className="mt-3 border-t border-zinc-100 pt-3">{action}</div>}
    </div>
  );
}
