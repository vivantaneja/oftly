import { Unzip, UnzipInflate } from "fflate";
import { Decompress } from "fzstd";
export const MAX_EXPANDED = 128 * 1024 * 1024;
function join(parts: Uint8Array[], size: number) {
  const out = new Uint8Array(size);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}
export function unpack(data: Uint8Array) {
  if (data.length > 50 * 1024 * 1024)
    throw Error("Choose a package smaller than 50 MB.");
  const files = new Map<string, Uint8Array>();
  let total = 0,
    count = 0;
  const unzip = new Unzip((file) => {
    if (++count > 15000 || (file.originalSize ?? 0) > MAX_EXPANDED)
      throw Error("Package exceeds safe import limits.");
    if (
      files.has(file.name) ||
      file.name.includes("/") ||
      file.name.includes("\\") ||
      file.name === ".."
    )
      throw Error("Package contains an invalid or duplicate filename.");
    files.set(file.name, new Uint8Array());
    const parts: Uint8Array[] = [];
    let size = 0;
    file.ondata = (error, chunk, final) => {
      if (error) throw error;
      size += chunk.length;
      total += chunk.length;
      if (total > MAX_EXPANDED) throw Error("Expanded package exceeds 128 MB.");
      parts.push(chunk);
      if (final) files.set(file.name, join(parts, size));
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  for (let i = 0; i < data.length; i += 65536)
    unzip.push(data.subarray(i, i + 65536), i + 65536 >= data.length);
  return files;
}
// Check every Zstandard frame before the decoder allocates its window. Archive
// limits alone do not bound Anki's additional, inner Zstandard compression.
export function zstd(data: Uint8Array) {
  let pos = 0,
    declaredTotal = 0;
  while (pos < data.length) {
    if (
      pos + 5 > data.length ||
      new DataView(data.buffer, data.byteOffset + pos, 4).getUint32(0, true) !==
        0xfd2fb528
    )
      throw Error("Invalid Zstandard frame.");
    pos += 4;
    const f = data[pos++],
      single = !!(f & 32),
      flag = f >>> 6;
    if (f & 8) throw Error("Unsupported Zstandard frame.");
    if (!single) {
      const w = data[pos++];
      const base = 2 ** (10 + (w >>> 3));
      if (base + (base / 8) * (w & 7) > 64 * 1024 * 1024)
        throw Error("Compressed package requests too much memory.");
    }
    pos += [0, 1, 2, 4][f & 3];
    const bytes = flag === 0 ? (single ? 1 : 0) : [0, 2, 4, 8][flag];
    let size = 0;
    for (let i = 0; i < bytes; i++) size += data[pos + i] * 2 ** (8 * i);
    pos += bytes;
    if (flag === 1) size += 256;
    declaredTotal += size;
    if (
      !Number.isFinite(size) ||
      size > MAX_EXPANDED ||
      declaredTotal > MAX_EXPANDED ||
      (single && size > 64 * 1024 * 1024)
    )
      throw Error("Expanded package exceeds safe import limits.");
    let last = false;
    while (!last) {
      if (pos + 3 > data.length) throw Error("Truncated Zstandard frame.");
      const h = data[pos] + (data[pos + 1] << 8) + (data[pos + 2] << 16);
      pos += 3;
      last = !!(h & 1);
      const type = (h >>> 1) & 3;
      if (type === 3) throw Error("Invalid compressed block.");
      pos += type === 1 ? 1 : h >>> 3;
      if (pos > data.length) throw Error("Truncated compressed block.");
    }
    if (f & 4) pos += 4;
    if (pos > data.length) throw Error("Truncated checksum.");
  }
  let size = 0;
  const parts: Uint8Array[] = [];
  const stream = new Decompress((chunk) => {
    size += chunk.length;
    if (size > MAX_EXPANDED) throw Error("Expanded data exceeds 128 MB.");
    parts.push(chunk);
  });
  for (let i = 0; i < data.length; i += 65536)
    stream.push(data.subarray(i, i + 65536), i + 65536 >= data.length);
  return join(parts, size);
}
export type Proto = Map<number, (number | Uint8Array)[]>;
export function protobuf(bytes: Uint8Array): Proto {
  let i = 0;
  const values: Proto = new Map();
  const integer = () => {
    let n = 0,
      shift = 0;
    while (i < bytes.length && shift < 70) {
      const b = bytes[i++];
      n += (b & 127) * 2 ** shift;
      if (!(b & 128)) return n;
      shift += 7;
    }
    throw Error("Invalid package metadata.");
  };
  while (i < bytes.length) {
    const key = integer(),
      field = Math.floor(key / 8),
      type = key % 8;
    let value: number | Uint8Array;
    if (type === 0) value = integer();
    else if (type === 2) {
      const length = integer();
      if (i + length > bytes.length) throw Error("Invalid metadata length.");
      value = bytes.slice(i, i + length);
      i += length;
    } else if (type === 1 || type === 5) {
      i += type === 1 ? 8 : 4;
      continue;
    } else throw Error("Unsupported package metadata.");
    values.set(field, [...(values.get(field) ?? []), value]);
  }
  return values;
}
export const protoText = (p: Proto, n: number) => {
  const v = p.get(n)?.[0];
  return v instanceof Uint8Array ? new TextDecoder().decode(v) : "";
};
export const mediaType = (name: string) =>
  (
    ({
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      avif: "image/avif",
      mp3: "audio/mpeg",
      ogg: "audio/ogg",
      wav: "audio/wav",
      m4a: "audio/mp4",
    }) as Record<string, string>
  )[name.split(".").pop()?.toLowerCase() ?? ""];
export function validMediaName(name: string) {
  return (
    !!name &&
    name.length < 255 &&
    !/[\x00-\x1f/\\:?#]/.test(name) &&
    name !== ".."
  );
}
