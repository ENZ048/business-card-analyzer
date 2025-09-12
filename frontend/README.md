# Super Scanner Frontend

A premium, techy-looking React + Tailwind frontend for a Super Scanner OCR application with advanced features and modern UI design.

## Features

### 🎯 **Dual Mode Operation**
- **Single Card Mode**: Upload front (required) and back (optional) images of business cards
- **Bulk Upload Mode**: Process multiple business card images simultaneously

### 🔍 **OCR Processing**
- AI-powered OCR extraction of contact information
- Real-time progress tracking via WebSocket
- Support for multiple image formats (JPG, PNG, etc.)

### ✏️ **Contact Management**
- Editable contact forms with extracted data
- Multiple phone numbers and email addresses per contact
- Comprehensive field coverage: Name, Title, Company, Phones, Emails, Website, Address

### 📤 **Export Options**
- **VCF (vCard)**: Individual contact export
- **Bulk VCF**: Multiple contacts in single file
- **CSV**: Customizable field selection for spreadsheet export
- **QR Code**: Generate scannable QR codes for contacts

### 🎨 **Premium UI/UX**
- Glassmorphism design with blue-purple gradients
- Smooth animations powered by Framer Motion
- Responsive design for all device sizes
- Modern, futuristic aesthetic

## Tech Stack

- **React 19** - Modern React with hooks
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **lucide-react** - Beautiful, customizable icons
- **framer-motion** - Production-ready motion library
- **Vite** - Fast build tool and dev server

## API Integration

### OCR Endpoints
- `POST /api/ocr/upload` - Process single or bulk business card images
- Form data: `{ cards: [files], userId }`

### Export Endpoints
- `POST /api/export/vcf` - Single contact VCF export
- `POST /api/export/vcf-bulk` - Multiple contacts VCF export
- `POST /api/export/csv` - CSV export with field selection
- `POST /api/export/qr` - QR code generation

### WebSocket Events
- `ws://localhost:5000?userId=abc123`
- Events: `ocr-progress`, `ocr-error`, `ocr-complete`

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development
```bash
# The app will be available at http://localhost:5173
npm run dev
```

## Component Structure

```
src/
├── components/
│   ├── BusinessCardApp.jsx      # Main application component (Super Scanner)
│   └── ui/                      # Reusable UI components
│       ├── button.jsx           # Button with variants
│       ├── input.jsx            # Styled input fields
│       ├── checkbox.jsx         # Glowing checkboxes
│       ├── dialog.jsx           # Modal dialogs
│       └── radio-group.jsx      # Mode toggle buttons
├── lib/
│   └── utils.js                 # Utility functions
└── App.jsx                      # Root component
```

## Usage Flow

### Single Card Processing
1. Select "Single Card" mode
2. Upload front image (required)
3. Optionally upload back image
4. Click "Process Card" to start OCR
5. Edit extracted information
6. Export as VCF or generate QR code

### Bulk Processing
1. Select "Bulk Upload" mode
2. Drag & drop multiple images
3. Click "Process Cards" to start batch OCR
4. Select fields to include in export
5. Export as CSV or VCF

## Customization

### Styling
- Modify `tailwind.config.js` for theme customization
- Update color schemes in component variants
- Adjust glassmorphism effects in CSS variables

### API Configuration
- Update API endpoints in component functions
- Modify WebSocket connection URL
- Adjust request/response handling as needed

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

Built with ❤️ using modern web technologies
