const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]), button:not([disabled]), select:not([disabled]), textarea:not([disabled])';

function caretAllows(el, dir) {
  if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") return true;
  let start = null;
  let end = null;
  try {
    start = el.selectionStart;
    end = el.selectionEnd;
  } catch {
    return true;
  }
  if (start === null || end === null) return true;
  return dir < 0 ? start === 0 : end === el.value.length;
}

export function useArrowNav() {
  return function onKeyDown(e) {
    const el = e.target;
    if (!el.matches?.(FOCUSABLE) || el.tagName === "SELECT") return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

    const vertical = !!el.closest(".pay") && el.tagName !== "TEXTAREA";
    const horizontal = e.key === "ArrowLeft" || e.key === "ArrowRight";
    const isVertical = vertical && (e.key === "ArrowUp" || e.key === "ArrowDown");
    if (!horizontal && !isVertical) return;

    const dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
    if (horizontal && !caretAllows(el, dir)) return;

    const scope = el.closest(".overlay") ?? e.currentTarget;
    const items = Array.from(scope.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null);
    const target = items[items.indexOf(el) + dir];
    if (!target) return;

    e.preventDefault();
    target.focus();
    if (target.tagName === "INPUT" && target.type !== "checkbox") target.select?.();
  };
}