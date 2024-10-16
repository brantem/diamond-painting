importScripts('/wasm_exec.js');

let isinstantiated = false;

self.onmessage = async (e) => {
  if (!isinstantiated) {
    // @ts-ignore
    const go = new Go();
    const result = await WebAssembly.instantiateStreaming(fetch('/generator.wasm'), go.importObject);
    go.run(result.instance);
  }

  try {
    const { data, options } = e.data;
    self.postMessage(self.generate(data, options));
  } catch (err) {
    console.error(err);
  }
};

// to make TS happy
export type {};
