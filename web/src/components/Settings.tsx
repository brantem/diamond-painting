import { useRef } from "react";

import { usePictureStore, useSettingsStore } from "lib/stores";
import { formatNumber, formatBytes, cn } from "lib/helpers";

export default function Settings() {
  const picture = usePictureStore();
  const settings = useSettingsStore();

  return (
    <div className="flex flex-col md:flex-row xl:flex-col items-start max-xl:justify-between gap-4 p-4 max-xl:pb-0 xl:pr-0">
      <Card>
        <h1 className="font-medium text-base">Diamond Painting</h1>
        <label className="flex justify-between items-center text-sm">
          <span className="text-neutral-500">Size</span>
          <input
            type="number"
            value={settings.size}
            onChange={(e) => settings.setSize(parseInt(e.target.value))}
            className="rounded-md w-16 tabular-nums text-right py-1 px-2 border-neutral-200 text-sm"
          />
        </label>
        <label className="flex justify-between items-center text-sm">
          <span className="text-neutral-500">Colors</span>
          <input
            type="number"
            value={settings.colors}
            onChange={(e) => settings.setColors(parseInt(e.target.value))}
            className="rounded-md w-16 tabular-nums text-right py-1 px-2 border-neutral-200 text-sm"
          />
        </label>
      </Card>

      {picture.file && picture.dimensions && (
        <Card>
          <ChangePictureButton />

          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-500">Width</span>
            <span className="tabular-nums">
              {formatNumber(picture.dimensions.width)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-500">Height</span>
            <span className="tabular-nums">
              {formatNumber(picture.dimensions.height)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-500">Size</span>
            <span className="tabular-nums">
              {formatBytes(picture.file.size)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-neutral-500 select-none">
            <hr className="flex-1" />
            <span>Diamonds</span>
            <hr className="flex-1" />
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-500">Count</span>
            <span className="tabular-nums">
              {((w, h) => {
                const aspectRatio = w / h;
                const _h = Math.floor(settings.size / aspectRatio);
                const value = settings.size * _h;
                return (
                  <>
                    {formatNumber(value)} ({formatNumber(settings.size)} x{" "}
                    {formatNumber(_h)})
                  </>
                );
              })(picture.dimensions.width, picture.dimensions.height)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-500">Colors</span>
            <span className="tabular-nums">{settings.colors}</span>
          </div>

          <button
            type="reset"
            className="bg-red-50 text-red-500 w-full rounded-md h-10 px-2 font-medium hover:bg-red-100"
            onClick={() => picture.setFile(null)}
          >
            Reset
          </button>
        </Card>
      )}
    </div>
  );
}

function Card({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg w-full p-3 md:w-[300px] border border-neutral-200 shadow-md shadow-neutral-200 text-sm flex flex-col gap-2",
        className
      )}
      {...props}
    />
  );
}

function ChangePictureButton() {
  const picture = usePictureStore();

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (!e.target.files || !e.target.files.length) return;
          picture.setFile(e.target.files[0]);
        }}
      />
      <button
        className="bg-neutral-900 hover:bg-neutral-800 w-full rounded-md h-10 px-2 font-medium text-white"
        onClick={() => inputRef.current?.click()}
      >
        Change Picture
      </button>
    </div>
  );
}
