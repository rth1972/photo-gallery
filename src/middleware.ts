import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/((?!login|register|api|uploads|_next/static|_next/image|favicon.ico|icon.png|logo.png|apple-touch-icon.png|android-chrome|site.webmanifest|$).*)",
  ],
};