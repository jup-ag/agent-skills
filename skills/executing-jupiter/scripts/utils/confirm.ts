import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export type ConfirmOptions = {
  yes?: boolean;
  message: string;
};

export async function confirmOrThrow({ yes = false, message }: ConfirmOptions): Promise<void> {
  if (yes) return;

  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question(`${message}\nType CONFIRM to proceed or CANCEL to abort: `)).trim().toUpperCase();
    if (answer !== "CONFIRM") {
      throw new Error("Aborted by user");
    }
  } finally {
    rl.close();
  }
}
