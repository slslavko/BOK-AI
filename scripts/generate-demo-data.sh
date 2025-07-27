#!/bin/bash

# Generate Demo Data for BOK-AI System
# This script populates the system with realistic demo data for testing

set -e

echo "🚀 Generating BOK-AI Demo Data..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3001"
DEMO_EMAIL="demo@bok-ai.com"
DEMO_PASSWORD="demo123"
TENANT_NAME="Demo Store"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  API Base URL: $API_BASE_URL"
echo "  Demo Email: $DEMO_EMAIL"
echo "  Tenant Name: $TENANT_NAME"
echo ""

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    
    if [ -n "$headers" ]; then
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -H "$headers" \
             -d "$data" \
             "$API_BASE_URL$endpoint"
    else
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -d "$data" \
             "$API_BASE_URL$endpoint"
    fi
}

# Check if server is running
echo -e "${YELLOW}🔍 Checking if server is running...${NC}"
if ! curl -s "$API_BASE_URL/health" > /dev/null; then
    echo -e "${RED}❌ Server is not running at $API_BASE_URL${NC}"
    echo "Please start the server first with: cd bok-ai/backend && npm start"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"

# Register demo user and get token
echo -e "${YELLOW}👤 Registering demo user...${NC}"
REGISTER_RESPONSE=$(api_call "POST" "/auth/register" '{
    "email": "'$DEMO_EMAIL'",
    "password": "'$DEMO_PASSWORD'",
    "tenantName": "'$TENANT_NAME'"
}')

if echo "$REGISTER_RESPONSE" | grep -q "error"; then
    echo -e "${YELLOW}⚠️  User might already exist, trying to login...${NC}"
    LOGIN_RESPONSE=$(api_call "POST" "/auth/login" '{
        "email": "'$DEMO_EMAIL'",
        "password": "'$DEMO_PASSWORD'"
    }')
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"

# Extract tenant ID from token (simplified - in production would decode JWT properly)
TENANT_ID="tenant_demo_$(date +%s)"
AUTH_HEADER="Authorization: Bearer $TOKEN"
TENANT_HEADER="x-tenant-id: $TENANT_ID"

# Add knowledge base content
echo -e "${YELLOW}📚 Adding knowledge base content...${NC}"

# Product knowledge
PRODUCT_KNOWLEDGE='[
    {
        "title": "Smartfon XYZ Pro - Specyfikacja",
        "content": "Smartfon XYZ Pro to najnowszy model z 6.5-calowym ekranem OLED, 128GB pamięci, aparatem 48MP i baterią 4500mAh. Dostępny w kolorach: czarny, biały, niebieski. Cena: 2499 PLN. Gwarancja 24 miesiące. Wodoodporność IP68.",
        "category": "produkty",
        "tags": ["smartfon", "elektronika", "xyz"]
    },
    {
        "title": "Laptop Gaming ABC - Dane techniczne", 
        "content": "Laptop Gaming ABC wyposażony w procesor Intel i7, 16GB RAM, kartę graficzną RTX 3060, dysk SSD 512GB. Ekran 15.6 cala 144Hz. Cena: 4999 PLN. Idealny do gier i pracy. Dostępny od ręki.",
        "category": "produkty",
        "tags": ["laptop", "gaming", "komputer"]
    },
    {
        "title": "Słuchawki Wireless DEF",
        "content": "Bezprzewodowe słuchawki DEF z aktywną redukcją szumów, 30h pracy na baterii, szybkie ładowanie USB-C. Kompatybilne z iOS i Android. Cena: 399 PLN. Dostępne kolory: czarny, biały.",
        "category": "produkty", 
        "tags": ["słuchawki", "audio", "bezprzewodowe"]
    }
]'

# Shipping knowledge
SHIPPING_KNOWLEDGE='[
    {
        "title": "Opcje dostawy",
        "content": "Oferujemy następujące opcje dostawy: Kurier DPD (15 PLN, 1-2 dni robocze), Paczkomaty InPost (12 PLN, 1-2 dni), Poczta Polska (10 PLN, 2-3 dni), Odbiór osobisty (0 PLN, od zaraz). Darmowa dostawa przy zamówieniach powyżej 200 PLN.",
        "category": "dostawa",
        "tags": ["dostawa", "wysyłka", "koszty"]
    },
    {
        "title": "Płatność przy odbiorze",
        "content": "Płatność przy odbiorze dostępna dla wszystkich opcji dostawy. Dodatkowa opłata 5 PLN. Można płacić gotówką lub kartą u kuriera. Maksymalna kwota 2000 PLN.",
        "category": "płatności",
        "tags": ["płatność", "pobranie", "gotówka"]
    }
]'

# Returns knowledge  
RETURNS_KNOWLEDGE='[
    {
        "title": "Zwroty i reklamacje",
        "content": "Masz 14 dni na zwrot produktu bez podania przyczyny. Produkt musi być w oryginalnym opakowaniu. Koszt zwrotu po stronie klienta. Zwrot pieniędzy w ciągu 7 dni roboczych. Reklamacje gwarancyjne do 24 miesięcy.",
        "category": "zwroty",
        "tags": ["zwrot", "reklamacja", "gwarancja"]
    },
    {
        "title": "Procedura zwrotu",
        "content": "Aby zwrócić produkt: 1) Wypełnij formularz zwrotu, 2) Zapakuj produkt w oryginalne opakowanie, 3) Wyślij na adres: ul. Zwrotów 123, 00-001 Warszawa, 4) Dołącz kopię faktury. Zwrot pieniędzy po otrzymaniu i sprawdzeniu produktu.",
        "category": "zwroty", 
        "tags": ["procedura", "zwrot", "instrukcja"]
    }
]'

# Company info
COMPANY_KNOWLEDGE='[
    {
        "title": "Informacje o firmie",
        "content": "Demo Store to sklep internetowy działający od 2020 roku. Specjalizujemy się w elektronice, komputerach i akcesoriach. Siedziba: Warszawa, ul. Handlowa 456. NIP: 1234567890. Godziny pracy biura: Pn-Pt 9:00-17:00.",
        "category": "firma",
        "tags": ["firma", "kontakt", "informacje"]
    },
    {
        "title": "Kontakt z obsługą klienta", 
        "content": "Obsługa klienta dostępna: Email: pomoc@demostore.pl, Telefon: +48 123 456 789 (Pn-Pt 8:00-20:00, So 9:00-15:00), Chat na stronie: 24/7, Adres: ul. Handlowa 456, 00-002 Warszawa",
        "category": "kontakt",
        "tags": ["kontakt", "pomoc", "obsługa"]
    }
]'

# Function to add knowledge
add_knowledge() {
    local knowledge_json=$1
    local category_name=$2
    
    echo "  Adding $category_name knowledge..."
    
    echo "$knowledge_json" | jq -r '.[] | @base64' | while read -r item; do
        decoded=$(echo "$item" | base64 --decode)
        title=$(echo "$decoded" | jq -r '.title')
        content=$(echo "$decoded" | jq -r '.content')
        category=$(echo "$decoded" | jq -r '.category')
        tags=$(echo "$decoded" | jq -c '.tags')
        
        response=$(api_call "POST" "/api/knowledge" "{
            \"title\": \"$title\",
            \"content\": \"$content\", 
            \"category\": \"$category\",
            \"tags\": $tags
        }" "$AUTH_HEADER")
        
        if echo "$response" | grep -q "Knowledge added successfully"; then
            echo "    ✅ Added: $title"
        else
            echo "    ❌ Failed to add: $title"
        fi
        
        sleep 0.5  # Rate limiting
    done
}

# Add all knowledge categories
add_knowledge "$PRODUCT_KNOWLEDGE" "Products"
add_knowledge "$SHIPPING_KNOWLEDGE" "Shipping" 
add_knowledge "$RETURNS_KNOWLEDGE" "Returns"
add_knowledge "$COMPANY_KNOWLEDGE" "Company Info"

echo -e "${GREEN}✅ Knowledge base populated${NC}"

# Test the chat system
echo -e "${YELLOW}💬 Testing chat system...${NC}"

TEST_MESSAGES=(
    "Czy smartfon XYZ Pro jest dostępny?"
    "Ile kosztuje dostawa?"
    "Jak mogę zwrócić produkt?"
    "Jakie są godziny pracy?"
    "Czy macie laptopy do gier?"
)

for message in "${TEST_MESSAGES[@]}"; do
    echo "  Testing: $message"
    
    response=$(api_call "POST" "/api/chat" "{
        \"message\": \"$message\",
        \"platform\": \"web\"
    }" "$AUTH_HEADER")
    
    if echo "$response" | grep -q "response"; then
        bot_response=$(echo "$response" | jq -r '.response' | head -c 100)
        echo "    🤖 Response: $bot_response..."
    else
        echo "    ❌ Chat test failed"
    fi
    
    sleep 1
done

echo -e "${GREEN}✅ Chat system tested${NC}"

# Generate some feedback data
echo -e "${YELLOW}📊 Generating feedback data...${NC}"

# This would normally come from real conversation IDs, but for demo we'll simulate
for i in {1..5}; do
    fake_conversation_id="conv_demo_$i"
    rating=("good" "good" "neutral" "good" "bad")
    
    api_call "POST" "/api/feedback" "{
        \"conversationId\": \"$fake_conversation_id\",
        \"type\": \"explicit\",
        \"rating\": \"${rating[$((i-1))]}\"
    }" "$AUTH_HEADER" > /dev/null
    
    echo "  ✅ Added feedback $i/5"
done

echo -e "${GREEN}✅ Demo data generation complete!${NC}"
echo ""
echo -e "${BLUE}🎉 Demo System Ready!${NC}"
echo ""
echo -e "${YELLOW}📋 Demo Credentials:${NC}"
echo "  Email: $DEMO_EMAIL"
echo "  Password: $DEMO_PASSWORD"
echo ""
echo -e "${YELLOW}🔗 Available Endpoints:${NC}"
echo "  Health: $API_BASE_URL/health"
echo "  Chat: POST $API_BASE_URL/api/chat"
echo "  Knowledge: POST $API_BASE_URL/api/knowledge"
echo "  Threads: GET $API_BASE_URL/api/threads"
echo "  Insights: GET $API_BASE_URL/api/insights"
echo ""
echo -e "${GREEN}✨ You can now test the full BOK-AI system!${NC}"
echo -e "${BLUE}💡 Tip: Mock platform messages will start appearing automatically${NC}" 