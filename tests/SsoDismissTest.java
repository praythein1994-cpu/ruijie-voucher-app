public class SsoDismissTest {
    static boolean isAuthenticatedUrl(String url) {
        if (url == null || url.isEmpty()) return false;
        // Still on the SSO login page or inside the /webproxy/sso/back
        // ticket callback — the portal session is not established yet,
        // so keep the dialog open (closing here cuts the session off).
        if (url.contains("/sso/")) return false;
        // The dialog starts at the portal's own SSO entry, so any non-SSO
        // page on cloud-as reached from there is the portal home AFTER the
        // ticket callback created the portal session.
        if (url.contains("cloud-as.ruijienetworks.com")) return true;
        return url.contains("/macc5/") || url.contains("/dashboard")
                || url.contains("/project") || url.contains("/intlSamVoucher")
                || url.contains("/common/api");
    }

    static boolean shouldDismissAsSuccess(String url, boolean sawTicket, boolean sessionAlive) {
        if (url == null || url.isEmpty()) return false;
        if (isAuthenticatedUrl(url)) return true;
        // Fallback: CAS issued a ticket AND the portal session is alive, but
        // the WebView is stuck on a URL our patterns don't recognize (e.g. a
        // blank ticket-callback page). Dismissing is safe here because
        // checkAuth runs in onPageFinished, i.e. after the callback response
        // (which carries the session cookies) was fully received. Never fire
        // while still on the login page.
        return sawTicket && sessionAlive && !url.contains("/sso/login");
    }
    static int pass = 0, fail = 0;
    static void check(String name, boolean actual, boolean expected) {
        if (actual == expected) { pass++; System.out.println("PASS " + name); }
        else { fail++; System.out.println("FAIL " + name + " (got " + actual + ", want " + expected + ")"); }
    }
    public static void main(String[] a) {
        String portal = "https://cloud-as.ruijienetworks.com/macc5/adminIntl/#/";
        String portal2 = "https://cloud-as.ruijienetworks.com/macc5/adminIntl/#/monitor_overview_global_menu";
        String login = "https://cloud-as.ruijienetworks.com/sso/login?service=abc";
        String entry = "https://cloud-as.ruijienetworks.com/webproxy/sso/back";
        String ticket = "https://cloud-as.ruijienetworks.com/webproxy/sso/back?ticket=ST-12345-abcdef";
        check("portal-home", shouldDismissAsSuccess(portal, false, true), true);
        check("portal-hash-route", shouldDismissAsSuccess(portal2, false, true), true);
        check("login-page", shouldDismissAsSuccess(login, false, false), false);
        check("login-page-w-cookies", shouldDismissAsSuccess(login, false, true), false);
        check("entry-no-ticket", shouldDismissAsSuccess(entry, false, true), false);
        check("ticket+session", shouldDismissAsSuccess(ticket, true, true), true);
        check("ticket-no-session", shouldDismissAsSuccess(ticket, true, false), false);
        check("blank-after-ticket", shouldDismissAsSuccess("about:blank", true, true), true);
        check("blank-no-ticket", shouldDismissAsSuccess("about:blank", false, true), false);
        check("login-page-with-ticket-param", shouldDismissAsSuccess(login + "&ticket=ST-1", true, true), false);
        check("null", shouldDismissAsSuccess(null, true, true), false);
        check("empty", shouldDismissAsSuccess("", true, true), false);
        System.out.println("\n" + pass + " passed, " + fail + " failed");
        if (fail > 0) System.exit(1);
    }
}
