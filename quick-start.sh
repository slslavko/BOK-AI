#!/bin/bash

# BOK-AI Quick Start Script
# Uruchamia cały system BOK-AI w trybie demo

set -e

echo "🚀 BOK-AI Quick Start"
echo "===================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Please run this script from the bok-ai directory${NC}"
    echo "   cd bok-ai && ./quick-start.sh"
    exit 1
fi

echo -e "${BLUE}📋 Starting BOK-AI Demo System...${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "   Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "   Please install Docker Compose first"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Please install Node.js first: https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    echo "   Please install npm (usually comes with Node.js)"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies found${NC}"

# Setup environment
echo -e "${YELLOW}⚙️  Setting up environment...${NC}"

if [ ! -f ".env" ]; then
    echo "  Creating .env file from template..."
    cp env.example .env
    echo -e "${GREEN}  ✅ .env file created${NC}"
else
    echo -e "${GREEN}  ✅ .env file already exists${NC}"
fi

# Start infrastructure services
echo -e "${YELLOW}🐳 Starting infrastructure services...${NC}"
echo "  This may take a few minutes on first run..."

docker-compose up -d postgres redis qdrant minio

echo -e "${GREEN}✅ Infrastructure services started${NC}"

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
echo "  Waiting for PostgreSQL..."
while ! docker-compose exec -T postgres pg_isready -U bok_admin > /dev/null 2>&1; do
    sleep 2
done
echo -e "${GREEN}  ✅ PostgreSQL ready${NC}"

# Wait for Redis
echo "  Waiting for Redis..."
while ! docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 2
done
echo -e "${GREEN}  ✅ Redis ready${NC}"

# Wait for Qdrant
echo "  Waiting for Qdrant..."
while ! curl -s http://localhost:6333/health > /dev/null 2>&1; do
    sleep 2
done
echo -e "${GREEN}  ✅ Qdrant ready${NC}"

# Setup Ollama (optional, for local AI)
echo -e "${YELLOW}🤖 Setting up Ollama (optional)...${NC}"
if command_exists ollama; then
    echo "  Ollama found, pulling model..."
    ollama pull llama3.1:8b > /dev/null 2>&1 &
    echo -e "${GREEN}  ✅ Ollama model downloading in background${NC}"
else
    echo -e "${YELLOW}  ⚠️  Ollama not found, will use OpenAI only${NC}"
fi

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo "  Installing npm packages..."
    npm install --silent
    echo -e "${GREEN}  ✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}  ✅ Backend dependencies already installed${NC}"
fi

# Build backend
echo -e "${YELLOW}🔨 Building backend...${NC}"
npm run build
echo -e "${GREEN}✅ Backend built successfully${NC}"

# Start backend
echo -e "${YELLOW}🚀 Starting backend server...${NC}"
npm run start:prod &
BACKEND_PID=$!

cd ..

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
while ! curl -s http://localhost:3001/health > /dev/null 2>&1; do
    sleep 2
done
echo -e "${GREEN}✅ Backend server ready${NC}"

# Generate demo data
echo -e "${YELLOW}📊 Generating demo data...${NC}"
chmod +x scripts/generate-demo-data.sh
./scripts/generate-demo-data.sh

# Install frontend dependencies (if frontend exists)
if [ -d "src" ]; then
    echo -e "${YELLOW}🎨 Setting up frontend...${NC}"
    
    if [ ! -d "node_modules" ]; then
        echo "  Installing frontend dependencies..."
        npm install --silent
        echo -e "${GREEN}  ✅ Frontend dependencies installed${NC}"
    fi
    
    echo "  Starting frontend development server..."
    npm run dev &
    FRONTEND_PID=$!
    
    echo -e "${GREEN}✅ Frontend server starting...${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}🎉 BOK-AI Demo System is now running!${NC}"
echo ""
echo -e "${BLUE}📋 System Status:${NC}"
echo "  🐳 Infrastructure: Running (Docker Compose)"
echo "  🚀 Backend API: http://localhost:3001"
if [ -n "$FRONTEND_PID" ]; then
    echo "  🎨 Frontend: http://localhost:3000"
fi
echo "  📊 Grafana: http://localhost:3000 (admin/admin)"
echo "  🔍 Qdrant: http://localhost:6333"
echo ""
echo -e "${YELLOW}🔑 Demo Credentials:${NC}"
echo "  Email: demo@bok-ai.com"
echo "  Password: demo123"
echo ""
echo -e "${BLUE}💡 What's running:${NC}"
echo "  ✅ Multi-tenant PostgreSQL database with RLS"
echo "  ✅ Production RAG system with Qdrant vector DB"
echo "  ✅ Learning system with conversation logging"
echo "  ✅ Mock platform integrations (Allegro, Facebook, OLX)"
echo "  ✅ Real-time WebSocket connections"
echo "  ✅ Demo data with realistic conversations"
echo ""
echo -e "${GREEN}🚀 Ready for demo!${NC}"
echo ""
echo -e "${YELLOW}⚡ Quick API Tests:${NC}"
echo "  Health Check: curl http://localhost:3001/health"
echo "  Chat Test: curl -X POST http://localhost:3001/api/chat \\"
echo "             -H 'Content-Type: application/json' \\"
echo "             -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "             -d '{\"message\":\"Czy smartfon XYZ Pro jest dostępny?\"}'"
echo ""
echo -e "${BLUE}📖 To stop the system:${NC}"
echo "  Press Ctrl+C and run: docker-compose down"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down...${NC}"
    
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    docker-compose down
    echo -e "${GREEN}✅ System stopped${NC}"
    exit 0
}

# Handle Ctrl+C
trap cleanup SIGINT SIGTERM

# Keep script running
echo -e "${BLUE}💡 Press Ctrl+C to stop the system${NC}"
wait 