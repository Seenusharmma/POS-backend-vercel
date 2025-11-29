import { motion } from "framer-motion";
import Skeleton from "./Skeleton";

const MenuSkeleton = ({ count = 10 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.05,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="flex flex-col"
        >
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md overflow-hidden">
            {/* Image Skeleton */}
            <div className="relative">
              <Skeleton className="w-full h-36 sm:h-40 rounded-none" variant="rectangular" />
              
              {/* Badge Skeleton */}
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                <Skeleton className="w-12 h-5 rounded-md" />
              </div>
              
              {/* Title Skeleton on Gradient */}
              <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-3 sm:pb-4">
                <Skeleton className="h-5 w-3/4 rounded-md" />
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="px-3 sm:px-4 pt-2 pb-3 sm:pb-4 flex flex-col">
              {/* Category and Rating Skeleton */}
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              
              {/* Price and Button Skeleton */}
              <div className="flex justify-between items-center mt-auto pt-1">
                <div>
                  <Skeleton className="h-5 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MenuSkeleton;

