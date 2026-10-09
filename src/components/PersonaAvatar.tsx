import Image from "next/image";

export type PersonaKind = "admin" | "customer";

const PERSONA_SRC: Record<PersonaKind, { src: string; alt: string }> = {
  admin: { src: "/avatars/admin.jpg", alt: "Admin persona" },
  customer: { src: "/avatars/customer.jpg", alt: "Customer persona" },
};

export function PersonaAvatar({
  persona,
  active = false,
  size = "sm",
}: {
  persona: PersonaKind;
  active?: boolean;
  size?: "sm" | "md";
}) {
  const { src, alt } = PERSONA_SRC[persona];
  const dim = size === "md" ? "w-8 sm:w-9" : "w-6 sm:w-7";
  const px = size === "md" ? 36 : 28;

  return (
    <div className={`avatar ${active ? "online" : "offline"}`}>
      <div
        className={`${dim} rounded-full ring ring-offset-base-100 ring-offset-1 ${
          active ? "ring-primary" : "ring-base-300"
        }`}
      >
        <Image src={src} alt={alt} width={px} height={px} />
      </div>
    </div>
  );
}
