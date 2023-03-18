export function updateItems(updatedItem, items) {
  if (!items?.length) {
    return [updatedItem];
  }

  const index = items.findIndex((item) => item._id === updatedItem._id);
  if (index > -1) {
    return [
      ...items.slice(0, index),
      updatedItem,
      ...items.slice(index + 1, items.length),
    ];
  }

  return [...items, updatedItem];
}
