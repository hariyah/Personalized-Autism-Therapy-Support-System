# Pull a Smaller Model

## Quick Setup

The system is now configured to use `llama3.2:3b` by default - the smallest model that works well.

### Step 1: Pull the Model

Open a terminal and run:
```cmd
ollama pull llama3.2:3b
```

This will download approximately 2GB. Wait for it to complete.

### Step 2: Verify the Model

Check that it's available:
```cmd
ollama list
```

You should see `llama3.2:3b` in the list.

### Step 3: Test It

Test the model:
```cmd
ollama run llama3.2:3b "Hello, how are you?"
```

If this works, you're ready to go!

### Step 4: Restart Your FastAPI Server

The configuration is already set to use `llama3.2:3b`, so just restart your FastAPI server and try the recommendation request again.

## Alternative Models

If `llama3.2:3b` still causes issues, you can try even smaller models:

**TinyLlama (1.1B - smallest):**
```cmd
ollama pull tinyllama
```
Then update your `.env`:
```
OLLAMA_MODEL=tinyllama
```

**Llama 3.1 4B:**
```cmd
ollama pull llama3.1:4b
```
Then update your `.env`:
```
OLLAMA_MODEL=llama3.1:4b
```

## Model Size Comparison

- `llama3.2:3b` - ~2GB, recommended for most systems
- `llama3.1:4b` - ~2.3GB, slightly better quality
- `llama3.1:8b` - ~4.7GB, better quality but needs more VRAM
- `tinyllama` - ~637MB, smallest but lower quality

The 3B model is a good balance between quality and resource usage.

