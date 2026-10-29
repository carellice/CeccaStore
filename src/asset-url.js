export function assetUrl(value, base = import.meta.env?.BASE_URL || "/") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return value;
  }
  return `${base.replace(/\/?$/, "/")}${value.slice(1)}`;
}
