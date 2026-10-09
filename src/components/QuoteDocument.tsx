import { money } from "@/lib/format";
import type { BusinessSettings, Quote } from "@/lib/types";

type QuoteDocumentProps = {
  quote: Quote;
  settings: BusinessSettings;
  /** Optional line above the quote (used for the owner email copy). */
  preface?: string;
};

/** Shared estimate layout used by quote detail and the email inbox. */
export function QuoteDocument({
  quote,
  settings,
  preface,
}: QuoteDocumentProps) {
  return (
    <div className="space-y-4">
      {preface ? (
        <p className="text-sm text-base-content/80">{preface}</p>
      ) : null}

      <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
        {settings.disclaimer}
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
        <h2 className="font-display text-xl font-semibold">Customer</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-base-content/55">Email</dt>
            <dd>{quote.customerEmail}</dd>
          </div>
          <div>
            <dt className="text-base-content/55">Phone</dt>
            <dd>{quote.customerPhone || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-base-content/55">Job</dt>
            <dd className="mt-1">{quote.jobDescription}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
        <h2 className="font-display text-xl font-semibold">Line items</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((item) => (
                <tr key={item.sku}>
                  <td>
                    <div>{item.name}</div>
                    <div className="font-mono text-xs text-base-content/50">
                      {item.sku}
                    </div>
                  </td>
                  <td>
                    {item.quantity} {item.unit}
                  </td>
                  <td>{money(item.unitPrice)}</td>
                  <td>{money(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-right font-display text-2xl font-semibold">
          Total {money(quote.total)}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
          <h3 className="font-semibold">Assumptions</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {quote.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
          <h3 className="font-semibold">Not included</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {quote.exclusions.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
