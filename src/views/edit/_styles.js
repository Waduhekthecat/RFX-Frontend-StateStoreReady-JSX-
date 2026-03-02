export const styles = {
  // ----------------------------
  // FilterModal
  // ----------------------------
  FilterModalOverlay: "fixed inset-0 z-[999] flex items-center justify-center",
  FilterModalBackdrop: "absolute inset-0 bg-black/80",
  FilterModalCard: [
    "relative",
    "w-[min(1100px,96vw)]",
    "h-[min(680px,88vh)]",
    "rounded-3xl",
    "border border-white/15",
    "bg-[#0b0c0e]",
    "shadow-[0_30px_90px_rgba(0,0,0,0.70)]",
    "p-7",
    "flex flex-col",
  ].join(" "),
  FilterModalHeader: "flex items-start justify-between gap-6",
  FilterModalTitleWrap: "min-w-0",
  FilterModalTitle: "text-[24px] font-semibold tracking-wide text-white/92",
  FilterModalSubtitle: "text-[14px] text-white/45 mt-2",
  FilterModalHeaderButtons: "flex items-center gap-3",

  FilterModalBtnBase: [
    "h-12",
    "text-[15px]",
    "rounded-2xl",
    "border border-white/12",
    "text-white/85",
    "hover:bg-white/10 transition",
    "active:translate-y-[1px]",
  ].join(" "),
  FilterModalBtnClear: ["px-6", "bg-white/6"].join(" "),
  FilterModalBtnDone: ["px-7", "bg-white/12", "text-white/92", "hover:bg-white/16"].join(" "),

  FilterModalBody: "mt-8 flex-1 min-h-0 flex flex-col",
  FilterModalBodyCard: "flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/3 p-6",
  FilterModalRows: "flex flex-col gap-6",
  FilterModalTip: "mt-7 text-[13px] text-white/35",

  // ----------------------------
  // TouchPickerRow
  // ----------------------------
  TouchPickerRowRoot: "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5",
  TouchPickerRowLabel: "text-[16px] font-medium text-white/75 sm:w-[140px]",
  TouchPickerRowButton: [
    "w-full",
    "h-14",
    "rounded-2xl",
    "border border-white/12",
    "bg-black/35",
    "px-5",
    "text-left",
    "text-[17px]",
    "text-white/90",
    "hover:bg-white/6 transition",
    "active:translate-y-[1px]",
    "flex items-center justify-between gap-4",
  ].join(" "),
  TouchPickerRowChevron: "text-white/40 text-[18px]",

  // ----------------------------
  // PickerSheet
  // ----------------------------
  PickerSheetOverlay: [
    "absolute inset-0 z-[10]",
    "rounded-3xl",
    "bg-[#0b0c0e]",
    "border border-white/10",
    "shadow-[0_20px_70px_rgba(0,0,0,0.65)]",
    "flex flex-col",
  ].join(" "),
  PickerSheetHeader: "flex items-center justify-between gap-4 p-5 border-b border-white/10",
  PickerSheetHeaderText: "min-w-0",
  PickerSheetTitle: "text-[20px] font-semibold text-white/90 truncate",
  PickerSheetSubtitle: "text-[13px] text-white/45 mt-1",
  PickerSheetBackBtn: [
    "h-12",
    "px-6",
    "text-[15px]",
    "rounded-2xl",
    "border border-white/12",
    "bg-white/8",
    "text-white/85",
    "hover:bg-white/12 transition",
    "active:translate-y-[1px]",
  ].join(" "),
  PickerSheetListWrap: "flex-1 min-h-0 p-5",
  PickerSheetListCard: [
    "relative h-full",
    "rounded-2xl",
    "border border-white/10",
    "bg-white/3",
    "overflow-hidden",
  ].join(" "),
  PickerSheetFadeTop:
    "pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0b0c0e] to-transparent z-10",
  PickerSheetFadeBottom:
    "pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0b0c0e] to-transparent z-10",
  PickerSheetScroll: "h-full rfxSimpleBar rfxSimpleBar--picker",
  PickerSheetItems: "p-3 pr-4 flex flex-col gap-3",

  PickerSheetItemBase: [
    "w-full",
    "h-16",
    "rounded-2xl",
    "border",
    "px-5",
    "text-left",
    "text-[17px]",
    "hover:bg-white/10 transition",
    "active:translate-y-[1px]",
    "flex items-center justify-between gap-4",
  ].join(" "),
  PickerSheetItemSelected: "border-white/25 bg-white/12 text-white/95",
  PickerSheetItemIdle: "border-white/10 bg-white/6 text-white/85",
  PickerSheetItemCheckOn: "text-[16px] text-white/80",
  PickerSheetItemCheckOff: "text-[16px] text-white/25",

  PickerSheetHintWrap:
    "pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center z-20",
  PickerSheetHint:
    "text-[12px] text-white/40 bg-black/40 border border-white/10 rounded-full px-3 py-1",

  // ----------------------------
  // InstalledFxCard
  // ----------------------------
  InstalledFxCardRootBase: "flex items-center gap-4 px-4 py-4 rounded-xl border border-white/10 bg-white/5",
  InstalledFxCardInteractive: "cursor-pointer hover:bg-white/8 transition",
  InstalledFxCardTitle: "text-[16px] font-semibold leading-tight truncate",
  InstalledFxCardSubStrong: "text-[13px] text-white/55 mt-1 truncate",
  InstalledFxCardSubWeak: "text-[13px] text-white/35 mt-1 truncate",
  InstalledFxCardFormatBadge: "text-[12px] px-3 py-1",

  // ----------------------------
  // InstalledFxCardArea
  // ----------------------------
  InstalledFxEmpty: "text-[12px] text-white/35 px-1 py-2",
  InstalledFxList: "flex flex-col gap-2",

  // ----------------------------
  // InstalledFxShell
  // ----------------------------
  InstalledFxShellRoot: "h-full min-h-0 flex flex-col",
  InstalledFxHeaderLeft: "flex items-center gap-2 min-w-0",
  InstalledFxHeaderTitle: "font-semibold tracking-wide text-white/85 truncate",
  InstalledFxHeaderBadge: "text-[10px]",
  InstalledFxHeaderRight: "flex items-center gap-2",
  InstalledFxFilterBtn: [
    "text-[11px]",
    "rounded-lg border border-white/10 bg-black/30",
    "px-3 py-1.5",
    "text-white/70",
    "hover:bg-white/6 transition",
    "active:translate-y-[1px]",
  ].join(" "),
  InstalledFxInset: "h-full min-h-0 p-3 flex flex-col gap-2",
  InstalledFxScroll: "flex-1 min-h-0 rfxSimpleBar",
  InstalledFxScrollInner: "pr-2",
};