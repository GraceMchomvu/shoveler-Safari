import { api } from "./api";

export type UploadedMedia = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  altText?: string;
};

export async function uploadFromComputer(
  file: File,
  altText?: string
): Promise<UploadedMedia> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("altText", altText || file.name.replace(/\.[^.]+$/, ""));
  const data = await api<{ media: UploadedMedia }>("/api/admin/media", {
    method: "POST",
    formData: fd,
  });
  return data.media;
}

export async function uploadManyFromComputer(
  files: FileList | File[],
  altText?: string
): Promise<UploadedMedia[]> {
  const out: UploadedMedia[] = [];
  for (const file of Array.from(files)) {
    out.push(await uploadFromComputer(file, altText));
  }
  return out;
}
