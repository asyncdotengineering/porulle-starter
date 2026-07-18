import type { ProductOption } from "@/lib/types";

// Availability is computed directly from the option set. The seed generates a
// full variant matrix with all combinations in stock, so every option value is
// selectable; refine this against per-variant inventory when surfacing real
// stock (a follow-up).
export function getAvailableOptionValues(
  options: ProductOption[],
  _encodedAvailability: string | undefined,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const option of options) {
    map.set(option.name, new Set(option.values.map((v) => v.name)));
  }
  return map;
}
