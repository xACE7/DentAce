"use client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Bi } from "@/lib/content/Bi";

/* Gates the actual lecture/test PAGE. Guests can browse the lists, but opening a
   lecture or test requires being a signed-in member. Admin & granted members pass
   through. When accounts aren't configured (local/dev) there's no gate. The list
   pages stay public — only the content view is gated here. */
export function StudyGate({ kind, children }: { kind: "lecture" | "test"; children: React.ReactNode }) {
  const auth = useAuth();

  // accounts off (local dev) → no gate
  if (!auth || !auth.enabled) return <>{children}</>;

  // still resolving the session — don't flash content to a guest
  if (auth.status === "loading") {
    return (
      <main className="container" id="dmain">
        <section className="section"><p className="empty-note">…</p></section>
      </main>
    );
  }

  const flagOk = kind === "lecture" ? auth.flags.lectures !== false : auth.flags.tests !== false;
  if (auth.user && flagOk) return <>{children}</>;

  const isLec = kind === "lecture";
  return (
    <main className="container" id="dmain">
      <section className="section">
        <div className="gate-card">
          <div className="gate-ico" aria-hidden>🔒</div>
          {!auth.user ? (
            <>
              <h2 className="gate-h">
                <Bi v={{ en: `Sign in to open this ${isLec ? "lecture" : "test"}`, ar: `سجّل الدخول لفتح ${isLec ? "هذه المحاضرة" : "هذا الاختبار"}` }} />
              </h2>
              <p className="gate-p">
                <Bi v={{ en: "Lectures and tests are free for members — create an account or log in to start studying.", ar: "المحاضرات والاختبارات مجّانية للأعضاء — أنشئ حسابًا أو سجّل الدخول لتبدأ المذاكرة." }} />
              </p>
              <button className="gate-btn" type="button" onClick={() => window.dispatchEvent(new CustomEvent("da:open-account"))}>
                <Bi v={{ en: "Sign in / Create account", ar: "تسجيل الدخول / إنشاء حساب" }} />
              </button>
            </>
          ) : (
            <>
              <h2 className="gate-h">
                <Bi v={{ en: `This ${isLec ? "lecture" : "test"} isn't available for your account`, ar: `${isLec ? "هذه المحاضرة" : "هذا الاختبار"} غير متاح لحسابك` }} />
              </h2>
              <p className="gate-p">
                <Bi v={{ en: "Ask the owner to enable access for your account.", ar: "اطلب من المالك تفعيل الوصول لحسابك." }} />
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
