export function getLocalizedName(product, language) {
  return language === "ur" && product?.nameUrdu ? product.nameUrdu : product?.name;
}

export function getLocalizedDescription(product, language) {
  return language === "ur" && product?.descriptionUrdu
    ? product.descriptionUrdu
    : product?.description;
}

export function getPrimaryMedia(product) {
  if (Array.isArray(product?.media) && product.media.length > 0) {
    return [...product.media].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
    )[0];
  }
  if (product?.image) return { url: product.image, type: "image" };
  return null;
}
