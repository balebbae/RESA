// lib/pocketbase.ts
import PocketBase from "pocketbase";

console.log(process.env.POCKETBASE_URL);
// Initialize the PocketBase client and export it
const pb = new PocketBase("http://127.0.0.1:8090"); // Your PocketBase instance URL

export default pb;
