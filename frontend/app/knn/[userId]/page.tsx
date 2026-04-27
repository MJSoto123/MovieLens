import { KNNViewScreen } from "@/components/knn-screen";

export default async function KnnUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const numericUserId = Number.isFinite(Number(userId)) ? Number(userId) : 1;

  return <KNNViewScreen userId={numericUserId} />;
}
