#!/bin/bash

# BOK-AI Ollama Setup Script
# This script downloads and configures Ollama with Llama 3.1 8B model

set -e

echo "🚀 Setting up Ollama for BOK-AI..."

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "Running in Docker container"
    OLLAMA_HOST="http://ollama:11434"
else
    echo "Running on host system"
    OLLAMA_HOST="http://localhost:11434"
fi

# Function to check if Ollama is running
check_ollama() {
    echo "Checking if Ollama is running..."
    for i in {1..30}; do
        if curl -s "$OLLAMA_HOST/api/tags" > /dev/null 2>&1; then
            echo "✅ Ollama is running!"
            return 0
        fi
        echo "Waiting for Ollama to start... ($i/30)"
        sleep 2
    done
    echo "❌ Ollama is not responding after 60 seconds"
    return 1
}

# Function to pull Llama model
pull_llama_model() {
    echo "📥 Pulling Llama 3.1 8B model..."
    
    # Pull the model
    curl -X POST "$OLLAMA_HOST/api/pull" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "llama3.1:8b",
            "stream": false
        }' || {
            echo "❌ Failed to pull Llama 3.1 8B model"
            return 1
        }
    
    echo "✅ Llama 3.1 8B model downloaded successfully!"
}

# Function to test the model
test_model() {
    echo "🧪 Testing Llama 3.1 8B model..."
    
    response=$(curl -s -X POST "$OLLAMA_HOST/api/generate" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "llama3.1:8b",
            "prompt": "Odpowiedz krótko po polsku: Jak się masz?",
            "stream": false,
            "options": {
                "temperature": 0.1,
                "num_predict": 50
            }
        }')
    
    if echo "$response" | grep -q "response"; then
        echo "✅ Model test successful!"
        echo "Response preview:"
        echo "$response" | grep -o '"response":"[^"]*"' | sed 's/"response":"//' | sed 's/"$//' | head -c 100
        echo "..."
    else
        echo "❌ Model test failed"
        echo "Response: $response"
        return 1
    fi
}

# Function to create custom modelfile for Polish optimization
create_polish_modelfile() {
    echo "🇵🇱 Creating Polish-optimized model configuration..."
    
    cat > /tmp/Modelfile.polish << 'EOF'
FROM llama3.1:8b

# Polish language optimization
PARAMETER temperature 0.1
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1

# System prompt for Polish e-commerce assistant
SYSTEM """
Jesteś profesjonalnym asystentem sprzedażowym polskiego sklepu internetowego. 
Odpowiadaj zawsze po polsku, w przyjaznym i pomocnym tonie.
Używaj naturalnego, polskiego języka bez anglicyzmów.
Jeśli nie masz pewnych informacji, powiedz że nie wiesz i przekieruj do konsultanta.
Nie wymyślaj żadnych szczegółów dotyczących produktów, cen czy procedur.
"""

# Polish-specific instructions
TEMPLATE """{{ if .System }}<|start_header_id|>system<|end_header_id|>

{{ .System }}<|eot_id|>{{ end }}{{ if .Prompt }}<|start_header_id|>user<|end_header_id|>

{{ .Prompt }}<|eot_id|>{{ end }}<|start_header_id|>assistant<|end_header_id|>

"""
EOF

    # Create the custom model
    curl -X POST "$OLLAMA_HOST/api/create" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"bok-polish:latest\",
            \"modelfile\": \"$(cat /tmp/Modelfile.polish | sed 's/"/\\"/g' | tr '\n' ' ')\"
        }" || {
            echo "❌ Failed to create Polish-optimized model"
            return 1
        }
    
    echo "✅ Polish-optimized model 'bok-polish:latest' created!"
    rm /tmp/Modelfile.polish
}

# Function to test Polish model
test_polish_model() {
    echo "🧪 Testing Polish-optimized model..."
    
    response=$(curl -s -X POST "$OLLAMA_HOST/api/generate" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "bok-polish:latest",
            "prompt": "Klient pyta: Jakie są warunki zwrotu produktu?",
            "stream": false,
            "options": {
                "temperature": 0.1,
                "num_predict": 100
            }
        }')
    
    if echo "$response" | grep -q "response"; then
        echo "✅ Polish model test successful!"
        echo "Sample response:"
        echo "$response" | grep -o '"response":"[^"]*"' | sed 's/"response":"//' | sed 's/"$//'
    else
        echo "❌ Polish model test failed"
        return 1
    fi
}

# Function to show model info
show_model_info() {
    echo "📊 Available models:"
    curl -s "$OLLAMA_HOST/api/tags" | grep -o '"name":"[^"]*"' | sed 's/"name":"/- /' | sed 's/"$//'
    
    echo ""
    echo "💾 Model sizes and memory usage:"
    curl -s "$OLLAMA_HOST/api/tags" | grep -E '"name"|"size"' | paste - - | sed 's/.*"name":"\([^"]*\)".*"size":\([0-9]*\).*/\1: \2 bytes/'
}

# Main execution
main() {
    echo "🔧 BOK-AI Ollama Setup Starting..."
    echo "Target Ollama host: $OLLAMA_HOST"
    echo ""
    
    # Check if Ollama is running
    if ! check_ollama; then
        echo "Please make sure Ollama is running first:"
        echo "Docker: docker-compose up ollama"
        echo "Local: ollama serve"
        exit 1
    fi
    
    # Pull base model
    if ! pull_llama_model; then
        echo "Failed to pull base model"
        exit 1
    fi
    
    # Test base model
    if ! test_model; then
        echo "Base model test failed"
        exit 1
    fi
    
    # Create Polish-optimized model
    if ! create_polish_modelfile; then
        echo "Failed to create Polish model"
        exit 1
    fi
    
    # Test Polish model
    if ! test_polish_model; then
        echo "Polish model test failed"
        exit 1
    fi
    
    # Show final info
    show_model_info
    
    echo ""
    echo "🎉 Ollama setup completed successfully!"
    echo ""
    echo "Available models:"
    echo "- llama3.1:8b (base model)"
    echo "- bok-polish:latest (Polish-optimized for e-commerce)"
    echo ""
    echo "BOK-AI will automatically use 'bok-polish:latest' for Polish responses."
    echo "You can test the API at: $OLLAMA_HOST/api/generate"
}

# Run main function
main "$@" 