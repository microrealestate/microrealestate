export default function useScroll() {
  const scrollY = (y) => {
    let attempts = 0;

    const restore = () => {
      window.scrollTo(0, y);
      // Stop once scroll actually worked
      if (window.scrollY >= y || attempts > 10) {
        return;
      }
      attempts++;
      requestAnimationFrame(restore);
    };

    restore();
  };

  return { scrollY };
}
