from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("valurank/finetuned-distilbert-adult-content-detection")

encoded = tokenizer("This is a test sentence.", return_tensors="pt")
print("Input IDs:", encoded["input_ids"])
print("Tokens:", tokenizer.convert_ids_to_tokens(encoded["input_ids"][0]))
