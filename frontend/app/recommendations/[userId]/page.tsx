import { RecommendationsScreen } from "@/components/recommendations-screen";

export default async function UserRecommendationsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const numericUserId = Number.isFinite(Number(userId)) ? Number(userId) : 1;

  return <RecommendationsScreen userId={numericUserId} />;
}
