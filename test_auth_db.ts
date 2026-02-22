import { authDb } from "./packages/db/src/index.ts";
async function main() {
    console.log("authDb type:", typeof authDb);
    console.log("authDb constructor name:", authDb.constructor.name);
    console.log("authDb keys:", Object.getOwnPropertyNames(authDb));
    // Let's see if user/account exist as properties
    console.log("user exists?", !!(authDb as any).user);
    console.log("account exists?", !!(authDb as any).account);
}
main();
