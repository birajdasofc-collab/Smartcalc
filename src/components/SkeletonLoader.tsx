import React from 'react';
import { motion } from 'motion/react';

export const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-zinc-50 p-4 pb-24">
      {/* Header Skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-200"></div>
          <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200"></div>
        </div>
        <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-3 h-10 w-10 animate-pulse rounded-2xl bg-zinc-100"></div>
            <div className="space-y-2">
              <div className="h-3 w-16 animate-pulse rounded-md bg-zinc-100"></div>
              <div className="h-6 w-24 animate-pulse rounded-md bg-zinc-200"></div>
            </div>
            {/* Shimmer Effect */}
            <motion.div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['100%', '-100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
          </div>
        ))}
      </div>

      {/* Action Buttons Skeleton */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-zinc-200"></div>
            <div className="h-3 w-12 animate-pulse rounded-md bg-zinc-100"></div>
          </div>
        ))}
      </div>

      {/* Recent Transactions Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded-md bg-zinc-200"></div>
          <div className="h-4 w-16 animate-pulse rounded-md bg-zinc-200"></div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-zinc-100"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-200"></div>
                <div className="h-3 w-16 animate-pulse rounded-md bg-zinc-100"></div>
              </div>
            </div>
            <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-200"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
