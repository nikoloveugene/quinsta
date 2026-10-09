import Link from "next/link";
import { PersonaAvatar, type PersonaKind } from "@/components/PersonaAvatar";

export function PersonaSwitch({ current }: { current: PersonaKind }) {
  return (
    <div className="join" role="group" aria-label="View">
      <Link
        href="/admin"
        className={`btn btn-sm join-item gap-2 pl-1.5 ${
          current === "admin" ? "btn-primary" : "btn-ghost"
        }`}
        aria-current={current === "admin" ? "page" : undefined}
      >
        <PersonaAvatar persona="admin" active={current === "admin"} />
        Admin view
      </Link>
      <Link
        href="/demo"
        className={`btn btn-sm join-item gap-2 pl-1.5 ${
          current === "customer" ? "btn-primary" : "btn-ghost"
        }`}
        aria-current={current === "customer" ? "page" : undefined}
      >
        <PersonaAvatar persona="customer" active={current === "customer"} />
        Customer view
      </Link>
    </div>
  );
}
