import { redirect } from "next/navigation";

export default function KnnIndexPage() {
  redirect("/knn/1?metric=pearson&k=10");
}
