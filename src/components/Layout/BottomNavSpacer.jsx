/**
 * Reserves the space the floating bottom navigation covers.
 *
 * The mobile nav is a FIXED pill rendered by StudentLayout:
 *   bottom-3 (12px) + p-1.5 (6px) around 58px rows = ~70px tall
 * so it overlaps the last ~82px of the viewport.
 *
 * Any page whose last control is a button (Save Changes, Logout, submit)
 * needs one of these at the very bottom, otherwise that button sits under
 * the pill and cannot be tapped - you have to scroll, and there is nothing
 * to scroll to.
 *
 * Mobile only: the desktop nav is a fixed TOP bar, so nothing overlaps the
 * bottom of a desktop page.
 */
export default function BottomNavSpacer({ className = "" }) {
    // 6rem = 96px. 82px of pill plus a little breathing room.
    return <div aria-hidden="true" className={`h-24 md:hidden ${className}`} />;
}

export { BottomNavSpacer };
