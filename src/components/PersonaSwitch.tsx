import Link from "next/link";

type Persona = "admin" | "customer";

export function PersonaSwitch({ current }: { current: Persona }) {
  return (
    <div className="join" role="group" aria-label="View">
      <Link
        href="/admin"
        className={`btn btn-sm join-item ${
          current === "admin" ? "btn-primary" : "btn-ghost"
        }`}
        aria-current={current === "admin" ? "page" : undefined}
      >
        Admin view
      </Link>
      <Link
        href="/demo"
        className={`btn btn-sm join-item ${
          current === "customer" ? "btn-primary" : "btn-ghost"
        }`}
        aria-current={current === "customer" ? "page" : undefined}
      >
        Customer view
      </Link>
    </div>
  );
}
