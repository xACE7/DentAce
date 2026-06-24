import { supabase } from "@/lib/supabase";

/* Open a PDF that lives in the private 'pdfs' Supabase Storage bucket, via a
   short-lived signed URL. The bucket key is the content path with its leading
   slash stripped (e.g. "3rd-year/3rd-s1/ocih/pdf/ocih-1.pdf"). Storage RLS gates
   who may sign a URL, so this only succeeds for the admin or a granted member.
   We open the tab synchronously inside the click gesture (then redirect it) so
   pop-up blockers don't swallow it. */
export async function openPdf(file: string): Promise<void> {
  if (typeof window === "undefined") return;
  const win = window.open("about:blank", "_blank");

  if (!supabase) {
    // local/dev without Supabase configured → fall back to the static path
    if (win) win.location.href = file;
    return;
  }

  const key = file.replace(/^\//, "");
  const { data, error } = await supabase.storage.from("pdfs").createSignedUrl(key, 120);

  if (error || !data?.signedUrl) {
    win?.close();
    return;
  }
  if (win) { win.opener = null; win.location.href = data.signedUrl; }
  else window.location.href = data.signedUrl;
}
