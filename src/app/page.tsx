import { redirect } from "next/navigation";

// The middleware already ensures only authenticated users reach this page
// (unauthenticated visitors are redirected to /login before this renders).
export default function RootPage() {
  redirect("/dossiers");
}
