"""
This script performs Post-Training Quantization (PTQ) on an ONNX model using ONNX Runtime.
Post-Training Quantization (PTQ) is a technique used to reduce the size of a model and improve 
its inference speed by converting its weights and activations to lower precision (e.g., INT8). 
This is particularly useful for deploying models on resource-constrained devices.
Functions:
    quantize_dynamic(model_input: str, model_output: str, weight_type: QuantType) -> None:
        Applies dynamic quantization to the given ONNX model. The quantization process reduces 
        the precision of weights to the specified type (e.g., QInt8 or QUInt8).
Variables:
    model_input (str): The file path to the original ONNX model to be quantized.
    model_output (str): The file path where the quantized ONNX model will be saved.
    weight_type (QuantType): The quantization type to use for the weights. Options include:
        - QuantType.QInt8: Signed 8-bit integer quantization.
        - QuantType.QUInt8: Unsigned 8-bit integer quantization.
Usage:
    Update the `model_input` and `model_output` variables with the appropriate file paths 
    before running the script. The script will save the quantized model to the specified 
    output path and print a confirmation message upon completion.
"""

from onnxruntime.quantization import quantize_dynamic, QuantType

# Input and output paths
# model_input = "/home/3cho11/Documents/PyroBlocker/onnxModels/model1/model.onnx"
# model_output = "/home/3cho11/Documents/PyroBlocker/onnxModels/model1/model_quantized.onnx"

# Perform quantization
quantize_dynamic(
    model_input,               # Path to the original model
    model_output,              # Path to save the quantized model
    weight_type=QuantType.QInt8  # Quantization type (use QInt8 or QUInt8)
)

print("Quantization complete. Model saved at:", model_output)
