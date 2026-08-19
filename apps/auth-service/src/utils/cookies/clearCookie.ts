import { Response } from "express";

/*
  A browser only drops a cookie when the clearing response matches the one that
  set it on name, path, domain, `secure` and `sameSite`. Miss any of those and
  the Set-Cookie is accepted and quietly ignored, which looks exactly like a
  working logout right up until the next request goes out still authenticated.

  These values mirror `setCookie` deliberately — the two belong together, and if
  one changes the other has to follow.
*/
export const clearCookie = (res: Response, name: string) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
};
