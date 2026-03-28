import os
import openai
from dotenv import load_dotenv

load_dotenv()

def test_openai():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: OPENAI_API_KEY not found in .env")
        return

    client = openai.OpenAI(api_key=api_key)
    try:
        # Just listing models to verify connection
        print("✅ OpenAI SDK version:", openai.__version__)
        print("🚀 Testing connection...")
        models = client.models.list()
        print("✅ Connection successful!")
        print("Top 5 models available:")
        for i, model in enumerate(models.data[:5]):
            print(f"  {i+1}. {model.id}")
    except Exception as e:
        print(f"❌ Error connecting to OpenAI: {e}")

if __name__ == "__main__":
    test_openai()
