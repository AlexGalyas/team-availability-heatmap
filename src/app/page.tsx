import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Team Availability</h1>
      <Link href="/availability">Перейти до сітки доступності</Link>
    </main>
  );
}
