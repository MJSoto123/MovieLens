import { GraphScreen } from "@/components/graph-screen";

export default async function GraphUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const numericUserId = Number.isFinite(Number(userId)) ? Number(userId) : 1;

  return <GraphScreen userId={numericUserId} />;
}
