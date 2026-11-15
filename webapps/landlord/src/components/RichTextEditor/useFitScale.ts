import { useCallback, useState } from 'react';

// transform on `.page-frame` only: layout, pagination and print stay unchanged

type Size = { width: number; height: number };

// ResizeObserver reports layout px, which a transform does not change
function useLayoutSize(): [
  (element: HTMLElement | null) => void,
  Size | undefined
] {
  const [size, setSize] = useState<Size>();
  const ref = useCallback((element: HTMLElement | null) => {
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize[0];
      setSize({
        width: box?.inlineSize ?? entry.contentRect.width,
        height: box?.blockSize ?? entry.contentRect.height
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}

// `gutter`: the page's side padding inside the scroller, on each side
export default function useFitScale(gutter: number) {
  const [scrollerRef, scrollerSize] = useLayoutSize();
  const [frameRef, frameSize] = useLayoutSize();
  const scale =
    scrollerSize && frameSize?.width
      ? Math.min(1, (scrollerSize.width - 2 * gutter) / frameSize.width)
      : 1;
  return { scale, scrollerRef, frameRef, frameSize };
}
