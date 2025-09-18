#!/bin/bash

# Hacker League - Start Both Servers Script
# This script starts both the backend and frontend servers

echo "🚀 Starting Hacker League Admin System..."
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Function to start backend server
start_backend() {
    echo "🔧 Starting Backend Server..."
    cd backend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    echo "🚀 Starting backend server on port 5000..."
    npm start &
    BACKEND_PID=$!
    cd ..
}

# Function to start frontend server
start_frontend() {
    echo "⏳ Waiting for backend to start..."
    sleep 3
    
    echo "🎨 Starting Frontend Server..."
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    echo "🚀 Starting frontend server on port 3000..."
    npm start &
    FRONTEND_PID=$!
}

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo "✅ Servers stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start servers
start_backend
start_frontend

echo ""
echo "🎉 Both servers are starting!"
echo "=============================="
echo "📡 Backend API: http://localhost:5000"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 WebSocket: ws://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
wait
