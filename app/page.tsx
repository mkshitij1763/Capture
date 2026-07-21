import { CaptureForm } from "./capture-form";

export default function Home() {
  return (
    <main className="capture-page">
      <div className="atmosphere" aria-hidden="true">
        <div className="atmosphere-blob atmosphere-blob-a" />
        <div className="atmosphere-blob atmosphere-blob-b" />
      </div>
      <div className="capture-shell">
        <CaptureForm />
      </div>
    </main>
  );
}
