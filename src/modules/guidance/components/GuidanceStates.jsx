/**
 * Guidance's loading states.
 *
 * The components moved to the shared kit at ../../../components/States.jsx so
 * the marketplace, the library and this module all read from one source.
 * They are re-exported here unchanged so every existing
 * `import { CardListSkeleton } from ".../GuidanceStates"` keeps working,
 * and the file stays the one place this module looks for them.
 */
export {
    Skeleton,
    CardListSkeleton,
    StatsSkeleton,
    Loading,
    ErrorBox,
    Empty,
    Note,
} from "../../../components/States";
