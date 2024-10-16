# Diamond Painting

This app generates a diamond painting pattern from any image you choose. It's designed to run locally in your browser and was built primarily to experiment with WebAssembly (WASM). At the moment, the app's functionality is limited to viewing the generated pattern on an infinite canvas.

### Generator

The pattern generator is written in Go and compiled to WebAssembly. If you want to build the generator, follow these steps:

1. Navigate to the `generator` folder.
2. Run the following command:

```bash
make build
```

The compiled WebAssembly file will be located in the `web/public/generator.wasm` directory.

### Current Limitations

- Performance: The generator can be a bit slow, likely due to the overhead of using WASM. While it would probably run faster if written in JavaScript, the goal here was to test WASM, which is why Go was used.
- UI Freezing: When uploading large images, the app freezes for a few seconds during pattern generation. This is because the entire process runs on the main thread. The next step is to move the generation into a Web Worker to prevent UI blocking and improve the overall experience.
