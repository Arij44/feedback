export const routes = {
  splash: "/splash" as const,
  login: "/login" as const,
  signup: "/signup" as const,
  welcome: "/welcome" as const,
  home: "/home" as const,
  settings: "/settings" as const,
  myposts: "/myposts" as const,
  addpost: "/addpost" as const,
  search: "/search" as const,
  analysis: "/analysis" as const,
  analysisWithId: (postId: string) => `/analysis/${postId}`,
};

