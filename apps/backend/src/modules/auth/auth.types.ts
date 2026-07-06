export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  walletAddress: string | null;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    walletAddress: string | null;
    role: string;
  };
  tokens: TokenPair;
}
