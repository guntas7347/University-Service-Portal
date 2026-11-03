"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "data");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new Error("No file provided.");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size must not exceed 10 MB.");
    }

    if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
      throw new Error("File type is not allowed.");
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const extension = path.extname(file.name).toLowerCase();
    const filename = `${randomUUID()}${extension}`;
    const filePath = path.join(
      /* turbopackIgnore: true */ UPLOAD_DIR,
      filename,
    );
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, buffer, { flag: "wx" });

    return {
      success: true,
      path: `/data/${filename}`,
      filename,
      error: null,
    };
  } catch (error) {
    console.error("File upload failed:", error);

    return {
      success: false,
      path: null,
      filename: null,
      error: error instanceof Error ? error.message : "Failed to upload file.",
    };
  }
}
