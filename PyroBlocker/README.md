# PyroBlocker 🔥🛡️

A browser extension built using JavaScript, bundled with Webpack, and powered by an integrated LLM. This tool uses WebGPU accelerated LLM inference to classify the HTML of visited web-pages and block pages considered adult / pornographic - entirely locally!

## 📦 Requirements

- **Node.js** v16+ and **npm**  
- **Git LFS** (to fetch the ONNX model weights)  

## 🔧 Setup Instructions

Follow these steps to build and run the extension locally:

### 1. Clone the repository

```bash
git clone https://github.com/3cho11/PyroBlocker
cd Pyroblocker
cd PyroBlocker/public
unzip onnx.zip # requires git lfs
cd ..
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the extension

To start development and bundle the project using Webpack:

```bash
npm run dev
```

This will create a dist/ directory containing the bundled extension files.

### 4. Load into Chrome

Open Chrome and go to chrome://extensions/

Enable Developer Mode (toggle at the top-right)

Click "Load unpacked"

Select the PyroBlocker/build/ directory


🔁 Rebuilding

After making changes to the source files, simply refresh the extension in Chrome (chrome://extensions) to apply updates
(assuming the npm run dev is still running).

## 📄 License

This project is released under the MS-RSL license. See the [LICENSE](LICENSE) file for details.