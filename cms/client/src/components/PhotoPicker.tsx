import { useRef, useState, type ReactNode } from "react";
import { uploadFromComputer, uploadManyFromComputer } from "../lib/upload";
import { Btn } from "./ui";

type Props = {
  label?: string;
  hint?: string;
  multiple?: boolean;
  accept?: string;
  onUploaded: (urls: string[]) => void;
  onError?: (message: string) => void;
  children?: ReactNode;
  className?: string;
};

/** Button + hidden file input so customers can pick photos from their computer. */
export default function PhotoPicker({
  label = "Upload from computer",
  hint,
  multiple = false,
  accept = "image/*",
  onUploaded,
  onError,
  children,
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const media = multiple
        ? await uploadManyFromComputer(files)
        : [await uploadFromComputer(files[0])];
      onUploaded(media.map((m) => m.url));
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {children ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="w-full text-left disabled:opacity-60"
        >
          {busy ? <span className="text-sm text-[var(--muted)]">Uploading…</span> : children}
        </button>
      ) : (
        <Btn type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Uploading…" : label}
        </Btn>
      )}
      {hint && <p className="text-xs text-[var(--muted)] mt-1">{hint}</p>}
    </div>
  );
}
