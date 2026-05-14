// Re-exported from @benkalegin/doodles-core. Single source of truth lives there;
// this shim keeps cd-internal import paths working.
export {
    createClassMember,
    inferClassMemberKind,
    getClassFieldsText,
    getClassMethodsText,
    getClassMembersText,
    replaceClassMembersText,
    normalizeClassAnnotation,
    minimumClassNodeHeight,
} from "@benkalegin/doodles-api";
