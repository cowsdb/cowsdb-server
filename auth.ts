import Elysia from 'elysia';
import { minimatch } from 'minimatch';
const hasher = new Bun.CryptoHasher("sha256");

export class BasicAuthError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export interface BasicAuthUser {
  username: string;
  password: string;
}

export interface BasicAuthConfig {
  users: BasicAuthUser[];
  realm?: string;
  errorMessage?: string;
  exclude?: string[];
  noErrorThrown?: boolean;
}

/* Not a real auth functionm, and does not verify auth!
 * This handler simply extracts basicAuth and passes it
 * to the stack to be used as unique data mountpoint 
 */
export const basicAuth = (config: BasicAuthConfig) =>
  new Elysia({ name: 'basic-auth', seed: config })
    .error({ BASIC_AUTH_ERROR: BasicAuthError })
    .derive((ctx) => {
      // in the case of elysia start event, ctx.headers is undefined
      const authorization = ctx.headers?.authorization;
      if (!authorization)
        return { basicAuth: { isAuthed: false, username: '', token: false } };
      const [username, password] = atob(authorization.split(' ')[1]).split(':');
      if (!username) return { basicAuth: { isAuthed: false, username: '', token: false } };
      hasher.update(username+password);
      return { basicAuth: { isAuthed: true, username: username, token: hasher.digest("hex") } };
    })
    ;

export const isPathExcluded = (path: string, excludedPatterns?: string[]) => {
  if (!excludedPatterns) return false;
  for (const pattern of excludedPatterns) {
    if (minimatch(path, pattern)) return true;
  }
  return false;
};
