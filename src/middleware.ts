import { authMiddleware, withClerkMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
 
// See https://clerk.com/docs/references/nextjs/auth-middleware
// for more information about configuring your Middleware
 
export default withClerkMiddleware(() =>{
    return NextResponse.next();
});


export const config = {
  matcher: "/((?!_next/image|_next/static|favicon.ico).*)",
};