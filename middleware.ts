import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
});

// Proteksi semua route /admin/** kecuali /admin/login
export const config = {
  matcher: ["/admin/((?!login).*)"],
};
