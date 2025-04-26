"""
This script is responsible for downloading and saving all the necessary files to run a text classification model fully locally using ONNX.
Functionality:
1. Downloads a pre-trained text classification model and tokenizer from the Hugging Face Transformers library.
2. Saves the model configuration and tokenizer files to a specified local directory.
3. Converts the PyTorch model to the ONNX format for optimized inference.
4. Exports the ONNX model along with dynamic axes for batch size and sequence length, ensuring flexibility during inference.
Key Steps:
- The script uses the `michellejieli/inappropriate_text_classifier` model as an example.
- The model configuration is saved as a JSON file.
- Tokenizer files are saved in the specified output directory.
- A dummy input is prepared to define the input structure for the ONNX export.
- The ONNX model is exported with input and output names, dynamic axes, and an appropriate ONNX opset version.
Output:
All necessary files, including the ONNX model, tokenizer files, and configuration, are saved to the specified `output_dir`. These files enable fully local inference without requiring an internet connection.
Usage:
Run this script to prepare the local environment for inference using the specified model. Ensure that the `output_dir` path is correctly set to store the files in the desired location.
"""

from transformers import AutoTokenizer, AutoModelForSequenceClassification
from pathlib import Path
import torch
import os

# Choose model and output directory
model_id = "michellejieli/inappropriate_text_classifier"
output_dir = Path("PyroBlocker/Models/michellejieli-distilRoBERTa")
output_dir.mkdir(parents=True, exist_ok=True)

# Load model and tokenizer
model = AutoModelForSequenceClassification.from_pretrained(model_id)
tokenizer = AutoTokenizer.from_pretrained(model_id)

# Save model config manually
model.config.to_json_file(output_dir / "config.json")

# Save tokenizer files
tokenizer.save_pretrained(output_dir)

# Prepare dummy inputs
dummy_input = tokenizer("This is a test sentence.", return_tensors="pt")

# Export to ONNX
torch.onnx.export(
    model,
    args=(dummy_input["input_ids"], dummy_input["attention_mask"]),
    f=output_dir / "model.onnx",
    input_names=["input_ids", "attention_mask"],
    output_names=["logits"],
    dynamic_axes={
        "input_ids": {0: "batch_size", 1: "sequence_length"},
        "attention_mask": {0: "batch_size", 1: "sequence_length"},
        "logits": {0: "batch_size"}
    },
    opset_version=14  # You can try 12 or 13 depending on the browser ONNX runtime support
)

print(f"\n✅ All files saved to: {output_dir.absolute()}")