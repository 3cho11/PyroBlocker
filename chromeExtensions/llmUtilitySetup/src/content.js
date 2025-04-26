import { LLMSingleton, PipelineSingleton, WebGPUSingleton } from "./LLM";

// Find all content elements on the page and extract their text content.
const elems = findContentElements();
const txts = elems.map(el => (el.textContent || el.innerText).trim());

console.log("chunking text of elements "+txts.length);

(async function () {
    // Load the tokenizer from the LLM singleton instance.
    const tokenizer = await LLMSingleton.getTokenizer();

    // Define an async function to calculate the token length of a given text.
    async function lengthFunction(text){
        const { input_ids } = await tokenizer(text);
        return input_ids.size;
    }

    // Define possible separators used to split the text into chunks.
    const separators = ["\n\n","\n",".","?","!","]",")","'","\"","`","’","”","﹒","﹔","﹖","﹗","．","；","。","！","？","」","』"];

    // Create an instance of RecursiveCharacterTextSplitter for splitting text.
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: LLMSingleton.getMaxSeqLength(),  // Maximum sequence length allowed by the model.
        chunkOverlap: 1,  // Number of characters to overlap between chunks to preserve context.
        separators: separators,  // Use the defined separators to split text.
        lengthFunction: lengthFunction  // Function to determine chunk length.
    });

    // Split the text content of elements into chunks.
    const docs = await splitter.createDocuments(txts);
    console.log("splitted in sentences "+docs.length)

    const vs = []; // Array to store vector embeddings of text chunks.

    {
        let start = performance.now();
        for (const doc of docs){
            doc.metadata = {...doc.metadata, url:document.URL};  // Add metadata containing the current page URL.
            const sentences = [doc.pageContent];  // Prepare content for inference.
            doc.vector = await PipelineSingleton.infer(sentences);  // Get vector embedding using the pipeline.
            vs.push(doc.vector.data);  // Store the vector data.
        }
        let end = performance.now();
        console.log(`Execution time: ${end - start} ms`);

        start = performance.now();
        let embeddings = await PipelineSingleton.infer(docs.map(d=>d.pageContent));  // Batch process all chunks at once.
        end = performance.now();
        console.log(`Batch Execution time: ${end - start} ms`);
    }

    {
        let start = performance.now();
        for (const doc of docs){
            const sentences = [doc.pageContent];
            let vector = await WebGPUSingleton.infer(sentences);  // Perform inference using WebGPU.
        }
        let end = performance.now();
        console.log(`WebGPU Execution time: ${end - start} ms`);

        start = performance.now();
        let embeddings = await WebGPUSingleton.infer(docs.map(d=>d.pageContent));  // Batch inference using WebGPU.
        end = performance.now();
        console.log(`WegGPU Batch Execution time: ${end - start} ms`);
    }
})();
