const fs = require('fs');
const path = require('path');

// Script pour générer une image PNG d'un plan de restaurant
// Utilise Canvas via npm ou crée un SVG converti en PNG

try {
  const Canvas = require('canvas');
  const canvas = Canvas.createCanvas(1200, 800);
  const ctx = canvas.getContext('2d');

  // Fond blanc
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, 1200, 800);

  // Bordure de la salle
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, 1100, 700);

  // Porte d'entrée (rectangle)
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(1120, 350, 30, 100);
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.fillText('Entrée', 1090, 410);

  // Cuisine (coin haut droit)
  ctx.fillStyle = '#FFE4B5';
  ctx.fillRect(900, 50, 200, 150);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(900, 50, 200, 150);
  ctx.fillStyle = '#333';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('CUISINE', 920, 140);

  // Bar/Comptoir (bas)
  ctx.fillStyle = '#D2691E';
  ctx.fillRect(50, 700, 300, 50);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 700, 300, 50);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('BAR / COMPTOIR', 90, 735);

  // Toilettes
  ctx.fillStyle = '#E6E6FA';
  ctx.fillRect(50, 550, 120, 120);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 550, 120, 120);
  ctx.fillStyle = '#333';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('WC', 90, 615);

  // Zone principale de tables
  ctx.fillStyle = '#f0f0f0';
  ctx.globalAlpha = 0.3;
  ctx.fillRect(200, 150, 650, 500);
  ctx.globalAlpha = 1;

  // Grille de points pour aider au positionnement
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  for (let x = 200; x <= 850; x += 100) {
    for (let y = 150; y <= 650; y += 100) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Texte de zone
  ctx.fillStyle = '#999';
  ctx.font = '14px Arial';
  ctx.globalAlpha = 0.5;
  ctx.fillText('Zone principale - Cliquez pour placer les tables', 350, 400);
  ctx.globalAlpha = 1;

  // Décoration murs (colonnes)
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(150, 200, 30, 80);
  ctx.fillRect(150, 450, 30, 80);
  ctx.fillRect(1000, 250, 30, 100);
  ctx.fillRect(1000, 500, 30, 100);

  // Titre
  ctx.fillStyle = '#333';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('PLAN DU RESTAURANT', 450, 30);

  // Sauvegarde
  const outputPath = path.join(__dirname, 'frontend-admin', 'public', 'background.png');
  const out = fs.createWriteStream(outputPath);
  const stream = canvas.createPNGStream();
  
  stream.pipe(out);
  out.on('finish', () => {
    console.log(`✓ Image du plan généré: ${outputPath}`);
    process.exit(0);
  });
  
} catch (error) {
  console.error('Erreur Canvas:', error.message);
  console.log('\n⚠️  Canvas non disponible. Génération d\'une version SVG à la place...\n');
  
  // Alternative: génération d'une version SVG
  generateSVG();
}

function generateSVG() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <!-- Fond -->
  <rect width="1200" height="800" fill="#f8f9fa"/>
  
  <!-- Bordure salle -->
  <rect x="50" y="50" width="1100" height="700" fill="none" stroke="#333" stroke-width="3"/>
  
  <!-- Porte d'entrée -->
  <rect x="1120" y="350" width="30" height="100" fill="#8B4513"/>
  <text x="1090" y="410" font-size="12" fill="#333">Entrée</text>
  
  <!-- Cuisine -->
  <rect x="900" y="50" width="200" height="150" fill="#FFE4B5" stroke="#333" stroke-width="2"/>
  <text x="920" y="140" font-size="16" font-weight="bold" fill="#333">CUISINE</text>
  
  <!-- Bar -->
  <rect x="50" y="700" width="300" height="50" fill="#D2691E" stroke="#333" stroke-width="2"/>
  <text x="90" y="735" font-size="16" font-weight="bold" fill="white">BAR / COMPTOIR</text>
  
  <!-- Toilettes -->
  <rect x="50" y="550" width="120" height="120" fill="#E6E6FA" stroke="#333" stroke-width="2"/>
  <text x="90" y="615" font-size="12" font-weight="bold" fill="#333">WC</text>
  
  <!-- Zone principale -->
  <rect x="200" y="150" width="650" height="500" fill="#f0f0f0" opacity="0.3"/>
  
  <!-- Grille de points -->
  ${generateGridPoints()}
  
  <!-- Colonnes -->
  <rect x="150" y="200" width="30" height="80" fill="#e0e0e0"/>
  <rect x="150" y="450" width="30" height="80" fill="#e0e0e0"/>
  <rect x="1000" y="250" width="30" height="100" fill="#e0e0e0"/>
  <rect x="1000" y="500" width="30" height="100" fill="#e0e0e0"/>
  
  <!-- Titre -->
  <text x="450" y="30" font-size="24" font-weight="bold" fill="#333">PLAN DU RESTAURANT</text>
  
  <!-- Zone de texte -->
  <text x="350" y="400" font-size="14" fill="#999" opacity="0.5">Zone principale - Cliquez pour placer les tables</text>
</svg>`;

  const outputPath = path.join(__dirname, 'frontend-admin', 'public', 'background.svg');
  fs.writeFileSync(outputPath, svg);
  console.log(`✓ Plan généré en SVG: ${outputPath}`);
  console.log('\nℹ️  Pour convertir en PNG, utilisez: convert background.svg background.png (ImageMagick)');
  console.log('ou utilisez un convertisseur en ligne: https://svgconvert.com');
}

function generateGridPoints() {
  let points = '';
  for (let x = 200; x <= 850; x += 100) {
    for (let y = 150; y <= 650; y += 100) {
      points += `<circle cx="${x}" cy="${y}" r="3" stroke="#e0e0e0" fill="none"/>\n  `;
    }
  }
  return points;
}
