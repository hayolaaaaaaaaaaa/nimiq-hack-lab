import { init } from "@nimiq/mini-app-sdk";

let provider: any | null = null;

export async function connectNimiq() {
  try {
    provider ??= await init();
    const accounts = await provider.listAccounts();
    return accounts?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function signScore(message: string) {
  try {
    provider ??= await init();
    return await provider.sign(message);
  } catch {
    return null;
  }
}