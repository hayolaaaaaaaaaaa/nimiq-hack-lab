import { init } from "@nimiq/mini-app-sdk";
import HubApi from "@nimiq/hub-api";

let miniProvider: any | null = null;
const HUB_URL = import.meta.env.VITE_HUB_URL || "https://hub.nimiq.com";

export function isNimiqPay(): boolean {
  return typeof window !== "undefined" && (window as any).nimiqPay != null;
}

/**
 * Connect to a Nimiq wallet in either environment:
 * - Inside Nimiq Pay: use the injected Mini App provider + listAccounts().
 * - Normal browser: use Nimiq Hub and request a wallet signature.
 *
 * No private key/seed phrase is ever exposed to the app.
 */
export async function connectNimiq(): Promise<string | null> {
  if (isNimiqPay()) {
    miniProvider ??= await init();
    const accounts = await miniProvider.listAccounts();
    if (!Array.isArray(accounts) || !accounts[0]) throw new Error("No Nimiq account returned");
    return accounts[0];
  }

  const hub = new HubApi(HUB_URL);
  const message = `Nimiq Hack Lab login ${Date.now()}`;
  const signed = await hub.signMessage({
    appName: "Nimiq Hack Lab",
    message,
  });

  const signer = typeof signed?.signer === "string" ? signed.signer.trim() : "";
  if (!signer) throw new Error("Hub did not return a signer address");
  return signer;
}

