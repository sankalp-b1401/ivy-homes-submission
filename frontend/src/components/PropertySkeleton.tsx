import React from 'react';

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs flex flex-col h-full animate-pulse">
      <div className="h-56 bg-stone-200 relative" />
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="h-7 w-28 bg-stone-200 rounded-md" />
            <div className="h-5 w-20 bg-stone-200 rounded-md" />
          </div>
          <div className="h-4 w-40 bg-stone-200 rounded-md" />
          <div className="h-4 w-32 bg-stone-100 rounded-md" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-stone-100">
          <div className="h-8 bg-stone-100 rounded-md" />
          <div className="h-8 bg-stone-100 rounded-md" />
          <div className="h-8 bg-stone-100 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <PropertyCardSkeleton key={index} />
      ))}
    </div>
  );
}
