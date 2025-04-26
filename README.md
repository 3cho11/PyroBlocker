# PyroBlocker

A browser extension built using JavaScript, bundled with Webpack, and powered by an integrated LLM. This tool uses WebGPU accelerated LLM inference to classify the HTML of visited web-pages and block pages considered adult / pornographic - entirely locally!

## 📦 Requirements

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- npm (comes with Node.js)

## 🔧 Setup Instructions

Follow these steps to build and run the extension locally:

### 1. Clone the repository

```bash
git clone https://github.com/3cho11/PyroBlocker
cd your-repo-name
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


## 📂 Project Structure
```bash
├── chromeExtensions/       # all chrome extenions used during development
│   └── ...
├── dataScraping/           
│   └── raw_urls            # URL lists scraping was applied to
│   └── scrapyHTML          # scrapy.py implementation
├── diagrams/           
│   └── CS350 Demo.mp4      # demo video for  live Presentation (in case of unforseen issue during presentation)
│   └── icon*.png           # logo in different sizes as needed from extension
│   └── ...
├── localHostAdultPage/           
│   └── index.html          # fake adult page to be used for testing on a local server to avoid accessing adult web-pages
├── model_data_research     # exploratory data analysis and other model / dataset research
├── Models                  # local download of candidate models
├── ...
├── htmlData.zip            # adult dataset and safe dataset (in between in small enough to directly provided)
└── README.md
```