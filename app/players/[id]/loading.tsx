import { Skeleton } from "@/components/ui/skeleton";

export default function PlayerProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-40 w-40 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    </main>
  );
}
