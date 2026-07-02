import {Response} from "express";

export const setCookie = (res: Response, name: string, value: string, options?: any) => {
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        ...options
    };
    res.cookie(name, value, cookieOptions);
};
