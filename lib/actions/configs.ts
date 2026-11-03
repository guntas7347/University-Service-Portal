"use server";

import { db } from "@/db/drizzel";
import { configs } from "@/db/schema";
import { eq } from "drizzle-orm";

type ConfigResult = {
  success: boolean;
  data: Record<string, unknown> | null;
  message?: string;
};

export async function getConfig(key: string): Promise<ConfigResult> {
  try {
    const [config] = await db
      .select()
      .from(configs)
      .where(eq(configs.key, key))
      .limit(1);

    return {
      success: true,
      data: config?.value ?? null,
    };
  } catch (error) {
    console.error("Get config error:", error);

    return {
      success: false,
      data: null,
      message: "Failed to fetch configuration",
    };
  }
}



export async function upsertConfig(
  key: string,
  value: Record<string, unknown>,
) {
  try {
    if (!key.trim()) {
      return { success: false, message: "Key is required" };
    }

    await db
      .insert(configs)
      .values({
        key,
        value,
      })
      .onConflictDoUpdate({
        target: configs.key,
        set: {
          value,
          updatedAt: new Date(),
        },
      });

    return {
      success: true,
      message: "Configuration saved successfully",
    };
  } catch (error) {
    console.error("Config upsert failed:", error);

    return {
      success: false,
      message: "Failed to save configuration",
    };
  }
}