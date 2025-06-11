# test_dummy_prompt.py

import logging
import re
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel

# ———— Setup logging ————
logging.basicConfig(
    format="%(asctime)s %(levelname)s: %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ———— Chat‐format tokens & system prompt ————
B_INST, E_INST = "[INST]", "[/INST]"
B_SYS,  E_SYS  = "<<SYS>>\n", "\n<</SYS>>\n\n"
SYSTEM_PROMPT = (
    "You are a seasoned stock market analyst. Your task is to list the positive "
    "developments and potential concerns for companies based on relevant news and "
    "basic financials from the past weeks, then provide an analysis and prediction "
    "for the companies' stock price movement for the upcoming week."
)

# ———— Model + LoRA adapter configs ————
BASE_MODEL   = "meta-llama/Llama-2-7b-chat-hf"
ADAPTER_NAME = "FinGPT/fingpt-forecaster_dow30_llama2-7b_lora"
OFFLOAD_DIR  = "offload/"

quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

def load_model():
    logger.info("Loading base model with 4-bit quant + offload…")
    base = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        quantization_config=quant_config,
        device_map="auto",
        offload_folder=OFFLOAD_DIR,
        torch_dtype=torch.float16,
        trust_remote_code=True
    )
    logger.info("Attaching FinGPT LoRA adapter…")
    model = PeftModel.from_pretrained(
        base,
        ADAPTER_NAME,
        trust_remote_code=True
    )
    model.eval()
    return model

def simple_generate(model, tokenizer, prompt, max_tokens=64):
    logger.info(f"Prompt:\n{prompt}\n")
    inputs = tokenizer(prompt, return_tensors="pt")
    if torch.cuda.is_available():
        inputs = {k: v.to(model.device) for k, v in inputs.items()}
    with torch.no_grad():
        out_ids = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            do_sample=True,
            temperature=.3,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            use_cache=True
        )
    full = tokenizer.decode(out_ids[0], skip_special_tokens=True)
    print("=== RAW OUTPUT ===")
    print(full)
    # strip everything through [/INST]
    if "[/INST]" in full:
        return re.sub(r".*\[/INST\]\s*", "", full, flags=re.DOTALL).strip()
    else:
        return full.strip()

if __name__ == "__main__":
    # 1) Load tokenizer & model
    logger.info(f"Loading tokenizer for {BASE_MODEL}…")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    model     = load_model()

    # 2) Make up a random test prompt
    body = """
[Company Introduction]:
FooBar Inc. is a hypothetical tech company specializing in quantum networking. It has a market cap of $42.7B and 0.9B shares outstanding.

From 2022-06-01 to 2025-06-01, FooBar's stock price declined from $15.20 to $34.80. Key news items:

[Headline]: FooBar Launches AlphaNet Quantum Router  
[Summary]: Early trials show 2x faster data throughput compared to existing solutions.

[Headline]: Major Teleco Partners Announced  
[Summary]: Three leading telecom providers commit to integrating AlphaNet into their backbones.

[Basic Financials]:
- Revenue: 4.3B
- EPS: 3.1
- P/E: 28.5

Forecast the 7-day price movement for FOBAR:
"""
    # 3) Wrap in chat format
    prompt = (
        "<s>[INST] <<SYS>>\n"
        + SYSTEM_PROMPT
        + "\n<</SYS>>\n\n"
        + body
        + "[/INST]"
    )

    # 4) Generate and print
    forecast = simple_generate(model, tokenizer, prompt, max_tokens=128)
    print(f"\n=== Test Forecast ===\n{forecast}\n")
