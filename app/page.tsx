import Link from "next/link";
import { CaptureForm } from "./capture-form";

export default function Home() {
  return (
    <main className="page">
      <div className="home-stack">
        <CaptureForm />
        <div className="nav-row">
          <Link href="/review" className="nav-link">
            Review inbox
          </Link>
          <Link href="/lists" className="nav-link">
            Lists
          </Link>
        </div>
      </div>
    </main>
  );
}
