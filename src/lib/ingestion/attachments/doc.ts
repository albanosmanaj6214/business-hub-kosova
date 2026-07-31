// Legacy binary .doc / .xls (OLE2 compound file). We do NOT parse or execute these
// (no unsafe parser, no AI). We verify the OLE2 signature and record that structured
// text is intentionally unavailable, so the pipeline stays safe + honest.
export interface OleResult { isOle2: boolean; text: null; note: string }
export function handleLegacyOle(buf: Buffer): OleResult {
  const isOle2 = buf.length >= 8 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0
  return { isOle2, text: null, note: isOle2 ? 'legacy OLE2 binary (.doc/.xls) — deterministic text not extracted (no unsafe parse, no AI)' : 'not an OLE2 file' }
}
