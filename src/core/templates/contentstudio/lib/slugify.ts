function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-");
}
function handleSlugifyError(error) {
  try {
    console.error("[slugify]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  slugify
};
