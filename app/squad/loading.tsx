import { Skeleton } from "@/components/ui/skeleton";

export default function SquadLoading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </main>
  );
}
