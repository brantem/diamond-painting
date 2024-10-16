import { useDropzone } from 'react-dropzone';

import { cn } from 'lib/helpers';
import { useSettingsStore, useCanvasStore } from 'lib/stores';

export default function Dropzone() {
  const settings = useSettingsStore();
  const canvas = useCanvasStore();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted(files: File[]) {
      const file = files[0];
      if (!file) return;
      canvas.process(file, { size: settings.size, colors: settings.colors });
    },
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="fixed inset-0 z-20 size-full p-4">
      {canvas.isProcessing && (
        <div
          className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 text-sm shadow-xl"
          role="status"
        >
          <svg
            aria-hidden="true"
            className="size-4 animate-spin fill-black text-gray-200"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="text-neutral-500">Processing...</span>
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'flex size-full flex-col items-center justify-center gap-4 rounded-lg border-4 border-dashed',
          isDragActive ? 'border-sky-200 bg-sky-50' : 'border-neutral-200',
        )}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-sky-500">Drop the image here...</p>
        ) : (
          <>
            <p className="font-semibold">Drag and drop an image here, or click to select a file.</p>
            <p className="text-sm text-neutral-500">Or choose from the list of available images below.</p>
            <Images />
          </>
        )}
      </div>
    </div>
  );
}

const images = [
  '/kelly-sikkema-kgmyMSu0kz4-unsplash.jpg',
  '/philip-oroni-CrJGbb7kzU4-unsplash.jpg',
  '/the-new-york-public-library-0XcfadMmTck-unsplash.jpg',
];

function Images() {
  const settings = useSettingsStore();
  const canvas = useCanvasStore();

  return (
    <div className="flex gap-4">
      {images.map((image) => (
        <div
          key={image}
          className="group w-40 overflow-hidden rounded-lg hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            canvas.process(image, { size: settings.size, colors: settings.colors });
          }}
        >
          <img src={image} className="size-full scale-110 object-cover transition-transform group-hover:scale-100" />
        </div>
      ))}
    </div>
  );
}
