#!/bin/bash

# Configuration
VERSION=$(node -p "require('../package.json').version")
DIST_DIR="../dist"
RELEASE_DIR="../release"
UPDATE_DIR="/var/www/updates"
TIMESTAMP=$(date +%s)

echo "🚀 Starting Server-Side Deployment for Version $VERSION..."

# 1. Install Dependencies
echo "📦 Installing/Updating dependencies..."
npm install --legacy-peer-deps

# 2. Build Project
echo "🛠️  Building project..."
npm run build

# 3. Create Release Directory
mkdir -p $RELEASE_DIR

# 4. Zip the build
echo "🤐 Zipping dist folder..."
ZIP_NAME="dist_${VERSION}.zip"
cd $DIST_DIR
zip -r9 "$RELEASE_DIR/$ZIP_NAME" .
cd -

# 5. Generate capgo.json
echo "📝 Generating capgo.json..."
cat > "$RELEASE_DIR/capgo.json" <<EOF
{
  "version": "$VERSION",
  "url": "https://login.superscanai.com/updates/$ZIP_NAME",
  "note": " deployed at $(date)"
}
EOF

# 6. Deploy to /var/www/updates
echo "🚚 Moving files to $UPDATE_DIR..."
sudo mkdir -p $UPDATE_DIR
sudo cp "$RELEASE_DIR/$ZIP_NAME" "$UPDATE_DIR/"
sudo cp "$RELEASE_DIR/capgo.json" "$UPDATE_DIR/"
sudo chown -R ubuntu:ubuntu $UPDATE_DIR

echo "✨ Deployment Complete!"
echo "🌍 Check: https://login.superscanai.com/updates/capgo.json"
