from optimum.onnxruntime import ORTModelForSequenceClassification

model = ORTModelForSequenceClassification.from_pretrained("/home/3cho11/Documents/PyroBlocker/onnxModels/model1/")
print(model.config.id2label)
