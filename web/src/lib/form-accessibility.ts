import type { MouseEvent as ReactMouseEvent } from "react";

let initialized = false;

/**
 * Synchronizes programmatic `aria-invalid` state with native CSS `:user-invalid`
 * and provides a WeakMap-backed `.user-invalid-fallback` class for browsers
 * without `:user-invalid` support.
 */
export function initFormValidationAccessibility(): void {
  if (initialized || typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  initialized = true;

  const supportsUserInvalid = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("selector(:user-invalid)");

  if (supportsUserInvalid) {
    const updateAriaState = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches("input, textarea, select")) {
        return;
      }

      if (target.matches(":user-invalid")) {
        target.setAttribute("aria-invalid", "true");
      } else {
        target.removeAttribute("aria-invalid");
      }
    };

    document.addEventListener("blur", updateAriaState, true);
    document.addEventListener("focus", updateAriaState, true);
    document.addEventListener(
      "input",
      (event: Event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.getAttribute("aria-invalid") === "true") {
          updateAriaState(event);
        }
      },
      true,
    );
    return;
  }

  const dirtyState = new WeakMap<Element, { hasInteracted: boolean; hasBlurred: boolean }>();

  const updateFallbackState = (input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    const isValid = input.checkValidity();
    input.classList.toggle("user-invalid-fallback", !isValid);
    input.classList.toggle("user-valid-fallback", isValid);

    if (!isValid) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  };

  const handleFallbackEvent = (event: Event) => {
    const target = event.target;

    if (event.type === "reset" && target instanceof HTMLFormElement) {
      for (const control of Array.from(target.elements)) {
        dirtyState.delete(control);
        control.classList.remove("user-invalid-fallback", "user-valid-fallback");
        control.removeAttribute("aria-invalid");
      }
      return;
    }

    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
    ) {
      return;
    }

    if (event.type === "input" || event.type === "change") {
      const state = dirtyState.get(target) ?? { hasInteracted: false, hasBlurred: false };
      state.hasInteracted = true;
      dirtyState.set(target, state);
      if (state.hasBlurred) {
        updateFallbackState(target);
      }
    } else if (event.type === "blur") {
      const state = dirtyState.get(target) ?? { hasInteracted: false, hasBlurred: false };
      state.hasBlurred = true;
      dirtyState.set(target, state);
      if (state.hasInteracted) {
        updateFallbackState(target);
      }
    }
  };

  document.addEventListener("blur", handleFallbackEvent, true);
  document.addEventListener("input", handleFallbackEvent, true);
  document.addEventListener("change", handleFallbackEvent, true);
  document.addEventListener("reset", handleFallbackEvent, true);
}

/**
 * Fallback for `<dialog closedby="any">` in browsers (e.g., Safari) where
 * `closedBy` is not yet on `HTMLDialogElement.prototype`.
 */
export function handleDialogBackdropClickFallback(
  event: ReactMouseEvent<HTMLDialogElement>,
  onRequestClose: () => void,
): void {
  if (typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype) {
    return;
  }

  const dialog = event.currentTarget;
  if (event.target !== dialog) {
    return;
  }

  const rect = dialog.getBoundingClientRect();
  const isDialogContent =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!isDialogContent) {
    onRequestClose();
  }
}
