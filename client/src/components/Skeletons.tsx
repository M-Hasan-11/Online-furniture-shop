const SK = "skeleton rounded-2xl";

const catalogSkeletonKeys = Array.from({ length: 8 }, (_, i) => `catalog-sk-${i}`);

export function CatalogSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      {catalogSkeletonKeys.map((key) => (
        <div key={key} className="flex flex-col gap-3">
          <div className={`${SK} aspect-[4/5]`} />
          <div className="flex items-center justify-between px-0.5">
            <div className={`${SK} h-4 w-16 rounded-full`} />
            <div className={`${SK} h-4 w-10 rounded-full`} />
          </div>
          <div className={`${SK} h-4 w-4/5 px-0.5`} style={{ borderRadius: "6px" }} />
          <div className={`${SK} h-3 w-full px-0.5`} style={{ borderRadius: "6px" }} />
          <div className={`${SK} h-3 w-3/5 px-0.5`} style={{ borderRadius: "6px" }} />
          <div className="flex items-center justify-between px-0.5 pt-1">
            <div className={`${SK} h-6 w-20`} style={{ borderRadius: "6px" }} />
            <div className={`${SK} h-8 w-24 rounded-full`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Image skeleton */}
        <div className={`${SK} aspect-square w-full`} />
        {/* Details skeleton */}
        <div className="flex flex-col gap-4" aria-hidden="true">
          <div className={`${SK} h-4 w-20 rounded-full`} />
          <div className={`${SK} h-10 w-4/5`} style={{ borderRadius: "8px" }} />
          <div className={`${SK} h-8 w-24`} style={{ borderRadius: "8px" }} />
          <div className={`${SK} h-3 w-full`} style={{ borderRadius: "6px" }} />
          <div className={`${SK} h-3 w-5/6`} style={{ borderRadius: "6px" }} />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className={`${SK} h-20 rounded-xl`} />
            <div className={`${SK} h-20 rounded-xl`} />
            <div className={`${SK} h-20 rounded-xl`} />
            <div className={`${SK} h-20 rounded-xl`} />
          </div>
          <div className="flex gap-3 mt-2">
            <div className={`${SK} h-12 flex-1 rounded-full`} />
            <div className={`${SK} h-12 flex-1 rounded-full`} />
          </div>
        </div>
      </div>
    </div>
  );
}
