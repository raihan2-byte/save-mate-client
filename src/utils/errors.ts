export function extractError(e: unknown, fallback = 'Terjadi kesalahan'): string {
  const err = e as { response?: { data?: { errors?: string; message?: string } } }
  return err?.response?.data?.errors ?? err?.response?.data?.message ?? fallback
}
