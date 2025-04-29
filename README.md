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

## 🗂 Project Board & Issue Tracking

We manage tasks, roadmap and bugs on GitHub Projects:
➡️ [PyroBlocker Roadmap & Issues](https://github.com/users/3cho11/projects/4).​


## 📂 Project Structure
```bash
├── Models/                 # necessary files for each candidate models (requires git lfs)
├── PyroBlocker/            # THE FINAL SOFTWARE
├── chromeExtensions/       # all chrome extenions used during development as drafts for the final product
├── dataScraping/           
│   └── raw_urls            # URL lists scraping was applied to
│   └── scrapyHTML          # scrapy.py implementation
├── diagrams/           
│   └── CS350 Demo.mp4      # demo video for  live Presentation (in case of unforseen issue during presentation)
│   └── icon*.png           # logo in different sizes as needed for the extension
│   └── ...
├── localHostAdultPage/           
│   └── index.html          # fake adult page to be used for testing on a local server to avoid accessing adult web-pages
├── model_data_research     # exploratory data analysis and other model / dataset research
├── CITATION.cff           
├── LICENSE                 # MS-RSL license
├── README.md              
├── htmlData.zip            # adult dataset and safe dataset (requires git lfs)
```

## 📄 License

This project is released under the MS-RSL license. See the [LICENSE](LICENSE) file for details.

## 📖 Citation

If you use PyroBlocker in your research, please cite:
```bibtex
@software{Smith_PyroBlocker_2025,
  author       = {Jacob Smith},
  title        = {{PyroBlocker}: Local Web-Page Adult Content Classifier},
  version      = {1.0.0},
  date         = {2025-04-29},
  url          = {https://github.com/3cho11/PyroBlocker},
  doi          = {10.5281/zenodo.YOUR_DOI_HERE}
}
```