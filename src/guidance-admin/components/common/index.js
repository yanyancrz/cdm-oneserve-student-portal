// Shared building blocks.
//
// These are generic (no Library data or context inside them), so instead of
// maintaining a second copy the Guidance module re-exports the ones that live
// under library-admin. Everything guidance-specific stays in this folder.
//
// If a component here ever needs guidance behaviour, fork it into
// components/common/ instead of adding a prop to the shared one.
export { default as AccessDenied } from "../../../library-admin/components/common/AccessDenied";
export { default as ConfirmDialog } from "../../../library-admin/components/common/ConfirmDialog";
export { default as EmptyState } from "../../../library-admin/components/common/EmptyState";
export { default as ErrorMessage } from "../../../library-admin/components/common/ErrorMessage";
export { default as LoadingSpinner } from "../../../library-admin/components/common/LoadingSpinner";
export { default as Modal } from "../../../library-admin/components/common/Modal";
export { default as Pagination } from "../../../library-admin/components/common/Pagination";
export { default as StatusBadge } from "../../../library-admin/components/common/StatusBadge";
export { default as PageHeader } from "../../../library-admin/components/layout/LibraryPageHeader";

// The shell is named after the module it was written for but only draws a
// sidebar + topbar + content placeholders, so it is reused as-is.
export { SkeletonLibraryShell as SkeletonShell } from "../../../library-admin/components/common/Skeleton";
export { Skeleton, SkeletonPageHeader, SkeletonRows } from "../../../library-admin/components/common/Skeleton";
