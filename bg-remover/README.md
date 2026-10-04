# Forma Studio

A private, browser-based background remover built with React, Vite, and [IMG.LY Background Removal](https://github.com/imgly/background-removal-js).

## Run locally

```sh
npm install
npm run dev
```

The first cutout downloads the model and WebAssembly assets; later runs use the browser cache. Images are processed in the browser and are not uploaded. Fine detail uses IMG.LY's `isnet_fp16` model; Quick pass uses the smaller `isnet_quint8` model. PNG output keeps the processed image dimensions.

Add multiple images at once to the queue, then select and process them individually. Only one image is processed at a time. After processing, download at 100%, 75%, 50%, or 25% of the original output dimensions; resizing happens during export, not during background removal.

The IMG.LY package is licensed under AGPL-3.0. Check its licensing terms before distributing this application.

For best browser performance, the development and preview servers set the cross-origin isolation headers recommended by IMG.LY. Configure equivalent `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers on any production host.

## Deploy to Vercel

Import this repository in Vercel and deploy from the project root. `vercel.json` configures the Vite framework, `npm run build`, the `dist` output directory, and the cross-origin isolation headers required for the browser runtime. No environment variables are required.
