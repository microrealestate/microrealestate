import { useEffect, useRef } from 'react';

const FoldUnfold = ({ open, onAnimationEnd, children }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    let timer;
    if (open) {
      contentRef.current.style.maxHeight = `${contentRef.current.scrollHeight}px`;
      onAnimationEnd?.();
    } else {
      contentRef.current.style.maxHeight = '0px';
      timer = setTimeout(() => {
        onAnimationEnd?.();
      }, 200);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [onAnimationEnd, open]);

  return (
    <div className="w-full">
      <div
        ref={contentRef}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: '0px' }}
      >
        {children}
      </div>
    </div>
  );
};

export default FoldUnfold;
