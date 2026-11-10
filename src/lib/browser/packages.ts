import { zipSync, strToU8 } from "fflate";
import type { ImportedPackage, Collection } from "./types";
import { allMedia } from "./storage";
export function readPackage(file: File): Promise<ImportedPackage> {
  if (file.size > 50 * 1024 * 1024)
    return Promise.reject(Error("Choose a package smaller than 50 MB."));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./package.worker.ts", import.meta.url), {
      type: "module",
    });
    const stop = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    const timer = setTimeout(() => {
      stop();
      reject(
        Error("This package took too long to read. Export a smaller deck."),
      );
    }, 20000);
    worker.onmessage = (event) => {
      stop();
      if (event.data.error) reject(Error(event.data.error));
      else resolve(event.data.result);
    };
    worker.onerror = () => {
      stop();
      reject(
        Error(
          "Could not read this package. Please check the file and try again.",
        ),
      );
    };
    file
      .arrayBuffer()
      .then((buffer) => worker.postMessage(new Uint8Array(buffer), [buffer]))
      .catch((error) => {
        stop();
        reject(error);
      });
  });
}
export async function downloadBackup(collection: Collection) {
  const files: Record<string, Uint8Array> = Object.create(null),
    manifest: Record<string, string> = Object.create(null);
  files["oftly.json"] = strToU8(JSON.stringify(collection));
  for (const [i, item] of (await allMedia()).entries()) {
    files[String(i)] = new Uint8Array(await item.blob.arrayBuffer());
    manifest[String(i)] = item.name;
  }
  files.media = strToU8(JSON.stringify(manifest));
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(zipSync(files))], { type: "application/zip" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `oftly-${new Date().toISOString().slice(0, 10)}.oftly.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
