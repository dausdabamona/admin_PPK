#!/bin/bash

###############################################################################
# SSL Certificate Generator for Admin PPK Local Server
#
# This script generates self-signed SSL certificates for HTTPS local server
# allowing mobile devices to access the server securely via WiFi
#
# Usage: ./scripts/generate-ssl.sh
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🔒 Admin PPK SSL Certificate Generator                 ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Create ssl directory if not exists
SSL_DIR="./server/ssl"
mkdir -p $SSL_DIR

# Get laptop's local IP address
echo -e "${YELLOW}🔍 Detecting local IP address...${NC}"

# Try different methods to get IP (works on Linux, macOS, Windows WSL)
if command -v hostname &> /dev/null; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
elif command -v ip &> /dev/null; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}')
elif command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)
else
    echo -e "${YELLOW}⚠️  Could not detect IP automatically. Please enter manually.${NC}"
    read -p "Enter your laptop's local IP address (e.g., 192.168.1.100): " LOCAL_IP
fi

echo -e "${GREEN}✓ Local IP: $LOCAL_IP${NC}"

# Ask for custom domain (optional)
read -p "Enter custom domain (optional, press Enter to skip): " CUSTOM_DOMAIN

if [ -z "$CUSTOM_DOMAIN" ]; then
    CUSTOM_DOMAIN="ppk.local"
fi

echo -e "${YELLOW}🔑 Generating SSL certificate...${NC}"

# Create OpenSSL config file
cat > $SSL_DIR/openssl.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C = ID
ST = Indonesia
L = Jakarta
O = Admin PPK
OU = IT Department
CN = $CUSTOM_DOMAIN

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $CUSTOM_DOMAIN
DNS.2 = localhost
DNS.3 = *.local
IP.1 = 127.0.0.1
IP.2 = $LOCAL_IP
IP.3 = ::1
EOF

# Generate private key
echo -e "${YELLOW}📝 Generating private key...${NC}"
openssl genrsa -out $SSL_DIR/server.key 2048

# Generate certificate signing request
echo -e "${YELLOW}📝 Generating certificate signing request...${NC}"
openssl req -new -key $SSL_DIR/server.key -out $SSL_DIR/server.csr -config $SSL_DIR/openssl.cnf

# Generate self-signed certificate (valid for 365 days)
echo -e "${YELLOW}📝 Generating self-signed certificate...${NC}"
openssl x509 -req -days 365 -in $SSL_DIR/server.csr -signkey $SSL_DIR/server.key -out $SSL_DIR/server.crt -extensions v3_req -extfile $SSL_DIR/openssl.cnf

# Clean up
rm $SSL_DIR/server.csr
rm $SSL_DIR/openssl.cnf

# Set permissions
chmod 600 $SSL_DIR/server.key
chmod 644 $SSL_DIR/server.crt

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ✅ SSL Certificate Generated Successfully!             ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}📄 Files created:${NC}"
echo "   - $SSL_DIR/server.key (Private Key)"
echo "   - $SSL_DIR/server.crt (Certificate)"
echo ""

echo -e "${BLUE}🌐 Server URLs:${NC}"
echo "   - Local:   https://localhost:8443"
echo "   - Network: https://$LOCAL_IP:8443"
echo "   - Domain:  https://$CUSTOM_DOMAIN:8443"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT: Mobile Device Setup${NC}"
echo ""
echo "📱 To access from HP/Tablet, you need to:"
echo ""
echo "1. Connect your mobile device to the SAME WiFi network"
echo ""
echo "2. Open browser and go to: https://$LOCAL_IP:8443"
echo ""
echo "3. You will see 'Certificate Warning' - this is NORMAL for self-signed certificates"
echo ""
echo "4. Click 'Advanced' or 'Details' and then 'Proceed' or 'Continue'"
echo ""
echo "5. Alternatively, install the certificate on your mobile:"
echo "   - Download: https://$LOCAL_IP:8443/certificate"
echo "   - Install in device settings under 'Security' > 'Install Certificate'"
echo ""

echo -e "${YELLOW}💡 Optional: Add to /etc/hosts${NC}"
echo ""
echo "To use custom domain, add this line to /etc/hosts (requires sudo):"
echo -e "${GREEN}$LOCAL_IP    $CUSTOM_DOMAIN${NC}"
echo ""
echo "Then you can access: https://$CUSTOM_DOMAIN:8443"
echo ""

echo -e "${BLUE}🔄 Next Steps:${NC}"
echo ""
echo "1. Update .env file with SSL paths:"
echo "   SSL_KEY_PATH=$SSL_DIR/server.key"
echo "   SSL_CERT_PATH=$SSL_DIR/server.crt"
echo ""
echo "2. Start the server:"
echo "   cd server && npm start"
echo ""
echo "3. Test from mobile:"
echo "   Open https://$LOCAL_IP:8443 in mobile browser"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""

# Offer to update .env automatically
read -p "Do you want to update .env file automatically? (y/n): " UPDATE_ENV

if [ "$UPDATE_ENV" = "y" ] || [ "$UPDATE_ENV" = "Y" ]; then
    ENV_FILE="./server/.env"

    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
        cp ./server/.env.example $ENV_FILE
    fi

    # Update or add SSL paths
    sed -i.bak "s|^SSL_KEY_PATH=.*|SSL_KEY_PATH=$SSL_DIR/server.key|" $ENV_FILE || echo "SSL_KEY_PATH=$SSL_DIR/server.key" >> $ENV_FILE
    sed -i.bak "s|^SSL_CERT_PATH=.*|SSL_CERT_PATH=$SSL_DIR/server.crt|" $ENV_FILE || echo "SSL_CERT_PATH=$SSL_DIR/server.crt" >> $ENV_FILE
    sed -i.bak "s|^HOST=.*|HOST=0.0.0.0|" $ENV_FILE || echo "HOST=0.0.0.0" >> $ENV_FILE

    rm ${ENV_FILE}.bak 2>/dev/null || true

    echo -e "${GREEN}✓ .env file updated${NC}"
fi

echo ""
echo -e "${BLUE}🔐 Security Note:${NC}"
echo "This is a self-signed certificate for LOCAL development only."
echo "For production, use a proper certificate from a Certificate Authority."
echo ""
