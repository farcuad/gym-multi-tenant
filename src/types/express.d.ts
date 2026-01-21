import { Request } from "express";
import { TokenPayload } from "./AuthType.ts";
declare global {
    namespace Express {
        interface Request {
            user: TokenPayload
        }
    }
}
