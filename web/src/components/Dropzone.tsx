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
          className="group h-60 w-40 overflow-hidden rounded-lg hover:cursor-pointer"
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
