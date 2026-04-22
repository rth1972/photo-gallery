import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const mockUsers = [
  { id: "1", name: "Demo User", email: "demo@example.com", password: "demo123", image: null },
];

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials: any) => {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = mockUsers.find(
          u => u.email === credentials.email && u.password === credentials.password
        );
        
        if (user) {
          return { id: user.id, name: user.name, email: user.email, image: user.image };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});