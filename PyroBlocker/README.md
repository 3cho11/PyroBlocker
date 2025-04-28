# PyroBlocker Chrome Extension

## 📦 Requirements

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- npm (comes with Node.js)
- git LFS (to be able to pull the model)

## 🔧 Setup Instructions

Follow these steps to build and run the extension locally:

### 1. Clone the repository

```bash
git clone https://github.com/3cho11/PyroBlocker
cd Pyroblocker
cd public
unzip onnx.zip # (requires git lfs)
cd ..
```

### 2. Install dependencies

npm install

### 3. Build the extension

To start development and bundle the project using Webpack:

npm run dev

    This will create a dist/ directory containing the bundled extension files.

### 4. Load into Chrome

    Open Chrome and go to chrome://extensions/

    Enable Developer Mode (toggle at the top-right)

    Click "Load unpacked"

    Select the dist/ folder created in the previous step

🔁 Rebuilding

After making changes to the source files, simply re-run:

npm run dev

Then refresh the extension in Chrome (chrome://extensions) to apply updates.
