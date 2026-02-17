import { useEffect, useRef } from "react";

let activeLockCount = 0;
let lockedScrollY = 0;
let storedStyles: {
  overflow: string;
  position: string;
  width: string;
  top: string;
} | null = null;

function acquireBodyScrollLock() {
  if (typeof window === "undefined") {
    return;
  }

  if (activeLockCount === 0) {
    lockedScrollY = window.scrollY || 0;
    storedStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      top: document.body.style.top,
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${lockedScrollY}px`;
  }

  activeLockCount += 1;
}

function releaseBodyScrollLock() {
  if (typeof window === "undefined" || activeLockCount === 0) {
    return;
  }

  activeLockCount -= 1;

  if (activeLockCount > 0) {
    return;
  }

  const previousStyles = storedStyles;
  if (previousStyles) {
    document.body.style.overflow = previousStyles.overflow;
    document.body.style.position = previousStyles.position;
    document.body.style.width = previousStyles.width;
    document.body.style.top = previousStyles.top;
  } else {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.top = "";
  }

  storedStyles = null;
  window.scrollTo(0, lockedScrollY);
}

export function useBodyScrollLock(locked: boolean) {
  const appliedRef = useRef(false);

  useEffect(() => {
    if (locked && !appliedRef.current) {
      acquireBodyScrollLock();
      appliedRef.current = true;
    }

    if (!locked && appliedRef.current) {
      releaseBodyScrollLock();
      appliedRef.current = false;
    }

    return () => {
      if (appliedRef.current) {
        releaseBodyScrollLock();
        appliedRef.current = false;
      }
    };
  }, [locked]);
}
