import Image from "next/image";
import Link from "next/link";

type Persona = "admin" | "customer";

function PersonaAvatar({
  src,
  alt,
  active,
}: {
  src: string;
  alt: string;
  active: boolean;
}) {
  return (
    <div className={`avatar ${active ? "online" : "offline"}`}>
      <div
        className={`w-6 rounded-full ring ring-offset-base-100 ring-offset-1 sm:w-7 ${
          active ? "ring-primary" : "ring-base-300"
        }`}
      >
        <Image src={src} alt={alt} width={28} height={28} />
      </div>
    </div>
  );
}

export function PersonaSwitch({ current }: { current: Persona }) {
  return (
    <div className="join" role="group" aria-label="View">
      <Link
        href="/admin"
        className={`btn btn-sm join-item gap-2 pl-1.5 ${
          current === "admin" ? "btn-primary" : "btn-ghost"
        }`}
        aria-current={current === "admin" ? "page" : undefined}
      >
        <PersonaAvatar
          src="/avatars/admin.jpg"
          alt="Admin persona"
          active={current === "admin"}
        />
        Admin view
      </Link>
      <Link
        href="/demo"
        className={`btn btn-sm join-item gap-2 pl-1.5 ${
          current === "customer" ? "btn-primary" : "btn-ghost"
        }`}
        aria-current={current === "customer" ? "page" : undefined}
      >
        <PersonaAvatar
          src="/avatars/customer.jpg"
          alt="Customer persona"
          active={current === "customer"}
        />
        Customer view
      </Link>
    </div>
  );
}
