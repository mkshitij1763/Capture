import Link from "next/link";
import { CaptureForm } from "./capture-form";

export default function Home() {
  return (
    <main className="page">
      <div className="home-stack">
        <CaptureForm />
        <Link href="/review" className="nav-link">
          Review inbox
        </Link>
      </div>
    </main>
  );
}
