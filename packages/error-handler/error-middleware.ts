import { AppError } from "./index";



export const errorMiddleware = (err: Error, req: Request, res: Response) => {

    if (err instanceof AppError) {
        console.log(`Error ${req.method} ${req.url} - ${err.message}`);
    }
}