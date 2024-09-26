import { useDropzone } from "react-dropzone";

import { cn } from "lib/helpers";
import { usePictureStore } from "lib/stores";

export default function Canvas() {
  const picture = usePictureStore();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted(files: File[]) {
      const file = files[0];
      if (!file) return;
      picture.setFile(file);
    },
    accept: { "image/*": [] },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="flex-1 p-4 h-full justify-center flex items-start xl:items-center">
      {picture.file ? (
        <img
          src={picture.file.preview}
          className="max-h-full max-w-full select-none pointer-events-none"
        />
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "size-full flex items-center justify-center border-4 border-dashed rounded-lg",
            isDragActive ? "border-sky-200 bg-sky-50" : "border-neutral-200"
          )}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-sky-500">Drop the image here...</p>
          ) : (
            <p>Drag and drop an image here, or click to select a file</p>
          )}
        </div>
      )}
    </div>
  );
}
