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
