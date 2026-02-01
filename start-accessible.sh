#!/bin/bash
# Start server accessible from Windows

echo "🚀 Starting Task Manager accessible from Windows..."
echo ""

# Get WSL IP
WSL_IP=$(ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
echo "📍 WSL IP: $WSL_IP"

# Get Windows host IP
WIN_IP=$(ip route show | grep -i default | awk '{ print $3}')
echo "📍 Windows IP: $WIN_IP"

echo ""
echo "Server will be accessible at:"
echo "  - http://localhost:3000 (from Windows)"
echo "  - http://$WSL_IP:3000 (from WSL)"
echo ""

# Start server bound to all interfaces
node server.js
