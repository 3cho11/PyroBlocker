from optimum.onnxruntime import ORTModelForSequenceClassification

model = ORTModelForSequenceClassification.from_pretrained("valurank/finetuned-distilbert-adult-content-detection",from_transformers=True)
model.save_pretrained("/home/3cho11/Documents/PyroBlocker/models/onnx/model1/")