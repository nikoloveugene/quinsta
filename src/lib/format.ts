export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function statusBadge(status: string): string {
  switch (status) {
    case "pending_approval":
      return "badge-warning";
    case "sent":
    case "approved":
      return "badge-success";
    case "rejected":
      return "badge-error";
    default:
      return "badge-ghost";
  }
}
