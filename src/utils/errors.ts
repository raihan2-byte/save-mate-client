export function extractError(e: any, fallback = 'Terjadi kesalahan'): string {
  return e?.response?.data?.errors ?? e?.response?.data?.message ?? fallback
}
