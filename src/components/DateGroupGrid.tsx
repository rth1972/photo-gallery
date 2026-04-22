// DateGroupGrid is superseded by the date-grouped layout built directly
// into photos/page.tsx using PhotoRowGrid + buildDateGroups.
// This file is kept as a re-export shim so any remaining imports don't break.
export { PhotoRowGrid as DateGroupGrid } from "@/components/PhotoRowGrid";
