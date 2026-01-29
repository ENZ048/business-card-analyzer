const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

// Configuration
const DIST_DIR = path.join(__dirname, '../dist');
const RELEASE_DIR = path.join(__dirname, '../release');
const VERSION = require('../package.json').version;

// Ensure release directory exists
if (!fs.existsSync(RELEASE_DIR)) {
    fs.mkdirSync(RELEASE_DIR);
}

console.log('🚀 Starting update build process...');

const outputZipPath = path.join(RELEASE_DIR, 'dist.zip');

try {
    // 1. Build the project
    console.log('📦 Building project...');
    execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    // 2. Create the Zip file
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', function () {
        console.log(`✅ Zip created: ${outputZipPath} (${archive.pointer()} total bytes)`);
        createVersionFile();
    });

    archive.on('error', function (err) {
        throw err;
    });

    archive.pipe(output);
    archive.directory(DIST_DIR, false);
    archive.finalize();

} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
}

function createVersionFile() {
    const updateConfig = {
        version: VERSION,
        url: `https://login.superscanai.com/updates/dist_${VERSION}.zip`,
        note: "Update via script"
    };

    const capgoJsonPath = path.join(RELEASE_DIR, 'capgo.json');
    fs.writeFileSync(capgoJsonPath, JSON.stringify(updateConfig, null, 2));
    console.log(`✅ Version file created: ${capgoJsonPath}`);

    // 4. Upload to server
    console.log('🚀 Uploading to server...');
    try {
        const keyAbsPath = path.resolve(__dirname, '../../temp_key.pem');

        // Upload Zip
        const remoteZipName = `dist_${VERSION}.zip`;
        const uploadZipCmd = `scp -i "${keyAbsPath}" -o StrictHostKeyChecking=no "${outputZipPath}" ubuntu@13.204.101.146:/var/www/updates/${remoteZipName}`;
        console.log(`> Uploading zip to ${remoteZipName}...`);
        execSync(uploadZipCmd, { stdio: 'inherit' });

        // Upload JSON
        const uploadJsonCmd = `scp -i "${keyAbsPath}" -o StrictHostKeyChecking=no "${capgoJsonPath}" ubuntu@13.204.101.146:/var/www/updates/capgo.json`;
        console.log(`> Uploading config to capgo.json...`);
        execSync(uploadJsonCmd, { stdio: 'inherit' });

        console.log('✨ Deployed successfully!');
        console.log(`🌍 Checks: https://login.superscanai.com/updates/capgo.json`);
    } catch (err) {
        console.error('❌ Upload failed:', err.message);
        console.log('⚠️ You may need to upload manually.');
    }
}
