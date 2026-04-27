import { redirect } from "next/navigation";

export default function RecommendationsIndexPage() {
  redirect("/recommendations/1?metric=pearson");
}
