import os
import requests
import json

url = "https://api-inference.huggingface.co/models/mdot77/fingpt-llama3-8b-finetuned"
headers = {"Authorization": f"Bearer {os.environ['HF_TOKEN']}"}

prompt = "[INST] <<SYS>>\nYou are a portfolio optimization assistant.\nReturn ONLY valid JSON matching this exact schema:\n{\n  \"ticker\": \"AAPL\",\n  \"snapshot\": \"2025-07-23\",\n  \"verdict\": \"Hold\",\n  \"new_alloc_pct\": 0.15,\n  \"reasoning\": \"Apple remains a strong performer.\"\n}\nNever add extra keys or commentary. Emit only JSON — no prose before or after.\n<</SYS>>\n\nDATA:\n{{}}\n\nNow output the JSON response.\n[/INST]"

payload = {
    "inputs": prompt,
    "parameters": {
        "max_new_tokens": 256,
        "temperature": 0
    }
}

resp = requests.post(url, headers=headers, json=payload)
try:
    print(json.dumps(resp.json(), indent=2))
except Exception:
    print("Raw response:")
    print(resp.text) 