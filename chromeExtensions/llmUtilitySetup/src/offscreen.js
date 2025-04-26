import { WebGPUSingleton } from "./LLM";

const webgpu = new WebGPUSingleton();
async function classifySentence(sentence) {
    try {
        const result = await webgpu.classify(sentence);
        console.log(`Classification result: ${result}`);
    } catch (error) {
        console.error('Error classifying sentence:', error);
    }
}

const sentence = "This is a test sentence.";
classifySentence(sentence);