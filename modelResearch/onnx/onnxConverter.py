from transformers import AutoModelForSequenceClassification

model = AutoModelForSequenceClassification.from_pretrained("valurank/finetuned-distilbert-adult-content-detection")
model.save_pretrained("/home/3cho11/Documents/PyroBlocker/onnxModels/model2/")